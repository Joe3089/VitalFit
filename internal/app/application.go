package app

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	docs "github.com/vitalfit/api/docs"
	"github.com/vitalfit/api/pkg/cors"
	"github.com/vitalfit/api/pkg/db"
	"github.com/vitalfit/api/pkg/ratelimiter"

	"github.com/vitalfit/api/config"
	apphandlers "github.com/vitalfit/api/internal/app/handlers"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/modules/cronjobs"
	"github.com/vitalfit/api/internal/shared/middleware/auth"
	ratelimiterm "github.com/vitalfit/api/internal/shared/middleware/ratelimiter"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/internal/store/cache"
	"go.uber.org/zap"
)

var (
	version = "0.0.1"
)

type application struct {
	Config      *config.Config
	Logger      *zap.SugaredLogger
	Store       store.Storage
	Cache       cache.Storage
	Services    appservices.Services
	Handlers    apphandlers.Handlers
	ratelimiter ratelimiter.Limiter
	Cronjob     *cronjobs.Manager
}

// Mount config and return router
func (app *application) Mount() http.Handler {
	r := gin.New()
	r.RedirectTrailingSlash = false
	docs.SwaggerInfo.BasePath = "/v1"
	r.Use(gin.Logger(), gin.Recovery())
	cors.SetupCORS(r)
	m := auth.NewAuthMiddleware(app.Services)
	rate := ratelimiterm.NewRateLimiterMiddleware(app.ratelimiter, app.Config.RateLimiter, app.Logger)
	r.Use(rate.RateLimiterMiddleware())
	{

		v1 := r.Group("/v1")

		v1.GET("/health", app.HealthCheckHandler)

		//auth routes
		app.Handlers.AuthHandlers.AuthRoutes(v1, m)
		app.Handlers.AuthHandlers.UserRoutes(v1, m)
		app.Handlers.AuthHandlers.AdminRoutes(v1, m)

		//branch routes
		app.Handlers.BranchHandlers.BranchRoutes(v1, m)
		app.Handlers.BranchHandlers.PublicBranchRoutes(v1)

		app.Handlers.InventoryHandlers.InventoryRoutes(v1, m)

		app.Handlers.InstructorHandlers.InstructorRoutes(v1, m)

		//marketing routes
		app.Handlers.MarketingHandlers.MarketingRoutes(v1, m)

		//products routes
		app.Handlers.ProductsHandlers.ProductsRoutes(v1, m)
		app.Handlers.ProductsHandlers.PublicProductsRoutes(v1)

		//memberships routes
		app.Handlers.MembershipHandlers.MembershipRoutes(v1, m)
		app.Handlers.MembershipHandlers.PublicMembershipRoutes(v1)

		//billing routes
		app.Handlers.BillingHandlers.BillingRoutes(v1, m)

		//schedule routes
		app.Handlers.ScheduleHandlers.ScheduleRoutes(v1, m)

		//combos routes
		app.Handlers.CombosHandlers.CombosRoutes(v1, m)
		app.Handlers.CombosHandlers.PublicCombosRoutes(v1)

		//booking
		app.Handlers.BookingHandlers.BookingRoutes(v1, m)

		//access
		app.Handlers.AccessHandlers.AccessRoutes(v1, m)

		//reports
		app.Handlers.ReportHandlers.ReportRoutes(v1, m)

		//staff
		app.Handlers.StaffHandlers.StaffRoutes(v1, m)

		//Policies
		app.Handlers.PoliciesHandlers.PolicyRoutes(v1, m)

		//wishlist
		app.Handlers.WishlistHandlers.SetupRoutes(v1, m)
		//clients
		app.Handlers.ClientHandlers.ClientRoutes(v1, m)

		//audit
		app.Handlers.AuditHandlers.SetupRoutes(v1, m)

		//notifications
		app.Handlers.NotificationHandlers.NotificationsRoutes(v1, m)

		app.Handlers.FaceAuthHandlers.FaceAuthRoutes(v1, m)

		//routines
		app.Handlers.RoutineHandlers.RoutineRoutes(v1, m)

		//llm
		app.Handlers.LLMHandlers.LLMRoutes(v1, m)

		//crm: feedback, tags, segments, nps, contact
		app.Handlers.CRMHandlers.CRMRoutes(v1, m)

		//insights: advanced analytics, report automation and BI API
		app.Handlers.InsightsHandlers.InsightsRoutes(v1, m)

		v1.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	}

	return r
}

// Run starts HTTP server
func (app *application) Run(mux http.Handler) error {

	srv := &http.Server{
		Addr:         app.Config.Addrs,
		Handler:      mux,
		WriteTimeout: time.Second * 30,
		ReadTimeout:  time.Second * 10,
		IdleTimeout:  time.Minute,
	}

	shutdown := make(chan error)

	go func() {
		quit := make(chan os.Signal, 1)

		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		s := <-quit

		ctx, cancel := context.WithTimeout(context.Background(), db.QueryTimeoutDuration)
		defer cancel()

		app.Logger.Infow("signal caught", "signal", s.String())

		shutdown <- srv.Shutdown(ctx)
	}()

	app.Logger.Infow("server has started", "addr", app.Config.Addrs, "env", app.Config.Env)

	err := srv.ListenAndServe()
	if !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	app.Cronjob.Stop()
	err = <-shutdown
	if err != nil {
		return err
	}

	app.Logger.Infow("server has stopped", "addr", app.Config.Addrs, "env", app.Config.Env)
	return nil
}
