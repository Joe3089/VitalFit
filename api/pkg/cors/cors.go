package cors

import (
	"log"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	env "github.com/vitalfit/api/pkg/Env"
)

func SetupCORS(router *gin.Engine) {
	originsStr := env.GetString("WHITE_LIST", "http://localhost:3000")
	if originsStr == "" {
		log.Fatal("Error: WHITE_LIST not set in environment variables")
	}

	origins := strings.Split(originsStr, ",")

	for i, origin := range origins {
		origins[i] = strings.TrimSpace(origin)
	}

	router.Use(cors.New(cors.Config{
		AllowOrigins: origins,
		AllowMethods: []string{"PUT", "PATCH", "GET", "POST", "DELETE"},
		AllowHeaders: []string{"Accept",
			"Accept-Language",
			"Content-Type",
			"Content-Language",
			"Origin",
			"Authorization",
			"X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	log.Printf("CORS configured. Origins allowed: %v", origins)
}
