package billinghandlers

import (
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

var validate = validator.New()

type BillingHandlersInterface interface {
	BillingRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)
	GetPaymentMethodsHandler(c *gin.Context)
	GetPaymentMethodByIDHandler(c *gin.Context)
	ExportPaymentMethodsHandler(c *gin.Context)

	CreatePaymentMethodHandler(c *gin.Context)
	UpdatePaymentMethodHandler(c *gin.Context)
	DeletePaymentMethodHandler(c *gin.Context)

	AddPaymentMethodsToBranchHandler(c *gin.Context)
	DeletePaymentMethodsFromBranchHandler(c *gin.Context)
	GetPaymentMethodsFromBranchHandler(c *gin.Context)
	UpdatePaymentMethodFromBranchHandler(c *gin.Context)
	GetBranchPaymentMethodByIDHandler(c *gin.Context)

	CreateFiscalDocumentTypeHandler(c *gin.Context)
	GetFiscalDocumentTypesHandler(c *gin.Context)
	GetFiscalDocumentTypeByIDHandler(c *gin.Context)
	UpdateFiscalDocumentTypeHandler(c *gin.Context)
	DeleteFiscalDocumentTypeHandler(c *gin.Context)

	CreateInvoiceHandler(c *gin.Context)
	AddPaymentToInvoiceHandler(c *gin.Context)
	UpdatePaymentStatusHandler(c *gin.Context)
	GetPaymentByIDHandler(c *gin.Context)
	GetInvoiceByIDHandler(c *gin.Context)

	GetClientInvoices(c *gin.Context)
	GetTaxRateByBranchIDHandler(c *gin.Context)

	CreateCheckoutHandler(c *gin.Context)
	WebhookHandler(c *gin.Context)
}

type BillingHandlers struct {
	services appservices.Services
}

func NewBillingHandlers(services appservices.Services) *BillingHandlers {
	return &BillingHandlers{
		services: services,
	}
}

func (r *BillingHandlers) BillingRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {
	billingGroup := rg.Group("/billing")
	billingGroup.Use(m.AuthJwtTokenMiddleware())
	billingGroup.Use(m.AuditLogMiddleware())
	billingGroup.POST("/checkout", r.CreateCheckoutHandler)

	billingGroup.GET("/rates", r.GetRates)
	billingGroup.GET("/rates/:currency", r.GetSpecificCurrencyRates)
	billingGroup.GET("/rates/historical/:date/:currency", m.RBACPermission("billing:list"), r.GetHistoricalSpecificCurrencyRateHandler)
	billingGroup.GET("/tax-rate/:branch_id", r.GetTaxRateByBranchIDHandler)
	paymentMethodsGroup := billingGroup.Group("/payment-methods")
	{
		paymentMethodsGroup.GET("", m.RBACPermission("billing:list"), r.GetPaymentMethodsHandler)
		paymentMethodsGroup.GET("/export", m.RBACPermission("billing:list"), r.ExportPaymentMethodsHandler)
		paymentMethodsGroup.POST("", m.RBACPermission("billing:create"), r.CreatePaymentMethodHandler)
		paymentMethodsGroup.GET("/:id", r.GetPaymentMethodByIDHandler)
		paymentMethodsGroup.PUT("/:id", m.RBACPermission("billing:update"), r.UpdatePaymentMethodHandler)
		paymentMethodsGroup.DELETE("/:id", m.RBACPermission("billing:delete"), r.DeletePaymentMethodHandler)
	}

	branchPaymentMethodsGroup := rg.Group("/branches/:id/payment-methods")
	branchPaymentMethodsGroup.Use(m.AuthJwtTokenMiddleware())
	branchPaymentMethodsGroup.Use(m.AuditLogMiddleware())
	{
		branchPaymentMethodsGroup.GET("", r.GetPaymentMethodsFromBranchHandler)
		branchPaymentMethodsGroup.POST("", m.RBACPermission("branch_management"), r.AddPaymentMethodsToBranchHandler)
		branchPaymentMethodsGroup.GET("/:method_id", r.GetBranchPaymentMethodByIDHandler)
		branchPaymentMethodsGroup.PUT("/:method_id", m.RBACPermission("branch_management"), r.UpdatePaymentMethodFromBranchHandler)
		branchPaymentMethodsGroup.DELETE("/:method_id", m.RBACPermission("branch_management"), r.DeletePaymentMethodsFromBranchHandler)
	}

	fiscalDocumentTypesGroup := billingGroup.Group("/fiscal-document-types")
	{
		fiscalDocumentTypesGroup.GET("", m.RBACPermission("billing:list"), r.GetFiscalDocumentTypesHandler)
		fiscalDocumentTypesGroup.POST("", m.RBACPermission("billing:create"), r.CreateFiscalDocumentTypeHandler)
		fiscalDocumentTypesGroup.GET("/:id", m.RBACPermission("billing:get"), r.GetFiscalDocumentTypeByIDHandler)
		fiscalDocumentTypesGroup.PUT("/:id", m.RBACPermission("billing:update"), r.UpdateFiscalDocumentTypeHandler)
		fiscalDocumentTypesGroup.DELETE("/:id", m.RBACPermission("billing:delete"), r.DeleteFiscalDocumentTypeHandler)
	}

	invoicesGroup := billingGroup.Group("/invoices")
	invoicesGroup.POST("", r.CreateInvoiceHandler)
	invoicesGroup.GET("", m.RBACPermission("billing:list"), r.GetInvoicesHandler)
	invoicesGroup.GET("/:invoice_id", r.GetInvoiceByIDHandler)
	invoicesGroup.GET("/client", r.GetClientInvoices)
	invoicesGroup.GET("/client/:user_id", r.GetClientInvoices)
	invoicesGroup.POST("/payment", r.AddPaymentToInvoiceHandler)
	invoicesGroup.GET("/:invoice_id/adjustments", m.RBACPermission("billing:list", "billing:adjust"), r.ListInvoiceAdjustmentsHandler)
	invoicesGroup.POST("/:invoice_id/adjustments", m.RBACPermission("billing:adjust"), r.ApplyInvoiceAdjustmentHandler)

	paymentsGroup := billingGroup.Group("/payments")
	{
		paymentsGroup.GET("/:payment_id", r.GetPaymentByIDHandler)
		paymentsGroup.PATCH("/:payment_id/status", m.RBACPermission("billing:process_payment"), r.UpdatePaymentStatusHandler)
	}

	webhooksGroup := rg.Group("/webhooks")
	{
		// POST /v1/webhooks/stripe
		webhooksGroup.POST("/stripe", r.WebhookHandler)
	}
}
