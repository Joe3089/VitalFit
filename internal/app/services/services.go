package appservices

import (
	"github.com/aws/aws-sdk-go-v2/service/rekognition"
	"github.com/sashabaranov/go-openai"
	"github.com/vitalfit/api/config"
	accessdomain "github.com/vitalfit/api/internal/modules/access/domain"
	accessservice "github.com/vitalfit/api/internal/modules/access/service"
	auditdomain "github.com/vitalfit/api/internal/modules/audit/domain"
	auditservice "github.com/vitalfit/api/internal/modules/audit/services"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	authservices "github.com/vitalfit/api/internal/modules/auth/services"
	billingdomain "github.com/vitalfit/api/internal/modules/billing/domain"
	billingservice "github.com/vitalfit/api/internal/modules/billing/service"
	bookingdomain "github.com/vitalfit/api/internal/modules/booking/domain"
	bookingservice "github.com/vitalfit/api/internal/modules/booking/services"
	branchdomain "github.com/vitalfit/api/internal/modules/branches/domain"
	branchservices "github.com/vitalfit/api/internal/modules/branches/services"
	clientsdomain "github.com/vitalfit/api/internal/modules/clients/domain"
	clientsservice "github.com/vitalfit/api/internal/modules/clients/service"
	combosdomain "github.com/vitalfit/api/internal/modules/combos/domain"
	combosservices "github.com/vitalfit/api/internal/modules/combos/services"
	crmdomain "github.com/vitalfit/api/internal/modules/crm/domain"
	crmservices "github.com/vitalfit/api/internal/modules/crm/services"
	faceauthdomain "github.com/vitalfit/api/internal/modules/faceauth/domain"
	faceauthservices "github.com/vitalfit/api/internal/modules/faceauth/services"
	insightsdomain "github.com/vitalfit/api/internal/modules/insights/domain"
	insightsservices "github.com/vitalfit/api/internal/modules/insights/services"
	instructordomain "github.com/vitalfit/api/internal/modules/instructor/domain"
	instructorservices "github.com/vitalfit/api/internal/modules/instructor/services"
	inventorydomain "github.com/vitalfit/api/internal/modules/inventory/domain"
	inventoryservices "github.com/vitalfit/api/internal/modules/inventory/services"
	llmdomain "github.com/vitalfit/api/internal/modules/llm/domain"
	llmservices "github.com/vitalfit/api/internal/modules/llm/services"
	marketingdomain "github.com/vitalfit/api/internal/modules/marketing/domain"
	marketingservice "github.com/vitalfit/api/internal/modules/marketing/service"
	membershipsdomain "github.com/vitalfit/api/internal/modules/memberships/domain"
	membershipsservice "github.com/vitalfit/api/internal/modules/memberships/service"
	notidomain "github.com/vitalfit/api/internal/modules/notifications/domain"
	notiservice "github.com/vitalfit/api/internal/modules/notifications/service"
	policiesdomain "github.com/vitalfit/api/internal/modules/policies/domain"
	policiesservices "github.com/vitalfit/api/internal/modules/policies/services"
	productsdomain "github.com/vitalfit/api/internal/modules/products/domain"
	productsservice "github.com/vitalfit/api/internal/modules/products/service"
	reportdomain "github.com/vitalfit/api/internal/modules/reports/domain"
	reportservices "github.com/vitalfit/api/internal/modules/reports/services"
	routinedomain "github.com/vitalfit/api/internal/modules/routines/domain"
	routineservices "github.com/vitalfit/api/internal/modules/routines/services"
	scheduledomain "github.com/vitalfit/api/internal/modules/schedule/domain"
	scheduleservice "github.com/vitalfit/api/internal/modules/schedule/service"
	staffdomain "github.com/vitalfit/api/internal/modules/staff/domain"
	staffservice "github.com/vitalfit/api/internal/modules/staff/service"
	wishlistdomain "github.com/vitalfit/api/internal/modules/wishlist/domain"
	wishlistservice "github.com/vitalfit/api/internal/modules/wishlist/services"
	"github.com/vitalfit/api/internal/store/cache"

	logs "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/internal/shared/notifications"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/pkg/mailer"

	"go.uber.org/zap"
)

type Services struct {
	AuthServices         authdomain.AuthServicesInterface
	UserServices         authdomain.UserServicesInterface
	BranchesServices     branchdomain.BranchesServicesInterface
	LocationsServices    branchdomain.LocationsServicesInterface
	EquipmentServices    inventorydomain.EquipmentServicesInterface
	InventoryServices    inventorydomain.BranchInventoryServicesInterface
	InstructorServices   instructordomain.InstructorServiceInterface
	ProductsServices     productsdomain.ProductsServiceInterface
	MarketingServices    marketingdomain.MarketingServiceInterface
	MembershipServices   membershipsdomain.MembershipsServiceInterface
	BillingServices      billingdomain.BillingServiceInterface
	ScheduleServices     scheduledomain.ScheduleServiceInterface
	CombosServices       combosdomain.CombosServicesInterface
	BookingServices      bookingdomain.BookingServiceInterface
	AccessServices       accessdomain.AcessServiceInterface
	ReportServices       reportdomain.ReportServiceInterface
	Staff                staffdomain.StaffServiceInterface
	Policies             policiesdomain.PoliciesServicesInterface
	WishlistServices     wishlistdomain.WishlistService
	AuditServices        auditdomain.AuditService
	ClientServices       clientsdomain.ClientServiceInterface
	NotificationServices notidomain.NotificationServiceInterface
	FaceAuthServices     faceauthdomain.FacAuthServiceInterface
	Routine              routinedomain.RoutineServiceInterface
	LLM                  llmdomain.LLMServiceInterface
	CRMServices          crmdomain.CRMServiceInterface
	SecurityServices     authdomain.SecurityServiceInterface
	InsightsServices     insightsdomain.InsightsServiceInterface
	logs.LogErrors
	Logger *zap.SugaredLogger
}

func NewServices(store store.Storage, logger *zap.SugaredLogger, cfg config.Config, auth authdomain.Authenticator, mailer mailer.Client, cache cache.Storage, pushNoti notifications.PushService, rekognitionClient *rekognition.Client, opeaiClient *openai.Client) Services {
	bookingService := bookingservice.NewBookingService(store)
	reportService := reportservices.NewReportService(store)
	return Services{
		AuthServices:         authservices.NewAuthServices(store, cfg, auth, mailer),
		UserServices:         authservices.NewUserService(store),
		BranchesServices:     branchservices.NewBranchServices(store, cfg),
		LocationsServices:    branchservices.NewLocationsServices(store),
		EquipmentServices:    inventoryservices.NewEquipmentServices(store, cfg),
		InventoryServices:    inventoryservices.NewBranchInventoryServices(store, cfg),
		InstructorServices:   instructorservices.NewInstructorServices(store, cfg),
		ProductsServices:     productsservice.NewProductsService(store),
		MarketingServices:    marketingservice.NewMarketingService(store),
		MembershipServices:   membershipsservice.NewMembershipService(store),
		BillingServices:      billingservice.NewBillingService(store, cache, cfg, mailer),
		ScheduleServices:     scheduleservice.NewScheduleService(store),
		CombosServices:       combosservices.NewCombosServices(store),
		BookingServices:      bookingService,
		AccessServices:       accessservice.NewAccessServices(store, *bookingService),
		ReportServices:       reportService,
		Staff:                staffservice.NewStaffService(store),
		Policies:             policiesservices.NewPoliciesServices(store),
		WishlistServices:     wishlistservice.NewWishlistService(store),
		AuditServices:        auditservice.NewAuditService(store),
		ClientServices:       clientsservice.NewClientService(store, cfg.EncryptionKey),
		NotificationServices: notiservice.NewNotificationService(store, pushNoti),
		FaceAuthServices:     faceauthservices.NewFaceAuthServices(store, rekognitionClient),
		Routine:              routineservices.NewRoutineService(store),
		LLM:                  llmservices.NewLLMService(opeaiClient, store, logger),
		CRMServices:          crmservices.NewCRMService(store),
		SecurityServices:     authservices.NewSecurityService(store, cfg, mailer, logger),
		InsightsServices:     insightsservices.NewInsightsService(store, reportService, mailer, cfg, logger),
		LogErrors:            logs.NewLogErrors(logger),
		Logger:               logger,
	}
}
