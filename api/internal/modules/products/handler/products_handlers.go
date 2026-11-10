package productshandler

import (
	"encoding/csv"
	"errors"
	"fmt"
	"net/http"

	"github.com/shopspring/decimal"
	marketinghandlers "github.com/vitalfit/api/internal/modules/marketing/handlers"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/pagination"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// @Summary		List service categories
// @Description	Retrieves a list of all service categories.
// @Tags			Services Categories
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=[]productsdomain.ServiceCategory}	"List of service categories"
// @Failure		500	{object}	map[string]interface{}							"Internal server error"
// @Router			/services/categories [get]
func (h *ProductsHandler) ListServiceCategoriesHandler(c *gin.Context) {
	ctx := c.Request.Context()
	serviceCategories, err := h.services.ProductsServices.ListServiceCategories(ctx)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	response := make([]ServiceCategoryResponse, 0, len(serviceCategories))
	for _, category := range serviceCategories {
		response = append(response, ServiceCategoryResponse{
			CategoryID: category.CategoryID,
			Name:       category.Name,
		})
	}
	c.JSON(http.StatusOK, gin.H{"data": response})

}

// @Summary		Create a new service
// @Description	Adds a new service to the system.
// @Tags			Services
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			service	body		CreateServicePayload	true	"Service creation payload"
// @Success		201		{object}	map[string]interface{}	"Service created successfully"
// @Failure		400		{object}	map[string]interface{}	"Bad Request: Invalid payload"
// @Failure		409		{object}	map[string]interface{}	"Conflict: A service with this name already exists"
// @Failure		500		{object}	map[string]interface{}	"Internal Server Error"
// @Router			/services [post]
func (h *ProductsHandler) CreateServiceHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var payload CreateServicePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	service, err := payload.ToService()
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	bannerID, err := uuid.Parse(payload.BannerID)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	err = h.services.ProductsServices.CreateService(ctx, service, bannerID)
	if err != nil {
		switch err {
		case shared_errors.ErrConflict:
			h.services.LogErrors.ConflictResponse(c, err)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Service created successfully"})

}

// @Summary		List all services
// @Description	Retrieves a paginated list of all available services, with optional filtering and searching.
// @Tags			Services
// @Security		ApiKeyAuth
// @Produce		json
// @Param			limit		query		int								false	"Number of results per page"	default(10)
// @Param			page		query		int								false	"Page number for pagination"	default(1)
// @Param			sort		query		string							false	"Sort order (asc/desc)"			enums(asc, desc)	default(desc)
// @Param			search		query		string							false	"Search term for service name"
// @Param			category	query		string							false	"Filter by service category name"
// @Success		200			{object}	object{data=[]ServiceResponse}	"A paginated list of services"
// @Failure		400			{object}	map[string]interface{}			"Bad Request: Invalid query parameters"
// @Failure		500			{object}	map[string]interface{}			"Internal server error"
// @Router			/services/all [get]
func (h *ProductsHandler) GetServicesHandler(c *gin.Context) {
	ctx := c.Request.Context()
	fq := pagination.PaginatedFeedQuery{
		Limit:    10,
		Page:     1,
		Sort:     "desc",
		Search:   "",
		Category: "",
	}

	fq, err := fq.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	nextURL := fmt.Sprintf("/services/all?limit=%d&page=%d&sort=%s", fq.Limit, fq.Page+1, fq.Sort)
	previousPage := fq.Page - 1
	if previousPage <= 0 {
		previousPage = 1
	}
	previousURL := fmt.Sprintf("/services/all?limit=%d&page=%d&sort=%s", fq.Limit, previousPage, fq.Sort)

	services, err := h.services.ProductsServices.GetServices(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	serviceResponses := make([]ServiceResponse, len(services))
	for i, s := range services {
		images := make([]ImagesRensponse, len(s.Images))
		for j, img := range s.Images {
			images[j] = ImagesRensponse{
				ImageID:      img.ImageID,
				ImageURL:     img.ImageURL,
				AltText:      img.AltText,
				DisplayOrder: img.DisplayOrder,
				IsPrimary:    img.IsPrimary,
			}
		}
		banners := make([]marketinghandlers.BannerResponse, len(s.Banners))
		for j, b := range s.Banners {
			banners[j] = marketinghandlers.BannerResponse{
				BannerID: b.BannerID,
				Name:     b.Name,
				ImageURL: b.ImageURL,
				LinkURL:  b.LinkURL,
				IsActive: b.IsActive,
			}
		}
		serviceResponses[i] = ServiceResponse{
			ServiceID:       s.ServiceID,
			CategoryID:      s.CategoryID,
			Name:            s.Name,
			PriorityScore:   s.PriorityScore,
			IsFeatured:      s.IsFeatured,
			Description:     s.Description,
			DurationMinutes: s.DurationMinutes,
			ServiceCategory: ServiceCategoryResponse{CategoryID: s.Category.CategoryID, Name: s.Category.Name},
			Images:          images,
			Banners:         banners,
			CreatedAt:       s.CreatedAt,
			UpdatedAt:       s.UpdatedAt,
		}
	}

	total, err := h.services.ProductsServices.GetTotalCount(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	resp := pagination.PaginatedResponseTotal[ServiceResponse]{
		Data:     serviceResponses,
		Count:    int64(len(services)),
		Next:     nextURL,
		Previous: previousURL,
		Total:    total,
	}
	c.JSON(http.StatusOK, resp)
}

// @Summary		Get a summary of services
// @Description	Retrieves a count of total, active, and featured services.
// @Tags			Services
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=productsdomain.ServicesSummary}	"Summary of services"
// @Failure		500	{object}	map[string]interface{}						"Internal Server Error"
// @Router			/services/summary [get]
func (h *ProductsHandler) GetSummaryServicesHandler(c *gin.Context) {
	ctx := c.Request.Context()
	summary, err := h.services.ProductsServices.GetServiceSummary(ctx)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": summary})
}

// @Summary		Delete a service
// @Description	Deletes a specific service by its UUID.
// @Tags			Services
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string					true	"Service UUID"
// @Success		204	{object}	nil						"Service deleted successfully"
// @Failure		400	{object}	map[string]interface{}	"Bad Request: Invalid UUID format"
// @Failure		404	{object}	map[string]interface{}	"Not Found: Service not found"
// @Failure		500	{object}	map[string]interface{}	"Internal Server Error"
// @Router			/services/{id} [delete]
func (h *ProductsHandler) DeleteServiceHandler(c *gin.Context) {
	ctx := c.Request.Context()
	serviceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	err = h.services.ProductsServices.DeleteService(ctx, serviceID)
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

// @Summary		Export Services (CSV)
// @Description	Exports all services as a CSV file.
// @Tags			Services
// @Security		ApiKeyAuth
// @Produce		text/csv
// @Success		200	{file}		file					"services.csv"
// @Failure		500	{object}	map[string]interface{}	"Internal Server Error"
// @Router			/services/export [get]
func (h *ProductsHandler) ExportServicesHandler(c *gin.Context) {
	ctx := c.Request.Context()
	fq := pagination.PaginatedFeedQuery{
		Limit: 1000000,
		Page:  1,
		Sort:  "desc",
	}

	services, err := h.services.ProductsServices.GetServices(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.Header("Content-Disposition", "attachment; filename=services.csv")
	c.Header("Content-Type", "text/csv")

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	writer.Write([]string{"ID", "Name", "Category", "Description", "Duration (min)", "Priority", "Featured"})

	for _, s := range services {
		writer.Write([]string{
			s.ServiceID.String(),
			s.Name,
			s.Category.Name,
			s.Description,
			fmt.Sprintf("%d", s.DurationMinutes),
			fmt.Sprintf("%d", s.PriorityScore),
			fmt.Sprintf("%t", s.IsFeatured),
		})
	}
}

// @Summary		Get service by ID
// @Description	Retrieves detailed information about a specific service by its UUID.
// @Tags			Services
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string							true	"Service UUID"
// @Success		200	{object}	object{data=ServiceResponse}	"Service details"
// @Failure		400	{object}	map[string]interface{}			"Bad Request: Invalid UUID format"
// @Failure		404	{object}	map[string]interface{}			"Not Found: Service not found"
// @Failure		500	{object}	map[string]interface{}			"Internal Server Error"
// @Router			/services/{id} [get]
func (h *ProductsHandler) GetServiceByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()

	user := h.services.UserServices.GetUserFromContext(c)
	if user.Role.Name != "client" {
		permission := "services:get"
		if user.Role.Name != "super_admin" {
			ok, err := h.services.UserServices.RoleHasPermission(ctx, user.RoleID, permission)
			if err != nil {
				h.services.LogErrors.InternalServerError(c, err)
				return
			}
			if !ok {
				h.services.LogErrors.ForbiddenResponse(c)
				return
			}
		}
	}

	serviceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	service, err := h.services.ProductsServices.GetServiceByID(ctx, serviceID)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	images := make([]ImagesRensponse, len(service.Images))
	for i, img := range service.Images {
		images[i] = ImagesRensponse{
			ImageID:      img.ImageID,
			ImageURL:     img.ImageURL,
			AltText:      img.AltText,
			DisplayOrder: img.DisplayOrder,
			IsPrimary:    img.IsPrimary,
		}
	}

	banners := make([]marketinghandlers.BannerResponse, len(service.Banners))
	for i, b := range service.Banners {
		banners[i] = marketinghandlers.BannerResponse{
			BannerID: b.BannerID,
			Name:     b.Name,
			ImageURL: b.ImageURL,
			LinkURL:  b.LinkURL,
			IsActive: b.IsActive,
		}
	}

	response := ServiceResponse{
		ServiceID:       service.ServiceID,
		CategoryID:      service.CategoryID,
		Name:            service.Name,
		PriorityScore:   service.PriorityScore,
		IsFeatured:      service.IsFeatured,
		Description:     service.Description,
		DurationMinutes: service.DurationMinutes,
		ServiceCategory: ServiceCategoryResponse{CategoryID: service.Category.CategoryID, Name: service.Category.Name},
		Images:          images,
		Banners:         banners,
		CreatedAt:       service.CreatedAt,
		UpdatedAt:       service.UpdatedAt,
	}
	c.JSON(http.StatusOK, gin.H{"data": response})
}

// @Summary		Update a service
// @Description	Updates an existing service's information.
// @Tags			Services
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id		path		string					true	"Service UUID"
// @Param			service	body		UpdateServicePayload	true	"Payload with fields to update"
// @Success		204		{object}	nil						"Service updated successfully"
// @Failure		400		{object}	map[string]interface{}	"Bad Request: Invalid UUID or payload"
// @Failure		404		{object}	map[string]interface{}	"Not Found: Service not found"
// @Failure		500		{object}	map[string]interface{}	"Internal Server Error"
// @Router			/services/{id} [put]
func (h *ProductsHandler) UpdateServiceHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var payload UpdateServicePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	serviceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	service, err := payload.ToService()
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	service.ServiceID = serviceID
	bannerID, err := uuid.Parse(payload.BannerID)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	err = h.services.ProductsServices.UpdateService(ctx, service, bannerID)
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

// @Summary		List all public services
// @Description	Retrieves a paginated list of all public services with optional filtering, sorting, and currency conversion.
// @Tags			Public
// @Produce		json
// @Param			limit		query		int										false	"Number of results per page"	default(10)
// @Param			page		query		int										false	"Page number for pagination"	default(1)
// @Param			sort		query		string									false	"Sort direction (asc/desc)"		enums(asc, desc)	default(desc)
// @Param			sortby		query		string									false	"Sort by field (e.g., price)"	enums(price)
// @Param			search		query		string									false	"Search term for service name"
// @Param			category	query		string									false	"Filter by service category UUID"
// @Param			price		query		int										false	"Filter by maximum price"
// @Param			currency	query		string									false	"Currency for price conversion (e.g., VES)"	default(USD)
// @Success		200			{object}	object{data=[]PublicServiceResponse}	"A paginated list of public services"
// @Failure		400			{object}	map[string]interface{}					"Bad Request: Invalid query parameters"
// @Failure		500			{object}	map[string]interface{}					"Internal Server Error"
// @Router			/public/services [get]
func (h *ProductsHandler) PublicGetServicesHandler(c *gin.Context) {
	ctx := c.Request.Context()

	currency := c.Query("currency")
	if currency == "" {
		currency = "USD"
	}

	fq := pagination.PaginatedFeedQuery{
		Limit:    10,
		Page:     1,
		Sort:     "desc",
		Search:   "",
		Category: "",
		Sortby:   "",
		Price:    0,
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
	currency_rate := rates[currency]

	services, total, err := h.services.ProductsServices.GetPublicServices(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	data := make([]PublicServiceResponse, 0, len(services))
	for _, service := range services {
		images := make([]ImagesRensponse, len(service.Service.Images))
		for i, img := range service.Service.Images {
			images[i] = ImagesRensponse{
				ImageID:      img.ImageID,
				ImageURL:     img.ImageURL,
				AltText:      img.AltText,
				DisplayOrder: img.DisplayOrder,
				IsPrimary:    img.IsPrimary,
			}
		}

		banners := make([]marketinghandlers.BannerResponse, len(service.Service.Banners))
		for i, b := range service.Service.Banners {
			banners[i] = marketinghandlers.BannerResponse{
				BannerID: b.BannerID,
				Name:     b.Name,
				ImageURL: b.ImageURL,
				LinkURL:  b.LinkURL,
				IsActive: b.IsActive,
			}
		}

		data = append(data, PublicServiceResponse{
			ServiceID:       service.Service.ServiceID,
			CategoryID:      service.Service.CategoryID,
			Name:            service.Service.Name,
			Description:     service.Service.Description,
			DurationMinutes: service.Service.DurationMinutes,
			PriorityScore:   service.Service.PriorityScore,
			IsFeatured:      service.Service.IsFeatured,
			CreatedAt:       service.Service.CreatedAt,
			UpdatedAt:       service.Service.UpdatedAt,
			ServiceCategory: ServiceCategoryResponse{
				CategoryID: service.Service.Category.CategoryID,
				Name:       service.Service.Category.Name,
			},
			Images:                  images,
			Banners:                 banners,
			LowestPriceMember:       service.LowestPriceMember,
			LowestPriceNoMember:     service.LowestPriceNonMember,
			BaseCurrency:            "USD",
			Ref_LowestPriceMember:   decimal.NewFromFloat(service.LowestPriceMember).Mul(decimal.NewFromFloat(currency_rate)).Round(2),
			Ref_LowestPriceNoMember: decimal.NewFromFloat(service.LowestPriceNonMember).Mul(decimal.NewFromFloat(currency_rate)).Round(2),
			Ref_BaseCurrency:        currency,
		})
	}

	resp := pagination.PaginatedResponseTotal[PublicServiceResponse]{
		Data:     data,
		Count:    int64(len(services)),
		Next:     "",
		Previous: "",
		Total:    total,
	}

	c.JSON(http.StatusOK, resp)
}

// @Summary		List all public services for a branch
// @Description	Retrieves a paginated list of all public services for a specific branch with optional filtering, sorting, and currency conversion.
// @Tags			Public
// @Produce		json
// @Param			id			path		string									true	"Branch UUID"
// @Param			limit		query		int										false	"Number of results per page"	default(10)
// @Param			page		query		int										false	"Page number for pagination"	default(1)
// @Param			sort		query		string									false	"Sort direction (asc/desc)"		enums(asc, desc)	default(desc)
// @Param			sortby		query		string									false	"Sort by field (e.g., price)"	enums(price)
// @Param			search		query		string									false	"Search term for service name"
// @Param			category	query		string									false	"Filter by service category UUID"
// @Param			price		query		int										false	"Filter by maximum price"
// @Param			currency	query		string									false	"Currency for price conversion (e.g., VES)"	default(USD)
// @Success		200			{object}	object{data=[]PublicServiceResponse}	"A paginated list of public services for the branch"
// @Failure		400			{object}	map[string]interface{}					"Bad Request: Invalid UUID or query parameters"
// @Failure		500			{object}	map[string]interface{}					"Internal Server Error"
// @Router			/public/branches/{id}/services [get]
func (h *ProductsHandler) PublicGetBranchServicesHandler(c *gin.Context) {
	ctx := c.Request.Context()
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	currency := c.Query("currency")
	if currency == "" {
		currency = "USD"
	}

	fq := pagination.PaginatedFeedQuery{
		Limit:    10,
		Page:     1,
		Sort:     "desc",
		Search:   "",
		Category: "",
		Sortby:   "",
		Price:    0,
	}

	fq, err = fq.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	rates, err := h.services.BillingServices.GetLatestRates(ctx)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	currency_rate := rates[currency]

	services, total, err := h.services.ProductsServices.GetPublicBranchServices(ctx, branchID, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	data := make([]PublicServiceResponse, 0, len(services))
	for _, service := range services {
		images := make([]ImagesRensponse, len(service.Service.Images))
		for i, img := range service.Service.Images {
			images[i] = ImagesRensponse{
				ImageID:      img.ImageID,
				ImageURL:     img.ImageURL,
				AltText:      img.AltText,
				DisplayOrder: img.DisplayOrder,
				IsPrimary:    img.IsPrimary,
			}
		}

		banners := make([]marketinghandlers.BannerResponse, len(service.Service.Banners))
		for i, b := range service.Service.Banners {
			banners[i] = marketinghandlers.BannerResponse{
				BannerID: b.BannerID,
				Name:     b.Name,
				ImageURL: b.ImageURL,
				LinkURL:  b.LinkURL,
				IsActive: b.IsActive,
			}
		}

		data = append(data, PublicServiceResponse{
			ServiceID:       service.Service.ServiceID,
			CategoryID:      service.Service.CategoryID,
			Name:            service.Service.Name,
			Description:     service.Service.Description,
			DurationMinutes: service.Service.DurationMinutes,
			PriorityScore:   service.Service.PriorityScore,
			IsFeatured:      service.Service.IsFeatured,
			CreatedAt:       service.Service.CreatedAt,
			UpdatedAt:       service.Service.UpdatedAt,
			ServiceCategory: ServiceCategoryResponse{
				CategoryID: service.Service.Category.CategoryID,
				Name:       service.Service.Category.Name,
			},
			Images:                  images,
			Banners:                 banners,
			LowestPriceMember:       service.LowestPriceMember,
			LowestPriceNoMember:     service.LowestPriceNonMember,
			BaseCurrency:            "USD",
			Ref_LowestPriceMember:   decimal.NewFromFloat(service.LowestPriceMember).Mul(decimal.NewFromFloat(currency_rate)).Round(2),
			Ref_LowestPriceNoMember: decimal.NewFromFloat(service.LowestPriceNonMember).Mul(decimal.NewFromFloat(currency_rate)).Round(2),
			Ref_BaseCurrency:        currency,
		})
	}

	resp := pagination.PaginatedResponseTotal[PublicServiceResponse]{
		Data:     data,
		Count:    int64(len(services)),
		Next:     "",
		Previous: "",
		Total:    total,
	}

	c.JSON(http.StatusOK, resp)

}

// @Summary		Get Client Balances
// @Description	Retrieves all service balances for a specific user.
// @Tags			Services
// @Security		ApiKeyAuth
// @Produce		json
// @Param			user_id	query		string												false	"User UUID (Required for non-clients)"
// @Success		200		{object}	object{data=[]productsdomain.ClientServiceBalance}	"List of client service balances"
// @Failure		400		{object}	map[string]interface{}								"Bad Request"
// @Failure		403		{object}	map[string]interface{}								"Forbidden"
// @Failure		500		{object}	map[string]interface{}								"Internal Server Error"
// @Router			/services/balances [get]
func (h *ProductsHandler) GetClientBalancesHandler(c *gin.Context) {
	ctx := c.Request.Context()
	user := h.services.UserServices.GetUserFromContext(c)
	var targetUserID uuid.UUID

	if user.Role.Name == "client" {
		targetUserID = user.UserID
	} else {
		permission := "services:get"
		if user.Role.Name != "super_admin" {
			ok, err := h.services.UserServices.RoleHasPermission(ctx, user.RoleID, permission)
			if err != nil {
				h.services.LogErrors.InternalServerError(c, err)
				return
			}
			if !ok {
				h.services.LogErrors.ForbiddenResponse(c)
				return
			}
		}
		userIDStr := c.Query("user_id")
		if userIDStr == "" {
			h.services.LogErrors.BadRequestResponse(c, errors.New("user_id query parameter is required"))
			return
		}
		var err error
		targetUserID, err = uuid.Parse(userIDStr)
		if err != nil {
			h.services.LogErrors.BadRequestResponse(c, err)
			return
		}
	}

	balances, err := h.services.ProductsServices.GetClientBalances(ctx, targetUserID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": balances})
}
