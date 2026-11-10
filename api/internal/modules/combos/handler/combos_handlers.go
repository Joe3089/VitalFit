package comboshandler

import (
	"encoding/csv"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/pagination"
)

// @Summary		Create a new package
// @Description	Adds a new package with its items to the system.
// @Tags			Packages
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			package	body		CreatePackageRequest	true	"Package creation payload"
// @Success		201		{object}	map[string]interface{}	"Package created successfully"
// @Failure		400		{object}	map[string]interface{}	"Bad Request: Invalid payload"
// @Failure		500		{object}	map[string]interface{}	"Internal Server Error"
// @Router			/packages [post]
func (h *CombosHandler) CreatePackageHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var payload CreatePackageRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	pkg, err := payload.ToPackage()
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	err = h.services.CombosServices.CreatePackage(ctx, pkg)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(201, gin.H{"message": "Package created successfully"})

}

// @Summary		List all packages
// @Description	Retrieves a paginated list of all available packages, with optional searching by name.
// @Tags			Packages
// @Security		ApiKeyAuth
// @Produce		json
// @Param			limit	query		int								false	"Number of results per page"	default(10)
// @Param			page	query		int								false	"Page number for pagination"	default(1)
// @Param			sort	query		string							false	"Sort order (asc/desc)"			enums(asc, desc)	default(desc)
// @Param			search	query		string							false	"Search term for package name"
// @Success		200		{object}	object{data=PackageResponse[]}	"A paginated list of packages"
// @Failure		400		{object}	map[string]interface{}			"Bad Request: Invalid query parameters"
// @Failure		500		{object}	map[string]interface{}			"Internal server error"
// @Router			/packages [get]
func (h *CombosHandler) GetPackageHandler(c *gin.Context) {
	ctx := c.Request.Context()
	fq := pagination.PaginatedFeedQuery{
		Page:   1,
		Limit:  10,
		Search: "",
	}
	fq, err := fq.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	nextURL := fmt.Sprintf("/packages?limit=%d&page=%d&sort=%s", fq.Limit, fq.Page+1, fq.Sort)
	previousPage := fq.Page - 1
	if previousPage <= 0 {
		previousPage = 1
	}
	previousURL := fmt.Sprintf("/packages?limit=%d&page=%d&sort=%s", fq.Limit, previousPage, fq.Sort)

	packages, err := h.services.CombosServices.GetPackages(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	total, err := h.services.CombosServices.GetPackagesTotal(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	data := make([]PackageResponse, len(packages))
	for i, pkg := range packages {
		data[i] = PackageResponse{
			PackageID:   pkg.PackageID,
			Name:        pkg.Name,
			Description: pkg.Description,
			Price:       pkg.Price,
			IsActive:    pkg.IsActive,
			StartAt:     pkg.StartAt,
			EndAt:       pkg.EndAt,
			CreatedAt:   pkg.CreatedAt,
			UpdatedAt:   pkg.UpdatedAt,
		}
	}

	resp := pagination.PaginatedResponseTotal[PackageResponse]{
		Data:     data,
		Next:     nextURL,
		Previous: previousURL,
		Count:    int64(len(packages)),
		Total:    total,
	}
	c.JSON(200, gin.H{"data": resp})
}

// @Summary		Get package by ID
// @Description	Retrieves detailed information about a specific package by its UUID, including its items.
// @Tags			Packages
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string								true	"Package UUID"
// @Success		200	{object}	object{data=PackageResponseByID}	"Package details"
// @Failure		400	{object}	map[string]interface{}				"Bad Request: Invalid UUID format"
// @Failure		404	{object}	map[string]interface{}				"Not Found: Package not found"
// @Failure		500	{object}	map[string]interface{}				"Internal Server Error"
// @Router			/packages/{id} [get]
func (h *CombosHandler) GetPackageByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()
	packageID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	pkg, err := h.services.CombosServices.GetPackageByID(ctx, packageID)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	packageItems := make([]PackageItemResponse, len(pkg.PackageItems))
	for i, item := range pkg.PackageItems {
		packageItems[i] = PackageItemResponse{
			ServiceID:        item.ServiceID,
			Name:             item.Service.Name,
			SessionsIncluded: item.SessionsIncluded,
		}
	}

	resp := PackageResponseByID{
		PackageResponse: PackageResponse{
			PackageID:   pkg.PackageID,
			Name:        pkg.Name,
			Description: pkg.Description,
			Price:       pkg.Price,
			IsActive:    pkg.IsActive,
			StartAt:     pkg.StartAt,
			EndAt:       pkg.EndAt,
			CreatedAt:   pkg.CreatedAt,
			UpdatedAt:   pkg.UpdatedAt,
		},
		PackageItems: packageItems,
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// @Summary		Update a package
// @Description	Updates an existing package's information, including its items.
// @Tags			Packages
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id		path		string					true	"Package UUID"
// @Param			package	body		CreatePackageRequest	true	"Payload with fields to update"
// @Success		204		{object}	nil						"Package updated successfully"
// @Failure		400		{object}	map[string]interface{}	"Bad Request: Invalid UUID or payload"
// @Failure		404		{object}	map[string]interface{}	"Not Found: Package not found"
// @Failure		500		{object}	map[string]interface{}	"Internal Server Error"
// @Router			/packages/{id} [put]
func (h *CombosHandler) UpdatePackageHandler(c *gin.Context) {
	ctx := c.Request.Context()
	packageID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	var payload CreatePackageRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	pkg, err := payload.ToPackage()
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	pkg.PackageID = packageID

	err = h.services.CombosServices.UpdatePackage(ctx, pkg)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

// @Summary		Export Packages (CSV)
// @Description	Exports all packages as a CSV file.
// @Tags			Packages
// @Security		ApiKeyAuth
// @Produce		text/csv
// @Success		200	{file}		file					"packages.csv"
// @Failure		500	{object}	map[string]interface{}	"Internal Server Error"
// @Router			/packages/export [get]
func (h *CombosHandler) ExportPackagesHandler(c *gin.Context) {
	ctx := c.Request.Context()
	fq := pagination.PaginatedFeedQuery{
		Limit: 1000000,
		Page:  1,
		Sort:  "desc",
	}

	packages, err := h.services.CombosServices.GetPackages(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.Header("Content-Disposition", "attachment; filename=packages.csv")
	c.Header("Content-Type", "text/csv")

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	writer.Write([]string{"ID", "Name", "Description", "Price", "Active", "Start Date", "End Date"})

	for _, p := range packages {
		startAt := ""
		if p.StartAt != nil {
			startAt = p.StartAt.Format("2006-01-02")
		}
		endAt := ""
		if p.EndAt != nil {
			endAt = p.EndAt.Format("2006-01-02")
		}
		writer.Write([]string{
			p.PackageID.String(),
			p.Name,
			p.Description,
			fmt.Sprintf("%.2f", p.Price),
			fmt.Sprintf("%t", p.IsActive),
			startAt,
			endAt,
		})
	}
}

// @Summary		Delete a package
// @Description	Deletes a specific package by its UUID.
// @Tags			Packages
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string					true	"Package UUID"
// @Success		204	{object}	nil						"Package deleted successfully"
// @Failure		400	{object}	map[string]interface{}	"Bad Request: Invalid UUID format"
// @Failure		404	{object}	map[string]interface{}	"Not Found: Package not found"
// @Failure		500	{object}	map[string]interface{}	"Internal Server Error"
// @Router			/packages/{id} [delete]
func (h *CombosHandler) DeletePackageHandler(c *gin.Context) {
	ctx := c.Request.Context()
	packageID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	err = h.services.CombosServices.DeletePackage(ctx, packageID)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

// @Summary		List all public packages
// @Description	Retrieves a paginated list of all available public packages, with optional searching and currency conversion.
// @Tags			Public
// @Produce		json
// @Param			limit		query		int										false	"Number of results per page"	default(10)
// @Param			page		query		int										false	"Page number for pagination"	default(1)
// @Param			sort		query		string									false	"Sort order (asc/desc)"			enums(asc, desc)	default(desc)
// @Param			search		query		string									false	"Search term for package name"
// @Param			currency	query		string									false	"Currency for price conversion (e.g., VES)"	default(USD)
// @Success		200			{object}	object{data=[]PublicPackageResponse}	"A paginated list of public packages"
// @Failure		400			{object}	map[string]interface{}					"Bad Request: Invalid query parameters"
// @Failure		500			{object}	map[string]interface{}					"Internal server error"
// @Router			/public/packages [get]
func (h *CombosHandler) PublicGetPackagesHandler(c *gin.Context) {
	ctx := c.Request.Context()
	currency := c.Query("currency")

	if currency == "" {
		currency = "USD"
	}

	fq := pagination.PaginatedFeedQuery{
		Limit:  10,
		Page:   1,
		Sort:   "desc",
		Search: "",
	}
	fq, err := fq.Parse(c.Request)

	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	rates, err := h.services.BillingServices.GetLatestRates(ctx)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	currencyRate := rates[currency]
	packages, total, err := h.services.CombosServices.GetPublicPackages(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	data := make([]PublicPackageResponse, 0, len(packages))
	for _, pkg := range packages {
		data = append(data, PublicPackageResponse{
			PackageID:    pkg.PackageID,
			Name:         pkg.Name,
			Description:  pkg.Description,
			IsActive:     pkg.IsActive,
			StartAt:      pkg.StartAt,
			EndAt:        pkg.EndAt,
			Price:        pkg.Price,
			BaseCurrency: "USD",
			RefPrice:     decimal.NewFromFloat(pkg.Price).Mul(decimal.NewFromFloat(currencyRate)).Round(2),
			RefCurrency:  currency,
		})
	}

	resp := pagination.PaginatedResponseTotal[PublicPackageResponse]{
		Data:     data,
		Count:    int64(len(packages)),
		Next:     "",
		Previous: "",
		Total:    total,
	}
	c.JSON(http.StatusOK, resp)
}
