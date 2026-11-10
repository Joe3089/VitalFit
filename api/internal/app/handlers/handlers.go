package apphandlers

import (
	appservices "github.com/vitalfit/api/internal/app/services"
	accesshandler "github.com/vitalfit/api/internal/modules/access/handler"
	audithandlers "github.com/vitalfit/api/internal/modules/audit/handlers"
	authhandlers "github.com/vitalfit/api/internal/modules/auth/handlers"
	billinghandlers "github.com/vitalfit/api/internal/modules/billing/handlers"
	bookinghandlers "github.com/vitalfit/api/internal/modules/booking/handlers"
	branchhandlers "github.com/vitalfit/api/internal/modules/branches/handlers"
	clientshandler "github.com/vitalfit/api/internal/modules/clients/handler"
	comboshandler "github.com/vitalfit/api/internal/modules/combos/handler"
	crmhandlers "github.com/vitalfit/api/internal/modules/crm/handlers"
	faceauthhandlers "github.com/vitalfit/api/internal/modules/faceauth/handlers"
	insightshandlers "github.com/vitalfit/api/internal/modules/insights/handlers"
	instructorhandler "github.com/vitalfit/api/internal/modules/instructor/handler"
	inventoryhandlers "github.com/vitalfit/api/internal/modules/inventory/handlers"
	llmhandlers "github.com/vitalfit/api/internal/modules/llm/handlers"
	marketinghandlers "github.com/vitalfit/api/internal/modules/marketing/handlers"
	membershipshandlers "github.com/vitalfit/api/internal/modules/memberships/handlers"
	notihandlers "github.com/vitalfit/api/internal/modules/notifications/handlers"
	policieshandler "github.com/vitalfit/api/internal/modules/policies/handler"
	productshandler "github.com/vitalfit/api/internal/modules/products/handler"
	reporthandlers "github.com/vitalfit/api/internal/modules/reports/handlers"
	routinehandlers "github.com/vitalfit/api/internal/modules/routines/handlers"
	schedulehandlers "github.com/vitalfit/api/internal/modules/schedule/handlers"
	staffhandlers "github.com/vitalfit/api/internal/modules/staff/handlers"
	wishlisthandlers "github.com/vitalfit/api/internal/modules/wishlist/handlers"
)

type Handlers struct {
	AuthHandlers         authhandlers.AuthHandlersInterface
	BranchHandlers       branchhandlers.BranchHandlersInterface
	InventoryHandlers    inventoryhandlers.InventoryHandlersInterface
	InstructorHandlers   instructorhandler.InstructorHandlersInterface
	ProductsHandlers     productshandler.ProductsHandlerInterface
	MarketingHandlers    marketinghandlers.MarketingHandlerInterface
	MembershipHandlers   membershipshandlers.MembershipsHandlerInterface
	BillingHandlers      billinghandlers.BillingHandlersInterface
	ScheduleHandlers     schedulehandlers.ScheduleHandlersInterface
	CombosHandlers       comboshandler.CombosHandlerInterface
	BookingHandlers      bookinghandlers.BookingHandlersInterface
	AccessHandlers       accesshandler.AccessHandlerInterface
	ReportHandlers       reporthandlers.ReportHandlersInterface
	StaffHandlers        staffhandlers.StaffHandlersInterface
	PoliciesHandlers     policieshandler.PoliciesHandlerInterface
	WishlistHandlers     wishlisthandlers.WishlistRoutes
	AuditHandlers        audithandlers.AuditHandlersInterface
	ClientHandlers       clientshandler.ClientHandlerInterface
	NotificationHandlers notihandlers.NotificationHandlersInterface
	FaceAuthHandlers     faceauthhandlers.FaceAuthHandlerInterface
	RoutineHandlers      routinehandlers.RoutineHandlersInterface
	LLMHandlers          llmhandlers.LLMHandlersInterface
	CRMHandlers          crmhandlers.CRMHandlersInterface
	InsightsHandlers     insightshandlers.InsightsHandlersInterface
}

func NewAppHandlers(services appservices.Services) Handlers {
	return Handlers{
		AuthHandlers:         authhandlers.NewAuthHandlers(services),
		BranchHandlers:       branchhandlers.NewBranchHandlers(services),
		InventoryHandlers:    inventoryhandlers.NewInventoryHandlers(services),
		InstructorHandlers:   instructorhandler.NewInstructorHandlers(services),
		ProductsHandlers:     productshandler.NewProductsHandler(services),
		MarketingHandlers:    marketinghandlers.NewMarketingHandler(services),
		MembershipHandlers:   membershipshandlers.NewMembershipHandler(services),
		BillingHandlers:      billinghandlers.NewBillingHandlers(services),
		ScheduleHandlers:     schedulehandlers.NewScheduleHandlers(services),
		CombosHandlers:       comboshandler.NewCombosHandler(services),
		BookingHandlers:      bookinghandlers.NewBookingHandlers(services),
		AccessHandlers:       accesshandler.NewAccessHandler(services),
		ReportHandlers:       reporthandlers.NewReportHandlers(services),
		StaffHandlers:        staffhandlers.NewStaffHandlers(services),
		PoliciesHandlers:     policieshandler.NewPoliciesHandler(services),
		WishlistHandlers:     wishlisthandlers.NewWishlistRoutes(services),
		AuditHandlers:        audithandlers.NewAuditHandlers(services),
		ClientHandlers:       clientshandler.NewClientHandler(services),
		NotificationHandlers: notihandlers.NewNotificationHandlers(services),
		FaceAuthHandlers:     faceauthhandlers.NewFaceAuthHandler(services),
		RoutineHandlers:      routinehandlers.NewRoutineHandlers(services),
		LLMHandlers:          llmhandlers.NewLLMHandlers(services),
		CRMHandlers:          crmhandlers.NewCRMHandlers(services),
		InsightsHandlers:     insightshandlers.NewInsightsHandlers(services),
	}
}
