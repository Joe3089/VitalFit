package billinghandlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	billingdomain "github.com/vitalfit/api/internal/modules/billing/domain"
)

type CreatePaymentMethodPayload struct {
	Name                string          `json:"name" binding:"required"`
	Type                string          `json:"type" binding:"required"`
	Description         string          `json:"description"`
	ProcessingType      string          `json:"processing_type" binding:"required"`
	DisplayName         string          `json:"display_name"`
	Configuration       json.RawMessage `json:"configuration,omitempty" swaggertype:"object"`
	Visibility          string          `json:"visibility"`
	SurchargeFixed      int64           `json:"surcharge_fixed"`
	SurchargePercentage float64         `json:"surcharge_percentage"`
}

func (p *CreatePaymentMethodPayload) toPaymentMethod() *billingdomain.PaymentMethods {
	return &billingdomain.PaymentMethods{
		Name:                p.Name,
		Type:                billingdomain.PaymentMethodTypeEnum(p.Type),
		Description:         p.Description,
		ProcessingType:      billingdomain.PaymentProcessingTypeEnum(p.ProcessingType),
		DisplayName:         p.DisplayName,
		Visibility:          billingdomain.BranchPaymentVisibilityEnum(p.Visibility),
		SurchargeFixed:      p.SurchargeFixed,
		SurchargePercentage: p.SurchargePercentage,
	}
}

type UpdatePaymentMethodPayload struct {
	Name                string          `json:"name"`
	Type                string          `json:"type"`
	Description         string          `json:"description"`
	ProcessingType      string          `json:"processing_type" binding:"required"`
	DisplayName         string          `json:"display_name"`
	Configuration       json.RawMessage `json:"configuration,omitempty" swaggertype:"object"`
	Visibility          string          `json:"visibility"`
	SurchargeFixed      int64           `json:"surcharge_fixed"`
	SurchargePercentage float64         `json:"surcharge_percentage"`
}

func (p *UpdatePaymentMethodPayload) toPaymentMethod() *billingdomain.PaymentMethods {
	return &billingdomain.PaymentMethods{
		Name:           p.Name,
		Type:           billingdomain.PaymentMethodTypeEnum(p.Type),
		Description:    p.Description,
		ProcessingType: billingdomain.PaymentProcessingTypeEnum(p.ProcessingType),
	}
}

type MethodBranchConfigPayload struct {
	MethodID []string `json:"method_id" binding:"required"`
}

type ZelleConfig struct {
	Email string `json:"email" binding:"required,email"`
}
type BankTransferConfig struct {
	BankName      string `json:"bank_name" binding:"required"`
	AccountNumber string `json:"account_number" binding:"required"`
	TaxID         string `json:"tax_id" binding:"required"`
}
type PagoMovilConfig struct {
	Phone  string `json:"phone" binding:"required"`
	BankID string `json:"bank_id" binding:"required"`
	TaxID  string `json:"tax_id" binding:"required"`
}

type UpdateBranchConfigPayload struct {
	IsActive string `json:"is_active,omitempty"`
}

type BranchPaymentMethodResponse struct {
	BranchID uuid.UUID `json:"branch_id" binding:"required"`
	MethodID uuid.UUID `json:"method_id" binding:"required"`
	Name     string    `json:"name" binding:"required"`
	Type     string    `json:"type" binding:"required"`
	IsActive bool      `json:"is_active" binding:"required"`
}

func (h *BillingHandlers) validateBranchConfig(payloadConfig json.RawMessage, method *billingdomain.PaymentMethods) error {

	switch method.Type {

	case billingdomain.PaymentMethodTransfer:

		if strings.Contains(method.Name, "Zelle") {
			var zelleConfig ZelleConfig
			if err := json.Unmarshal(payloadConfig, &zelleConfig); err != nil {
				return errors.New("invalid configuration json for Zelle")
			}
			if err := validate.Struct(zelleConfig); err != nil {
				return err
			}

		} else if strings.Contains(method.Name, "Bank Transfer") {
			var bankTransferConfig BankTransferConfig
			if err := json.Unmarshal(payloadConfig, &bankTransferConfig); err != nil {
				return errors.New("invalid configuration json for Bank Transfer")
			}
			if err := validate.Struct(bankTransferConfig); err != nil {
				return err
			}

		} else if strings.Contains(method.Name, "Pago Movil") {
			var pagoMovilConfig PagoMovilConfig
			if err := json.Unmarshal(payloadConfig, &pagoMovilConfig); err != nil {
				return errors.New("invalid configuration json for Pago Móvil")
			}
			if err := validate.Struct(pagoMovilConfig); err != nil {
				return err
			}

		} else {
			return errors.New("configuration not supported for this transfer method")
		}

	case billingdomain.PaymentMethodCard:
		if string(payloadConfig) != "{}" && string(payloadConfig) != "" {
			return errors.New("configuration must be empty for Card methods")
		}

	case billingdomain.PaymentMethodCash:
		if string(payloadConfig) != "{}" && string(payloadConfig) != "" {
			return errors.New("configuration must be empty for Cash")
		}

	case billingdomain.PaymentMethodOther:
		if string(payloadConfig) != "{}" && string(payloadConfig) != "" {
			return errors.New("configuration not supported for 'Other' type")
		}

	default:
		return errors.New("internal validation error: unhandled payment type")
	}

	return nil
}

type CreateFiscalDocumentTypePayload struct {
	Name   string `json:"name" binding:"required"`
	Prefix string `json:"prefix" binding:"required"`
}

func (p *CreateFiscalDocumentTypePayload) ToFiscalDocumentType() *billingdomain.FiscalDocumentType {
	return &billingdomain.FiscalDocumentType{
		Name:   p.Name,
		Prefix: p.Prefix,
	}
}

type UpdateFiscalDocumentTypePayload struct {
	Name   string `json:"name,omitempty"`
	Prefix string `json:"prefix,omitempty"`
}

func (p *UpdateFiscalDocumentTypePayload) ToFiscalDocumentType() *billingdomain.FiscalDocumentType {
	return &billingdomain.FiscalDocumentType{
		Name:   p.Name,
		Prefix: p.Prefix,
	}
}

type FiscalDocumentTypeResponse struct {
	DocumentTypeID uuid.UUID `json:"document_type_id"`
	Name           string    `json:"name"`
	Prefix         string    `json:"prefix"`
	CreatedAt      time.Time `json:"created_at"`
}

func NewFiscalDocumentTypeResponse(docType *billingdomain.FiscalDocumentType) *FiscalDocumentTypeResponse {
	return &FiscalDocumentTypeResponse{
		DocumentTypeID: docType.DocumentTypeID,
		Name:           docType.Name,
		Prefix:         docType.Prefix,
		CreatedAt:      docType.CreatedAt,
	}
}

//orders payload

type CreateInvoicePayload struct {
	UserID   *uuid.UUID `json:"user_id"`
	BranchID *uuid.UUID `json:"branch_id" binding:"required"`

	Items []ItemDTO `json:"items" binding:"required,min=1,dive"`
}

type ItemDTO struct {
	ItemID   uuid.UUID `json:"item_id" binding:"required"`
	ItemType string    `json:"item_type" binding:"required,oneof=membership package service"`
	Quantity int       `json:"quantity" binding:"required,min=1"`
}

func (i *CreateInvoicePayload) ToInvoice() *billingdomain.Invoice {
	invoice := &billingdomain.Invoice{
		BranchID:       *i.BranchID,
		IssueDate:      time.Now(),
		TotalAmount:    decimal.Zero,
		Tax:            decimal.Zero,
		Status:         billingdomain.InvoiceStatusUnpaid,
		DocumentTypeID: uuid.Nil,
	}
	return invoice
}

func (i *CreateInvoicePayload) ToInvoiceItems() []billingdomain.InvoiceItem {
	invoiceItems := make([]billingdomain.InvoiceItem, len(i.Items))
	for idx, item := range i.Items {
		invoiceItem := billingdomain.InvoiceItem{
			Quantity: item.Quantity,
		}
		switch item.ItemType {
		case "membership":
			invoiceItem.MembershipTypeID = uuid.NullUUID{UUID: item.ItemID, Valid: true}
		case "package":
			invoiceItem.PackageID = uuid.NullUUID{UUID: item.ItemID, Valid: true}
		case "service":
			invoiceItem.ServiceID = uuid.NullUUID{UUID: item.ItemID, Valid: true}
		}
		invoiceItems[idx] = invoiceItem
	}
	return invoiceItems
}

type CreatePaymentPayload struct {
	InvoiceID       uuid.UUID       `json:"invoice_id" binding:"required"`
	PaymentMethodID uuid.UUID       `json:"payment_method_id" binding:"required"`
	AmountPaid      decimal.Decimal `json:"amount_paid" binding:"required"`
	CurrencyPaid    string          `json:"currency_paid" binding:"required,len=3"`
	TransactionID   string          `json:"transaction_id"`
	ReceiptURL      string          `json:"receipt_url"`
}

func (p *CreatePaymentPayload) ToPayment() *billingdomain.Payment {
	return &billingdomain.Payment{
		InvoiceID:       p.InvoiceID,
		PaymentMethodID: p.PaymentMethodID,
		AmountPaid:      p.AmountPaid,
		CurrencyPaid:    p.CurrencyPaid,
		TransactionID:   sql.NullString{String: p.TransactionID, Valid: p.TransactionID != ""},
		ReceiptURL:      sql.NullString{String: p.ReceiptURL, Valid: p.ReceiptURL != ""},
		Status:          billingdomain.PaymentStatusPending,
	}
}

type UpdatePaymentStatus struct {
	Status string `json:"status" binding:"required,oneof=Completed Failed Refunded Pending"`
}

// InvoiceResponse define la estructura de la respuesta para una factura.
type InvoiceResponse struct {
	InvoiceID     uuid.UUID             `json:"invoice_id"`
	UserID        uuid.UUID             `json:"user_id"`
	BranchID      uuid.UUID             `json:"branch_id"`
	InvoiceNumber string                `json:"invoice_number"`
	IssueDate     time.Time             `json:"issue_date"`
	DueDate       time.Time             `json:"due_date"`
	SubTotal      decimal.Decimal       `json:"sub_total"`
	Tax           decimal.Decimal       `json:"tax"`
	TotalAmount   decimal.Decimal       `json:"total_amount"`
	Status        string                `json:"status"`
	CreatedAt     time.Time             `json:"created_at"`
	InvoiceItems  []InvoiceItemResponse `json:"invoice_items,omitempty"`
	Payments      []PaymentResponse     `json:"payments,omitempty"`
}

// InvoiceItemResponse define la estructura de la respuesta para un item de la factura.
type InvoiceItemResponse struct {
	InvoiceItemID    uuid.UUID       `json:"invoice_item_id"`
	Quantity         int             `json:"quantity"`
	UnitPrice        decimal.Decimal `json:"unit_price"`
	DiscountApplied  decimal.Decimal `json:"discount_applied"`
	TaxRate          decimal.Decimal `json:"tax_rate"`
	TaxAmount        decimal.Decimal `json:"tax_amount"`
	Subtotal         decimal.Decimal `json:"subtotal"`
	TotalLine        decimal.Decimal `json:"total_line"`
	MembershipTypeID *uuid.UUID      `json:"membership_type_id,omitempty"`
	ServiceID        *uuid.UUID      `json:"service_id,omitempty"`
	PackageID        *uuid.UUID      `json:"package_id,omitempty"`
}

// PaymentResponse define la estructura de la respuesta para un pago.
type PaymentResponse struct {
	PaymentID       uuid.UUID       `json:"payment_id"`
	PaymentDate     time.Time       `json:"payment_date"`
	AmountPaid      decimal.Decimal `json:"amount_paid"`
	CurrencyPaid    string          `json:"currency_paid"`
	AmountBase      decimal.Decimal `json:"amount_base"`
	ExchangeRate    decimal.Decimal `json:"exchange_rate"`
	PaymentMethodID uuid.UUID       `json:"payment_method_id"`
	TransactionID   string          `json:"transaction_id,omitempty"`
	Status          string          `json:"status"`
	ReceiptURL      string          `json:"receipt_url,omitempty"`
}

// NewInvoiceResponse crea una nueva respuesta de factura a partir del modelo de dominio.
func NewInvoiceResponse(invoice *billingdomain.Invoice) *InvoiceResponse {
	items := make([]InvoiceItemResponse, len(invoice.InvoiceItems))
	for i, item := range invoice.InvoiceItems {
		items[i] = InvoiceItemResponse{
			InvoiceItemID:   item.InvoiceItemID,
			Quantity:        item.Quantity,
			UnitPrice:       item.UnitPrice,
			DiscountApplied: item.DiscountApplied,
			TaxRate:         item.TaxRate,
			TaxAmount:       item.TaxAmount,
			Subtotal:        item.Subtotal,
			TotalLine:       item.TotalLine,
			MembershipTypeID: func() *uuid.UUID {
				if item.MembershipTypeID.Valid {
					return &item.MembershipTypeID.UUID
				}
				return nil
			}(),
			ServiceID: func() *uuid.UUID {
				if item.ServiceID.Valid {
					return &item.ServiceID.UUID
				}
				return nil
			}(),
			PackageID: func() *uuid.UUID {
				if item.PackageID.Valid {
					return &item.PackageID.UUID
				}
				return nil
			}(),
		}
	}

	payments := make([]PaymentResponse, len(invoice.Payments))
	for i, p := range invoice.Payments {
		payments[i] = PaymentResponse{
			PaymentID:       p.PaymentID,
			PaymentDate:     p.PaymentDate,
			AmountPaid:      p.AmountPaid,
			CurrencyPaid:    p.CurrencyPaid,
			AmountBase:      p.AmountBase,
			ExchangeRate:    p.ExchangeRate,
			PaymentMethodID: p.PaymentMethodID,
			TransactionID:   p.TransactionID.String,
			Status:          string(p.Status),
			ReceiptURL:      p.ReceiptURL.String,
		}
	}

	return &InvoiceResponse{
		InvoiceID:     invoice.InvoiceID,
		UserID:        invoice.UserID,
		BranchID:      invoice.BranchID,
		InvoiceNumber: invoice.InvoiceNumber,
		IssueDate:     invoice.IssueDate,
		DueDate:       invoice.DueDate,
		SubTotal:      invoice.SubTotal,
		Tax:           invoice.Tax,
		TotalAmount:   invoice.TotalAmount,
		Status:        string(invoice.Status),
		CreatedAt:     invoice.CreatedAt,
		InvoiceItems:  items,
		Payments:      payments,
	}
}

// NewPaymentResponseFromPayment crea una nueva respuesta de pago a partir del modelo de dominio de un solo pago.
func NewPaymentResponseFromPayment(p *billingdomain.Payment) *PaymentResponse {
	return &PaymentResponse{
		PaymentID:       p.PaymentID,
		PaymentDate:     p.PaymentDate,
		AmountPaid:      p.AmountPaid,
		CurrencyPaid:    p.CurrencyPaid,
		AmountBase:      p.AmountBase,
		ExchangeRate:    p.ExchangeRate,
		PaymentMethodID: p.PaymentMethodID,
		TransactionID:   p.TransactionID.String,
		Status:          string(p.Status),
		ReceiptURL:      p.ReceiptURL.String,
	}
}

type ClientInvoiceResponse struct {
	InvoiceID   uuid.UUID       `json:"invoice_id"`
	BranchID    uuid.UUID       `json:"branch_id"`
	IssueDate   time.Time       `json:"issue_date"`
	TotalAmount decimal.Decimal `json:"total_amount"`
	Status      string          `json:"status"`
}

func NewClientInvoiceResponse(invoices []*billingdomain.Invoice) []ClientInvoiceResponse {
	if invoices == nil {
		return []ClientInvoiceResponse{}
	}

	responses := make([]ClientInvoiceResponse, len(invoices))
	for i, invoice := range invoices {
		responses[i] = ClientInvoiceResponse{
			InvoiceID:   invoice.InvoiceID,
			BranchID:    invoice.BranchID,
			IssueDate:   invoice.IssueDate,
			TotalAmount: invoice.TotalAmount,
			Status:      string(invoice.Status),
		}
	}
	return responses
}

type AdminInvoiceListResponse struct {
	InvoiceID     uuid.UUID       `json:"invoice_id"`
	InvoiceNumber string          `json:"invoice_number"`
	ClientName    string          `json:"client_name"`
	IssueDate     time.Time       `json:"issue_date"`
	TotalAmount   decimal.Decimal `json:"total_amount"`
	Status        string          `json:"status"`
}

func NewAdminInvoiceListResponse(invoices []*billingdomain.Invoice) []AdminInvoiceListResponse {
	if invoices == nil {
		return []AdminInvoiceListResponse{}
	}

	responses := make([]AdminInvoiceListResponse, len(invoices))
	for i, invoice := range invoices {
		responses[i] = AdminInvoiceListResponse{
			InvoiceID:     invoice.InvoiceID,
			InvoiceNumber: invoice.InvoiceNumber,
			ClientName:    invoice.User.FirstName + " " + invoice.User.LastName,
			IssueDate:     invoice.IssueDate,
			TotalAmount:   invoice.TotalAmount,
			Status:        string(invoice.Status),
		}
	}
	return responses
}

type CreateCheckoutPayload struct {
	InvoiceID uuid.UUID `json:"invoice_id" binding:"required"`
}
