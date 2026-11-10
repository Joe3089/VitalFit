package marketinghandlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/pagination"
)

// @Summary		Create a new banner
// @Description	Adds a new promotional banner to the system.
// @Tags			Marketing
// @Accept			json
// @Produce		json
// @Security		ApiKeyAuth
// @Param			banner	body		CreateBannerPayload		true	"Banner creation payload"
// @Success		201		{object}	marketingdomain.Banner	"Banner created successfully"
// @Failure		400		{object}	object{error=string}	"error: Bad Request"
// @Failure		409		{object}	object{error=string}	"error: Conflict"
// @Failure		500		{object}	object{error=string}	"error: Internal Server Error"
// @Router			/marketing/banners [post]
func (h *MarketingHandler) CreateBannerHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var payload CreateBannerPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	banner, err := payload.toBanner()
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	err = h.services.MarketingServices.CreateBanner(ctx, banner)
	if err != nil {
		switch err {
		case shared_errors.ErrConflict:
			h.services.LogErrors.ConflictResponse(c, err)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}
	c.JSON(http.StatusCreated, banner)
}

// @Summary		Update a banner
// @Description	Updates an existing promotional banner's details.
// @Tags			Marketing
// @Accept			json
// @Produce		json
// @Security		ApiKeyAuth
// @Param			id		path		string					true	"Banner UUID"
// @Param			banner	body		UpdateBannerPayload		true	"Banner update payload"
// @Success		200		{object}	marketingdomain.Banner	"Banner updated successfully"
// @Failure		400		{object}	object{error=string}	"error: Bad Request - Invalid ID or payload"
// @Failure		404		{object}	object{error=string}	"error: Not Found - Banner not found"
// @Failure		500		{object}	object{error=string}	"error: Internal Server Error"
// @Router			/marketing/banners/{id} [put]
func (h *MarketingHandler) UpdateBannerHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var payload UpdateBannerPayload
	bannerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	banner, err := payload.toBanner()
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	banner.BannerID = bannerID
	err = h.services.MarketingServices.UpdateBanner(ctx, banner)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}
	c.JSON(http.StatusOK, banner)
}

// @Summary		Delete a banner
// @Description	Deletes a promotional banner from the system.
// @Tags			Marketing
// @Produce		json
// @Security		ApiKeyAuth
// @Param			id	path		string					true	"Banner UUID"
// @Success		204	{object}	nil						"No Content"
// @Failure		400	{object}	object{error=string}	"error: Bad Request - Invalid ID"
// @Failure		404	{object}	object{error=string}	"error: Not Found - Banner not found"
// @Failure		500	{object}	object{error=string}	"error: Internal Server Error"
// @Router			/marketing/banners/{id} [delete]
func (h *MarketingHandler) DeleteBannerHandler(c *gin.Context) {
	ctx := c.Request.Context()
	bannerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	err = h.services.MarketingServices.DeleteBanner(ctx, bannerID)
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

// @Summary		Get banner by ID
// @Description	Retrieves a single promotional banner by its UUID.
// @Tags			Marketing
// @Produce		json
// @Security		ApiKeyAuth
// @Param			id	path		string	true	"Banner UUID"
// @Success		200	{object}	object{data=BannerResponse}
// @Failure		400	{object}	object{error=string}	"error: Bad Request - Invalid ID"
// @Failure		404	{object}	object{error=string}	"error: Not Found - Banner not found"
// @Failure		500	{object}	object{error=string}	"error: Internal Server Error"
// @Router			/marketing/banners/{id} [get]
func (h *MarketingHandler) GetBannerByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()
	bannerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	banner, err := h.services.MarketingServices.GetBannerByID(ctx, bannerID)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}
	resp := &BannerResponse{
		BannerID: banner.BannerID,
		Name:     banner.Name,
		ImageURL: banner.ImageURL,
		LinkURL:  banner.LinkURL,
		IsActive: banner.IsActive,
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// @Summary		List all banners
// @Description	Retrieves a list of all promotional banners.
// @Tags			Marketing
// @Produce		json
// @Security		ApiKeyAuth
// @Success		200	{object}	object{data=[]BannerResponse}
// @Failure		500	{object}	object{error=string}	"error: Internal Server Error"
// @Router			/marketing/banners [get]
func (h *MarketingHandler) GetBannersHandler(c *gin.Context) {
	ctx := c.Request.Context()
	banners, err := h.services.MarketingServices.GetBanners(ctx)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	resp := make([]*BannerResponse, 0, len(banners))
	for _, banner := range banners {
		resp = append(resp, &BannerResponse{

			BannerID: banner.BannerID,
			Name:     banner.Name,
			ImageURL: banner.ImageURL,
			LinkURL:  banner.LinkURL,
			IsActive: banner.IsActive,
		})

	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// Promotion handlers

// @Summary		Create a new promotion
// @Description	Adds a new promotion, coupon or discount to the system.
// @Tags			Marketing
// @Accept			json
// @Produce		json
// @Security		ApiKeyAuth
// @Param			promotion	body		CreatePromotionPayload		true	"Promotion creation payload"
// @Success		201			{object}	marketingdomain.Promotion	"Promotion created successfully"
// @Failure		400			{object}	object{error=string}		"error: Bad Request"
// @Failure		409			{object}	object{error=string}		"error: Conflict - Code already exists"
// @Failure		500			{object}	object{error=string}		"error: Internal Server Error"
// @Router			/marketing/promotions [post]
func (h *MarketingHandler) CreatePromotionHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var payload CreatePromotionPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	// Validate dates
	if payload.EndDate.Before(payload.StartDate) {
		h.services.LogErrors.BadRequestResponse(c, nil)
		return
	}

	promotion, err := payload.toPromotion()
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	err = h.services.MarketingServices.CreatePromotion(ctx, promotion)
	if err != nil {
		switch err {
		case shared_errors.ErrConflict:
			h.services.LogErrors.ConflictResponse(c, err)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}
	c.JSON(http.StatusCreated, promotion)
}

// @Summary		Update a promotion
// @Description	Updates an existing promotion's details.
// @Tags			Marketing
// @Accept			json
// @Produce		json
// @Security		ApiKeyAuth
// @Param			id			path		string						true	"Promotion UUID"
// @Param			promotion	body		UpdatePromotionPayload		true	"Promotion update payload"
// @Success		200			{object}	marketingdomain.Promotion	"Promotion updated successfully"
// @Failure		400			{object}	object{error=string}		"error: Bad Request - Invalid ID or payload"
// @Failure		404			{object}	object{error=string}		"error: Not Found - Promotion not found"
// @Failure		500			{object}	object{error=string}		"error: Internal Server Error"
// @Router			/marketing/promotions/{id} [put]
func (h *MarketingHandler) UpdatePromotionHandler(c *gin.Context) {
	ctx := c.Request.Context()
	var payload UpdatePromotionPayload

	promotionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	// Validate dates if both are provided
	if payload.StartDate != nil && payload.EndDate != nil {
		if payload.EndDate.Before(*payload.StartDate) {
			h.services.LogErrors.BadRequestResponse(c, nil)
			return
		}
	}

	// Get existing promotion
	existingPromotion, err := h.services.MarketingServices.GetPromotionByID(ctx, promotionID)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	// Update only provided fields
	if payload.Name != "" {
		existingPromotion.Name = payload.Name
	}
	if payload.Code != "" {
		existingPromotion.Code = payload.Code
	}
	if payload.DiscountType != "" {
		existingPromotion.DiscountType = payload.DiscountType
	}
	if payload.DiscountValue > 0 {
		existingPromotion.DiscountValue = payload.DiscountValue
	}
	if payload.StartDate != nil {
		existingPromotion.StartDate = *payload.StartDate
	}
	if payload.EndDate != nil {
		existingPromotion.EndDate = *payload.EndDate
	}
	if payload.IsActive != nil {
		existingPromotion.IsActive = *payload.IsActive
	}

	err = h.services.MarketingServices.UpdatePromotion(ctx, existingPromotion)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}
	c.JSON(http.StatusOK, existingPromotion)
}

// @Summary		Delete a promotion
// @Description	Deletes a promotion from the system.
// @Tags			Marketing
// @Produce		json
// @Security		ApiKeyAuth
// @Param			id	path		string					true	"Promotion UUID"
// @Success		204	{object}	nil						"No Content"
// @Failure		400	{object}	object{error=string}	"error: Bad Request - Invalid ID"
// @Failure		404	{object}	object{error=string}	"error: Not Found - Promotion not found"
// @Failure		500	{object}	object{error=string}	"error: Internal Server Error"
// @Router			/marketing/promotions/{id} [delete]
func (h *MarketingHandler) DeletePromotionHandler(c *gin.Context) {
	ctx := c.Request.Context()
	promotionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	err = h.services.MarketingServices.DeletePromotion(ctx, promotionID)
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

// @Summary		Get promotion by ID
// @Description	Retrieves a single promotion by its UUID.
// @Tags			Marketing
// @Produce		json
// @Security		ApiKeyAuth
// @Param			id	path		string	true	"Promotion UUID"
// @Success		200	{object}	object{data=PromotionResponse}
// @Failure		400	{object}	object{error=string}	"error: Bad Request - Invalid ID"
// @Failure		404	{object}	object{error=string}	"error: Not Found - Promotion not found"
// @Failure		500	{object}	object{error=string}	"error: Internal Server Error"
// @Router			/marketing/promotions/{id} [get]
func (h *MarketingHandler) GetPromotionByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()
	promotionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	promotion, err := h.services.MarketingServices.GetPromotionByID(ctx, promotionID)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	resp := &PromotionResponse{
		PromotionID:   promotion.PromotionID,
		Name:          promotion.Name,
		Code:          promotion.Code,
		DiscountType:  promotion.DiscountType,
		DiscountValue: promotion.DiscountValue,
		StartDate:     promotion.StartDate,
		EndDate:       promotion.EndDate,
		IsActive:      promotion.IsActive,
		CreatedAt:     promotion.CreatedAt,
		UpdatedAt:     promotion.UpdatedAt,
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// @Summary		List all promotions
// @Description	Retrieves a list of all promotions.
// @Tags			Marketing
// @Produce		json
// @Security		ApiKeyAuth
// @Param			limit	query		int		false	"Number of results per page"	default(10)
// @Param			page	query		int		false	"Page number for pagination"	default(1)
// @Param			sort	query		string	false	"Sort direction (asc/desc)"		enums(asc, desc)	default(desc)
// @Param			search	query		string	false	"Search term"
// @Success		200		{object}	object{data=[]PromotionResponse}
// @Failure		500		{object}	object{error=string}	"error: Internal Server Error"
// @Router			/marketing/promotions [get]
func (h *MarketingHandler) GetPromotionsHandler(c *gin.Context) {
	ctx := c.Request.Context()

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

	nextURL := fmt.Sprintf("/marketing/promotions?limit=%d&page=%d&sort=%s&search=%s", fq.Limit, fq.Page+1, fq.Sort, fq.Search)
	previousPage := fq.Page - 1
	if previousPage <= 0 {
		previousPage = 1
	}
	previousURL := fmt.Sprintf("/marketing/promotions?limit=%d&page=%d&sort=%s&search=%s", fq.Limit, previousPage, fq.Sort, fq.Search)

	promotions, total, err := h.services.MarketingServices.GetPromotions(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	resp := make([]*PromotionResponse, 0, len(promotions))
	for _, promotion := range promotions {
		resp = append(resp, &PromotionResponse{
			PromotionID:   promotion.PromotionID,
			Name:          promotion.Name,
			Code:          promotion.Code,
			DiscountType:  promotion.DiscountType,
			DiscountValue: promotion.DiscountValue,
			StartDate:     promotion.StartDate,
			EndDate:       promotion.EndDate,
			IsActive:      promotion.IsActive,
			CreatedAt:     promotion.CreatedAt,
			UpdatedAt:     promotion.UpdatedAt,
		})
	}

	response := pagination.PaginatedResponseTotal[*PromotionResponse]{
		Data:     resp,
		Count:    int64(len(promotions)),
		Next:     nextURL,
		Previous: previousURL,
		Total:    total,
	}

	c.JSON(http.StatusOK, response)
}

// @Summary		Get random banner with service
// @Description	Retrieves a random active banner with its associated service ID. This endpoint is public and does not require authentication.
// @Tags			Marketing
// @Produce		json
// @Success		200	{object}	object{data=RandomBannerResponse}
// @Failure		404	{object}	object{error=string}	"error: Not Found - No active banners with services available"
// @Failure		500	{object}	object{error=string}	"error: Internal Server Error"
// @Router			/marketing/banners/random [get]
func (h *MarketingHandler) GetRandomBannerHandler(c *gin.Context) {
	ctx := c.Request.Context()

	banner, serviceID, err := h.services.MarketingServices.GetRandomBannerWithService(ctx)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	resp := &RandomBannerResponse{
		ImageURL:  banner.ImageURL,
		ServiceID: serviceID,
	}

	c.JSON(http.StatusOK, gin.H{"data": resp})
}
