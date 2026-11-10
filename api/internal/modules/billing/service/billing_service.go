package billingservice

import (
	"context"
	"crypto/tls"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
	"github.com/stripe/stripe-go/v76/webhook"
	"github.com/vitalfit/api/config"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	billingdomain "github.com/vitalfit/api/internal/modules/billing/domain"
	membershipsdomain "github.com/vitalfit/api/internal/modules/memberships/domain"
	productsdomain "github.com/vitalfit/api/internal/modules/products/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/internal/store/cache"
	"github.com/vitalfit/api/pkg/mailer"
	"github.com/vitalfit/api/pkg/pagination"
)

type BillingService struct {
	store  store.Storage
	cache  cache.Storage
	cfg    config.Config
	http   *http.Client
	Mailer mailer.Client
}

func NewBillingService(store store.Storage, cache cache.Storage, cfg config.Config, mailer mailer.Client) *BillingService {
	customTransport := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}

	httpClient := &http.Client{
		Transport: customTransport,
		Timeout:   10 * time.Second,
	}
	stripe.Key = cfg.Stripe.SecretKey
	return &BillingService{
		store:  store,
		cache:  cache,
		cfg:    cfg,
		http:   httpClient,
		Mailer: mailer,
	}
}

func (bs *BillingService) CreateCheckoutSessionForInvoice(ctx context.Context, invoiceID uuid.UUID) (string, error) {
	invoice, err := bs.store.Billing.GetInvoiceByID(ctx, invoiceID)
	if err != nil {
		return "", fmt.Errorf("error getting invoice: %w", err)
	}

	if invoice.Status == billingdomain.InvoiceStatusPaid {
		return "", errors.New("this invoice is already paid")
	}

	var lineItems []*stripe.CheckoutSessionLineItemParams

	unitAmount := invoice.TotalAmount.Mul(decimal.NewFromInt(100)).IntPart()
	productName := fmt.Sprintf("Invoice %s", invoice.InvoiceNumber)

	lineItems = append(lineItems, &stripe.CheckoutSessionLineItemParams{
		PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
			Currency: stripe.String("usd"),
			ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
				Name: stripe.String(productName),
			},
			UnitAmount: stripe.Int64(unitAmount),
		},
		Quantity: stripe.Int64(1),
	})

	baseURL := bs.cfg.FrontURL
	if bs.cfg.FrontURLE != "" {
		baseURL = bs.cfg.FrontURLE
	}
	if baseURL == "" {
		return "", errors.New("frontend URL is not configured")
	}

	baseURL = strings.TrimSpace(baseURL)
	baseURL = strings.TrimSuffix(baseURL, "/")

	if !strings.HasPrefix(baseURL, "http://") && !strings.HasPrefix(baseURL, "https://") {
		baseURL = "http://" + baseURL
	}

	successURL := fmt.Sprintf("%s/payments/%s", baseURL, invoice.InvoiceID.String())
	cancelURL := fmt.Sprintf("%s/payments/%s", baseURL, invoice.InvoiceID.String())

	params := &stripe.CheckoutSessionParams{
		Mode:               stripe.String(string(stripe.CheckoutSessionModePayment)),
		PaymentMethodTypes: stripe.StringSlice([]string{"card"}),
		LineItems:          lineItems,
		ClientReferenceID:  stripe.String(invoice.InvoiceID.String()),
		SuccessURL:         stripe.String(successURL),
		CancelURL:          stripe.String(cancelURL),
		Metadata: map[string]string{
			"user_id": invoice.UserID.String(),
		},
	}

	sess, err := session.New(params)
	if err != nil {
		return "", fmt.Errorf("error generating stripe session: %w", err)
	}

	return sess.URL, nil
}

func (bs *BillingService) HandleStripeWebhook(ctx context.Context, body []byte, signature string) error {
	event, err := webhook.ConstructEventWithOptions(body, signature, bs.cfg.Stripe.WebhookSecret, webhook.ConstructEventOptions{
		IgnoreAPIVersionMismatch: true,
	})
	if err != nil {
		return fmt.Errorf("webhook signature verification failed: %v", err)
	}

	var status billingdomain.PaymentStatus

	switch event.Type {
	case "checkout.session.completed":
		status = billingdomain.PaymentStatusCompleted
	case "checkout.session.async_payment_failed":
		status = billingdomain.PaymentStatusFailed
	default:
		return nil
	}

	var session stripe.CheckoutSession
	if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
		return fmt.Errorf("error parsing webhook JSON: %v", err)
	}

	invoiceID, err := uuid.Parse(session.ClientReferenceID)
	if err != nil {
		return fmt.Errorf("invalid invoice uuid from stripe: %v", err)
	}

	invoice, err := bs.store.Billing.GetInvoiceByID(ctx, invoiceID)
	if err != nil {
		return fmt.Errorf("could not retrieve invoice %s to find branch: %w", invoiceID, err)
	}

	branchPaymentMethods, err := bs.store.PaymentMethods.GetPaymentMethodsFromBranch(ctx, invoice.BranchID)
	if err != nil {
		return fmt.Errorf("could not get payment methods for branch %s: %w", invoice.BranchID, err)
	}

	var paymentMethodID uuid.UUID
	for _, bpm := range branchPaymentMethods {
		if bpm.Method != nil && bpm.IsActive && bpm.Method.Type == billingdomain.PaymentMethodCard && bpm.Method.ProcessingType == billingdomain.PaymentProcessingGateway {
			paymentMethodID = bpm.MethodID
			break
		}
	}

	if paymentMethodID == uuid.Nil {
		return fmt.Errorf("no active card gateway payment method configured for branch %s", invoice.BranchID)
	}
	amountPaid := decimal.NewFromInt(session.AmountTotal).Div(decimal.NewFromInt(100))

	var transactionID string
	if session.PaymentIntent != nil {
		transactionID = session.PaymentIntent.ID
	}

	payment := &billingdomain.Payment{
		InvoiceID:       invoiceID,
		AmountPaid:      amountPaid,
		CurrencyPaid:    "USD",
		PaymentMethodID: paymentMethodID,
		TransactionID:   sql.NullString{String: transactionID, Valid: transactionID != ""},
		Status:          status,
	}

	if err := bs.AddPaymentToInvoice(ctx, payment); err != nil {
		return fmt.Errorf("failed to register stripe payment internally: %w", err)
	}

	return nil
}

func (bs *BillingService) CreateInvoice(ctx context.Context, invoice *billingdomain.Invoice, items []billingdomain.InvoiceItem) error {
	docType, err := bs.store.FiscalDocuments.GetFiscalDocumentTypeByName(ctx, "Invoice")
	if err != nil {
		return err
	}
	policy, err := bs.store.Policies.GetPolicyByKey(ctx, "INVOICE_OVERDUE_TIME_DAYS")
	if err != nil {
		return err
	}
	overDueTime, err := policy.GetInt()
	if err != nil {
		return err
	}
	invoice.DueDate = time.Now().AddDate(0, 0, overDueTime)

	branch, err := bs.store.Branches.GetByID(ctx, invoice.BranchID)
	if err != nil {
		return err
	}

	invoice.DocumentTypeID = docType.DocumentTypeID
	invoice.InvoiceID = uuid.New()
	invoice.InvoiceNumber = docType.Prefix + time.Now().Format("060102") + "-" + invoice.InvoiceID.String()[:8]

	taxRate := billingdomain.GetTaxRateByLocation(branch.State.Country.Name)

	hasActiveMembership, err := bs.store.Membership.ClientHasActiveMembership(ctx, invoice.UserID, 0)
	if err != nil {
		return fmt.Errorf("could not check for active membership: %w", err)
	}

	isBuyingMembership := bs.isPurchasingMembership(items)

	itemNames, err := bs.assignPricesAndGetNames(ctx, items, invoice.BranchID, hasActiveMembership || isBuyingMembership)
	if err != nil {
		return fmt.Errorf("error processing invoice items: %w", err)
	}

	for i := range items {
		items[i].TaxRate = taxRate
	}

	invoice.InvoiceItems = items

	invoice.CalculateTotals()

	err = bs.store.Billing.CreateInvoice(ctx, invoice)
	if err != nil {
		return err
	}

	user, err := bs.store.Users.GetByID(ctx, invoice.UserID)
	if err != nil {
		fmt.Printf("could not get user for email sending: %v", err)
	} else {
		go func() {
			type templateItem struct {
				Name      string
				Quantity  int
				UnitPrice string
				TotalLine string
			}

			templateItems := make([]templateItem, len(invoice.InvoiceItems))
			for i, item := range invoice.InvoiceItems {
				itemName := itemNames[item.InvoiceItemID]
				templateItems[i] = templateItem{
					Name:      itemName,
					Quantity:  item.Quantity,
					UnitPrice: item.UnitPrice.StringFixed(2),
					TotalLine: item.TotalLine.StringFixed(2),
				}
			}

			templateData := map[string]interface{}{
				"ClientFullName": user.FirstName + " " + user.LastName,
				"InvoiceNumber":  invoice.InvoiceNumber,
				"IssueDate":      invoice.IssueDate.Format("02-01-2006"),
				"Items":          templateItems,
				"SubTotal":       invoice.SubTotal.StringFixed(2),
				"Tax":            invoice.Tax.StringFixed(2),
				"Total":          invoice.TotalAmount.StringFixed(2),
			}
			if _, err := bs.Mailer.Send(mailer.InvoiceCreationTemplate, user.FirstName, user.Email, templateData, bs.cfg.Env == "production"); err != nil {
				fmt.Printf("failed to send invoice email: %v", err)
			}
		}()
	}

	return nil
}

func (bs *BillingService) CheckInvoiceAccess(ctx context.Context, user *authdomain.Users, invoiceID uuid.UUID) error {
	invoice, err := bs.store.Billing.GetInvoiceByID(ctx, invoiceID)
	if err != nil {
		return err
	}

	if user.Role.Name == "client" {
		if invoice.UserID != user.UserID {
			return shared_errors.ErrForbidden
		}
		return nil
	}

	if user.Role.Name == "super_admin" {
		return nil
	}

	hasPermission, err := bs.store.Roles.RoleHasPermission(ctx, user.RoleID, "billing:process_payment")
	if err != nil {
		return err
	}
	if !hasPermission {
		return shared_errors.ErrForbidden
	}
	return nil
}

func (bs *BillingService) isPurchasingMembership(items []billingdomain.InvoiceItem) bool {
	for _, item := range items {
		if item.MembershipTypeID.Valid {
			return true
		}
	}
	return false
}

func (bs *BillingService) assignPricesAndGetNames(ctx context.Context, items []billingdomain.InvoiceItem, branchID uuid.UUID, applyMemberPrice bool) (map[uuid.UUID]string, error) {
	membershipIDs := []uuid.UUID{}
	packageIDs := []uuid.UUID{}
	serviceIDs := []uuid.UUID{}

	for _, item := range items {
		if item.InvoiceItemID == uuid.Nil {
			item.InvoiceItemID = uuid.New()
		}

		if item.MembershipTypeID.Valid {
			membershipIDs = append(membershipIDs, item.MembershipTypeID.UUID)
		} else if item.PackageID.Valid {
			packageIDs = append(packageIDs, item.PackageID.UUID)
		} else if item.ServiceID.Valid {
			serviceIDs = append(serviceIDs, item.ServiceID.UUID)
		}
	}

	membershipsMap, err := bs.store.Membership.GetMembershipTypesByIDs(ctx, membershipIDs)
	if err != nil {
		return nil, fmt.Errorf("error fetching membership types: %w", err)
	}

	packagesMap, err := bs.store.Combos.GetPackagesByIDs(ctx, packageIDs)
	if err != nil {
		return nil, fmt.Errorf("error fetching packages: %w", err)
	}

	branchServicesMap, err := bs.store.Products.GetBranchServicesByIDs(ctx, branchID, serviceIDs)
	if err != nil {
		return nil, fmt.Errorf("error fetching branch services: %w", err)
	}

	servicesMap, err := bs.store.Products.GetServicesByIDs(ctx, serviceIDs)
	if err != nil {
		return nil, fmt.Errorf("error fetching service details: %w", err)
	}

	itemNames := make(map[uuid.UUID]string)

	for i := range items {
		item := &items[i]

		if item.MembershipTypeID.Valid {
			membershipType, ok := membershipsMap[item.MembershipTypeID.UUID]
			if !ok {
				return nil, fmt.Errorf("membership type %s not found", item.MembershipTypeID.UUID)
			}
			item.UnitPrice = decimal.NewFromFloat(membershipType.Price)
			itemNames[item.InvoiceItemID] = membershipType.Name
		} else if item.PackageID.Valid {
			pkg, ok := packagesMap[item.PackageID.UUID]
			if !ok {
				return nil, fmt.Errorf("package %s not found", item.PackageID.UUID)
			}
			item.UnitPrice = decimal.NewFromFloat(pkg.Price)
			itemNames[item.InvoiceItemID] = pkg.Name
		} else if item.ServiceID.Valid {
			serviceDetail, ok := branchServicesMap[item.ServiceID.UUID]
			if !ok {
				return nil, fmt.Errorf("service %s not found in branch %s", item.ServiceID.UUID, branchID)
			}

			if applyMemberPrice {
				item.UnitPrice = decimal.NewFromFloat(serviceDetail.PriceForMember)
			} else {
				item.UnitPrice = decimal.NewFromFloat(serviceDetail.PriceForNonMember)
			}

			serviceInfo, ok := servicesMap[item.ServiceID.UUID]
			if !ok {
				return nil, fmt.Errorf("service info for %s not found", item.ServiceID.UUID)
			}
			itemNames[item.InvoiceItemID] = serviceInfo.Name
		}
	}

	return itemNames, nil
}

func (s *BillingService) AddPaymentToInvoice(ctx context.Context, payment *billingdomain.Payment) error {

	invoice, err := s.store.Billing.GetInvoiceByID(ctx, payment.InvoiceID)
	if err != nil {
		return fmt.Errorf("error getting invoice: %w", err)
	}

	if invoice.Status == billingdomain.InvoiceStatusVoid {
		return errors.New("cannot register payment for a voided invoice")
	}

	if invoice.Status == billingdomain.InvoiceStatusPaid {
		return errors.New("cannot register payment for a paid invoice")

	}

	systemBaseCurrency := "USD"

	if payment.CurrencyPaid == systemBaseCurrency {
		payment.AmountBase = payment.AmountPaid
		payment.ExchangeRate = decimal.NewFromInt(1)
		payment.CurrencyBase = systemBaseCurrency
	} else {
		if payment.ExchangeRate.IsZero() {
			return errors.New("the exchange rate cannot be zero")
		}
		payment.AmountBase = payment.AmountPaid.Div(payment.ExchangeRate)
		payment.CurrencyBase = systemBaseCurrency
	}

	payment.PaymentDate = time.Now()

	if err := s.store.Billing.AddPaymentToInvoice(ctx, payment); err != nil {
		return err
	}

	if payment.Status == billingdomain.PaymentStatusCompleted {
		updatedInvoice, err := s.store.Billing.GetInvoiceByID(ctx, payment.InvoiceID)
		if err != nil {
			return errors.New("error getting invoice after payment update")
		}

		if updatedInvoice.GetRemainingDebt().LessThanOrEqual(decimal.Zero) {
			updatedInvoice.Status = billingdomain.InvoiceStatusPaid
			if err := s.UpdateInvoiceStatus(ctx, updatedInvoice); err != nil {
				return err
			}
			if err := s.ActivateInvoiceItems(ctx, updatedInvoice); err != nil {
				fmt.Printf("could not activate items for invoice %s: %v\n", updatedInvoice.InvoiceID, err)
			}
			s.sendPaidInvoiceEmail(updatedInvoice)
		}
	}

	return nil
}

func (s *BillingService) GetInvoiceByID(ctx context.Context, invoiceID uuid.UUID) (*billingdomain.Invoice, error) {
	invoice, err := s.store.Billing.GetInvoiceByID(ctx, invoiceID)
	if err != nil {
		return nil, err
	}

	return invoice, nil
}

func (s *BillingService) GetPaymentByID(ctx context.Context, paymentID uuid.UUID) (*billingdomain.Payment, error) {
	payment, err := s.store.Billing.GetPaymentByID(ctx, paymentID)
	if err != nil {
		return nil, err
	}

	return payment, nil
}

func (s *BillingService) UpdatePaymentStatus(ctx context.Context, payment *billingdomain.Payment) error {
	if err := s.store.Billing.UpdatePaymentStatus(ctx, payment); err != nil {
		return err
	}

	if payment.Status != billingdomain.PaymentStatusCompleted {
		return nil
	}

	invoice, err := s.store.Billing.GetInvoiceByID(ctx, payment.InvoiceID)
	if err != nil {
		return fmt.Errorf("error getting invoice after payment update: %w", err)
	}

	if invoice.Status == billingdomain.InvoiceStatusPaid || invoice.Status == billingdomain.InvoiceStatusVoid {
		return nil
	}

	if invoice.GetRemainingDebt().LessThanOrEqual(decimal.Zero) {
		invoice.Status = billingdomain.InvoiceStatusPaid
		err := s.UpdateInvoiceStatus(ctx, invoice)
		if err != nil {
			return fmt.Errorf("failed to update invoice status to paid: %w", err)
		}
		if err := s.ActivateInvoiceItems(ctx, invoice); err != nil {
			fmt.Printf("could not activate items for invoice %s: %v\n", invoice.InvoiceID, err)
		}
		s.sendPaidInvoiceEmail(invoice)

	}

	return nil
}

func (s *BillingService) UpdateInvoiceStatus(ctx context.Context, invoice *billingdomain.Invoice) error {
	if err := s.store.Billing.UpdateInvoiceStatus(ctx, invoice); err != nil {
		return err
	}

	return nil
}

func (bs *BillingService) sendPaidInvoiceEmail(invoice *billingdomain.Invoice) {
	go func() {
		ctx := context.Background()
		user, err := bs.store.Users.GetByID(ctx, invoice.UserID)
		if err != nil {
			fmt.Printf("could not get user for paid invoice email sending: %v", err)
			return
		}

		type templateItem struct {
			Name      string
			Quantity  int
			UnitPrice string
			TotalLine string
		}

		templateItems := make([]templateItem, len(invoice.InvoiceItems))
		for i, item := range invoice.InvoiceItems {
			var itemName string
			if item.MembershipTypeID.Valid {
				if membership, err := bs.store.Membership.GetMembershipTypeByID(ctx, item.MembershipTypeID.UUID); err == nil {
					itemName = membership.Name
				}
			} else if item.PackageID.Valid {
				if pkg, err := bs.store.Combos.GetPackageByID(ctx, item.PackageID.UUID); err == nil {
					itemName = pkg.Name
				}
			} else if item.ServiceID.Valid {
				if service, err := bs.store.Products.GetServiceByID(ctx, item.ServiceID.UUID); err == nil {
					itemName = service.Name
				}
			}
			if itemName == "" {
				itemName = "Product"
			}
			templateItems[i] = templateItem{Name: itemName, Quantity: item.Quantity, UnitPrice: item.UnitPrice.StringFixed(2), TotalLine: item.TotalLine.StringFixed(2)}
		}

		type templatePayment struct {
			Date   string
			Method string
			Amount string
		}
		templatePayments := make([]templatePayment, len(invoice.Payments))
		for i, p := range invoice.Payments {
			pm, _ := bs.store.PaymentMethods.GetPaymentMethodByID(ctx, p.PaymentMethodID)
			templatePayments[i] = templatePayment{Date: p.PaymentDate.Format("02-01-2006"), Method: pm.DisplayName, Amount: p.AmountPaid.StringFixed(2) + " " + p.CurrencyPaid}
		}

		templateData := map[string]interface{}{
			"ClientFullName": user.FirstName + " " + user.LastName,
			"InvoiceNumber":  invoice.InvoiceNumber,
			"IssueDate":      invoice.IssueDate.Format("02-01-2006"),
			"Items":          templateItems,
			"Payments":       templatePayments,
			"SubTotal":       invoice.SubTotal.StringFixed(2),
			"Tax":            invoice.Tax.StringFixed(2),
			"Total":          invoice.TotalAmount.StringFixed(2),
		}

		if _, err := bs.Mailer.Send(mailer.InvoicePaidTemplate, user.FirstName, user.Email, templateData, bs.cfg.Env == "production"); err != nil {
			fmt.Printf("failed to send paid invoice email: %v", err)
		}
	}()
}

func (bs *BillingService) ActivateInvoiceItems(ctx context.Context, invoice *billingdomain.Invoice) error {
	for _, item := range invoice.InvoiceItems {
		if item.MembershipTypeID.Valid {
			membershipType, err := bs.store.Membership.GetMembershipTypeByID(ctx, item.MembershipTypeID.UUID)
			if err != nil {
				fmt.Printf("error getting membership type %s for invoice %s: %v\n", item.MembershipTypeID.UUID, invoice.InvoiceID, err)
				continue
			}

			startDate := time.Now()
			endDate := startDate.AddDate(0, 0, membershipType.DurationDays*item.Quantity)

			existingMembership, err := bs.store.Membership.GetClientMembership(ctx, invoice.UserID)
			if err == nil && existingMembership.EndDate.After(startDate) {
				endDate = existingMembership.EndDate.AddDate(0, 0, membershipType.DurationDays*item.Quantity)
				startDate = existingMembership.StartDate
			}

			clientMembership := membershipsdomain.ClientMembership{
				MembershipTypeID: item.MembershipTypeID.UUID,
				InvoiceID:        invoice.InvoiceID,
				UserID:           invoice.UserID,
				StartDate:        startDate,
				EndDate:          endDate,
				Status:           membershipsdomain.StatusActive,
			}

			if err := bs.store.Membership.UpdateClientMembership(ctx, &clientMembership); err != nil {
				return fmt.Errorf("failed to update client membership for user %s: %w", invoice.UserID, err)
			}

			if err := bs.store.Users.UpdateClientCategory(ctx, invoice.UserID, authdomain.ClientCategoryVIP); err != nil {
				fmt.Printf("could not update client category to VIP for user %s: %v\n", invoice.UserID, err)
			}
		} else if item.PackageID.Valid {
			pkg, err := bs.store.Combos.GetPackageByID(ctx, item.PackageID.UUID)
			if err != nil {
				fmt.Printf("error getting package %s for invoice %s: %v\n", item.PackageID.UUID, invoice.InvoiceID, err)
				continue
			}

			for _, packageItem := range pkg.PackageItems {
				clientServiceBalance := productsdomain.ClientServiceBalance{
					UserID:    invoice.UserID,
					ServiceID: packageItem.ServiceID,
					Balance:   packageItem.SessionsIncluded * item.Quantity,
				}
				if err := bs.store.Products.ClientServiceBalance(ctx, &clientServiceBalance); err != nil {
					fmt.Printf("error updating client service balance for user %s, service %s: %v\n", invoice.UserID, packageItem.ServiceID, err)
				}
			}
		} else if item.ServiceID.Valid {
			clientServiceBalance := productsdomain.ClientServiceBalance{
				UserID:    invoice.UserID,
				ServiceID: item.ServiceID.UUID,
				Balance:   item.Quantity,
			}
			if err := bs.store.Products.ClientServiceBalance(ctx, &clientServiceBalance); err != nil {
				fmt.Printf("error updating client service balance for user %s, service %s: %v\n", invoice.UserID, item.ServiceID.UUID, err)
			}
		}
	}
	return nil
}

func (bs *BillingService) GetClientIvoices(ctx context.Context, userID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*billingdomain.Invoice, int64, error) {
	invoices, total, err := bs.store.Billing.GetClientIvoices(ctx, userID, fq)
	if err != nil {
		return nil, 0, err
	}

	return invoices, total, nil
}

func (bs *BillingService) GetInvoices(ctx context.Context, fq pagination.PaginatedFeedQuery, branchIDs []uuid.UUID) ([]*billingdomain.Invoice, int64, error) {
	return bs.store.Billing.GetInvoices(ctx, fq, branchIDs)
}

func (bs *BillingService) GetTaxRateByBranchID(ctx context.Context, branchID uuid.UUID) (decimal.Decimal, error) {
	branch, err := bs.store.Branches.GetByID(ctx, branchID)
	if err != nil {
		return decimal.Zero, err
	}

	return billingdomain.GetTaxRateByLocation(branch.State.Country.Name), nil
}
