package authhandlers

import (
	"github.com/gin-gonic/gin"
	"github.com/vitalfit/api/config"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
)

type AuthHandlersInterface interface {
	AuthRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)
	UserRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)
	AdminRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware)
	//Users
	RegisterUserStaffHandler(c *gin.Context)
	RegisterUserClientHandler(c *gin.Context)
	ActivateUserHandler(c *gin.Context)
	ResendActivationCodeHandler(c *gin.Context)
	ActivateStaffHanlder(c *gin.Context)
	LoginHandler(c *gin.Context)
	WhoAmI(c *gin.Context)
	ForgotPasswordHandler(c *gin.Context)
	ResetPasswordHandler(c *gin.Context)
	ValidateResetTokenHandler(c *gin.Context)
	GetBranchAdminsHandler(c *gin.Context)
	GetUsersHandler(c *gin.Context)
	GetClientsHandler(c *gin.Context)
	GetUserByIDHandler(c *gin.Context)
	UpdateUserStaffHandler(c *gin.Context)
	UpdateUserClientHandler(c *gin.Context)
	GetUserByEmailHandler(c *gin.Context)
	DeleteUserHandler(c *gin.Context)
	BlockUserHandler(c *gin.Context)
	UnblockUserHandler(c *gin.Context)
	GenerateQrJwtTokenHandler(c *gin.Context)
	ChangePasswordHandler(c *gin.Context)
	ExportClientsHandler(c *gin.Context)
	ExportUsersHandler(c *gin.Context)
	//Roles
	GetRolesHandler(c *gin.Context)
	CreateRoleHandler(c *gin.Context)
	GetRoleByIDHandler(c *gin.Context)
	UpdateRoleHandler(c *gin.Context)
	DeleteRoleHandler(c *gin.Context)
	GetPermissionsHandler(c *gin.Context)
	AssignRolePermissionHandler(c *gin.Context)
	DeleteRolePermissionHandler(c *gin.Context)
	//Sessions
	RenewAccessTokenHandler(c *gin.Context)
	GetUserSessionsHandler(c *gin.Context)
	GetUserSessionsByIDHandler(c *gin.Context)
	RevokeSessionHandler(c *gin.Context)
	RevokeAllSessionsHandler(c *gin.Context)
	RevokeAllSessionsByIDHandler(c *gin.Context)
}

type AuthHandlers struct {
	services appservices.Services
	config   *config.Config
}

func NewAuthHandlers(services appservices.Services) *AuthHandlers {
	return &AuthHandlers{
		services: services,
		config:   config.LoadConfig(),
	}
}

func (r *AuthHandlers) AuthRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {

	authGroup := rg.Group("/auth")
	{ //public routes
		authGroup.POST("/register", r.RegisterUserClientHandler)
		authGroup.POST("/resend-activation", r.ResendActivationCodeHandler)
		authGroup.PUT("/activate", r.ActivateUserHandler)
		authGroup.PUT("/activate/:token", r.ActivateStaffHanlder)
		authGroup.POST("/login", r.LoginHandler)
		authGroup.POST("/oauth-login", r.OAuthLoginHandler)
		authGroup.POST("/refresh", r.RenewAccessTokenHandler)
		authGroup.POST("/2fa/verify", r.VerifyTwoFactorHandler)
		authGroup.POST("/2fa/resend", r.ResendTwoFactorHandler)
		authGroup.GET("/password-policy", r.GetPasswordPolicyHandler)

		passwordGroup := authGroup.Group("/password")
		{
			passwordGroup.POST("/forgot", r.ForgotPasswordHandler)
			passwordGroup.POST("/reset", r.ResetPasswordHandler)
			passwordGroup.GET("/validate/:token", r.ValidateResetTokenHandler)
		}

		protectedGroup := authGroup.Group("/").Use(
			m.AuthJwtTokenMiddleware(),
			m.AuditLogMiddleware(),
			m.RBACPermission("users:create"),
		)
		{
			protectedGroup.POST("/register-staff", r.RegisterUserStaffHandler)
		}
	}

}

func (r *AuthHandlers) UserRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {
	userGroup := rg.Group("/user").Use(m.AuthJwtTokenMiddleware())
	userGroup.Use(m.AuditLogMiddleware())
	{ //private routes
		userGroup.GET("/whoami", r.WhoAmI)
		userGroup.GET("/qr-token", r.GenerateQrJwtTokenHandler)
		userGroup.POST("/change-password", r.ChangePasswordHandler)

		userGroup.GET("/sessions", r.GetUserSessionsHandler)
		userGroup.GET("/:id/sessions", r.GetUserSessionsByIDHandler)
		userGroup.DELETE("/sessions/:id", r.RevokeSessionHandler)
		userGroup.DELETE("/sessions", r.RevokeAllSessionsHandler)
		userGroup.DELETE("/:id/sessions", r.RevokeAllSessionsByIDHandler)

		userGroup.GET("/branch-admins",
			m.RBACPermission("users:list"),
			r.GetBranchAdminsHandler,
		)

		userGroup.GET("/users", m.RBACPermission("users:list"), r.GetUsersHandler)
		userGroup.GET("/clients", m.RBACPermission("users:list"), r.GetClientsHandler)

		userGroup.GET("/export/clients", m.RBACPermission("users:list"), r.ExportClientsHandler)
		userGroup.GET("/export/users", m.RBACPermission("users:list"), r.ExportUsersHandler)

		// Nuevas rutas para obtener y actualizar usuarios
		userGroup.GET("/:id", m.RBACPermission("users:get"), r.GetUserByIDHandler)
		userGroup.PUT("/:id/staff", r.UpdateUserStaffHandler)
		userGroup.PUT("/:id/client", r.UpdateUserClientHandler)
		userGroup.POST("/by-email", m.RBACPermission("users:get"), r.GetUserByEmailHandler)
		userGroup.DELETE("/:id", m.RBACPermission("users:delete"), r.DeleteUserHandler)
		userGroup.PUT("/:id/block", m.RBACPermission("users:update"), r.BlockUserHandler)
		userGroup.PUT("/:id/unblock", m.RBACPermission("users:update"), r.UnblockUserHandler)

	}
}

func (r *AuthHandlers) AdminRoutes(rg *gin.RouterGroup, m *auth.AuthMiddleware) {

	adminGroup := rg.Group("/admin")

	adminGroup.Use(m.AuthJwtTokenMiddleware())
	adminGroup.Use(m.AuditLogMiddleware())
	{

		adminGroup.GET("/permissions", m.RBACPermission("permissions:list"), r.GetPermissionsHandler)

		adminGroup.GET("/security-settings", m.RBACPermission("security:manage"), r.GetSecuritySettingsHandler)
		adminGroup.PUT("/security-settings", m.RBACPermission("security:manage"), r.UpdateSecuritySettingsHandler)

		roleGroup := adminGroup.Group("/roles")
		{
			// GET /admin/roles
			roleGroup.GET("", m.RBACPermission("roles:list"), r.GetRolesHandler)

			// POST /admin/roles
			roleGroup.POST("", m.RBACPermission("roles:create"), r.CreateRoleHandler)

			// GET /admin/roles/{id}
			roleGroup.GET("/:id", m.RBACPermission("roles:list"), r.GetRoleByIDHandler)

			// PUT /admin/roles/{id}
			roleGroup.PUT("/:id", m.RBACPermission("roles:update"), r.UpdateRoleHandler)

			// DELETE /admin/roles/{id}
			roleGroup.DELETE("/:id", m.RBACPermission("roles:delete"), r.DeleteRoleHandler)

			// POST /admin/roles/{id}/permissions
			roleGroup.POST("/:id/permissions", m.RBACPermission("roles:assign_permissions"), r.AssignRolePermissionHandler)

			// DELETE /admin/roles/{id}/permissions
			roleGroup.DELETE("/:id/permissions", m.RBACPermission("roles:assign_permissions"), r.DeleteRolePermissionHandler)
		}
	}
}
