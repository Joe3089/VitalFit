package app

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

//	@BasePath	/v1

// HealthCheckHandler godoc
//
//	@Summary		verify service status
//	@Description	return status, environment and version.
//	@Tags			System
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	map[string]interface{}	"Ok status and system details"
//	@Router			/health [get]
func (app *application) HealthCheckHandler(c *gin.Context) {
	data := gin.H{
		"status":      "available",
		"environment": app.Config.Env,
		"version":     version,
	}
	c.JSON(http.StatusOK, data)
}
