package productshandler

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	marketinghandlers "github.com/vitalfit/api/internal/modules/marketing/handlers"
	productsdomain "github.com/vitalfit/api/internal/modules/products/domain"
)

// requests
type CreateServicePayload struct {
	Name          string                  `json:"name" binding:"required"`
	CategoryID    string                  `json:"category_id" binding:"required"`
	Description   string                  `json:"description" binding:"required"`
	Duration      int64                   `json:"duration" binding:"required,gte=1,lte=200"`
	Priority      int64                   `json:"priority" binding:"required,gte=1,lte=100"`
	IsFeatured    bool                    `json:"is_featured"`
	BannerID      string                  `json:"banner_id" binding:"required"`
	ServiceImages []ServiceImagesPayloads `json:"service_images"`
}

func (s *CreateServicePayload) ToService() (*productsdomain.Service, error) {
	categoryID, err := uuid.Parse(s.CategoryID)
	if err != nil {
		return nil, err
	}
	serviceImages := make([]productsdomain.ServiceImage, 0, len(s.ServiceImages))
	for _, image := range s.ServiceImages {
		image, err := image.ToServiceImage()
		if err != nil {
			return nil, err
		}
		serviceImages = append(serviceImages, *image)
	}

	service := &productsdomain.Service{
		Name:            s.Name,
		CategoryID:      categoryID,
		Description:     s.Description,
		DurationMinutes: s.Duration,
		PriorityScore:   s.Priority,
		IsFeatured:      s.IsFeatured,
		Images:          serviceImages,
	}
	return service, nil

}

type UpdateServicePayload struct {
	CreateServicePayload
}

type ServiceImagesPayloads struct {
	ImageURL     string `json:"image_url" binding:"required"`
	AltText      string `json:"alt_text"`
	DisplayOrder int    `json:"display_order"`
	IsPrimary    bool   `json:"is_primary"`
}

func (s *ServiceImagesPayloads) ToServiceImage() (*productsdomain.ServiceImage, error) {
	serviceImage := &productsdomain.ServiceImage{
		ImageURL:     s.ImageURL,
		AltText:      s.AltText,
		DisplayOrder: s.DisplayOrder,
		IsPrimary:    s.IsPrimary,
	}
	return serviceImage, nil
}

type BranchServicePayload struct {
	ServiceID         string  `json:"service_id"`
	IsVisible         bool    `json:"is_visible"`
	MaxCapacity       int     `json:"max_capacity"`
	PriceForMember    float64 `json:"price_for_member"`
	PriceForNonMember float64 `json:"price_for_non_member"`
}

type AssignBranchServicePayload struct {
	Services []BranchServicePayload `json:"services"`
}

func (s *BranchServicePayload) ToServiceBranchDetail() (*productsdomain.ServiceBranchDetail, error) {
	serviceID, err := uuid.Parse(s.ServiceID)
	if err != nil {
		return nil, err
	}

	serviceBranchDetail := &productsdomain.ServiceBranchDetail{
		ServiceID:         serviceID,
		IsVisible:         s.IsVisible,
		MaxCapacity:       s.MaxCapacity,
		PriceForMember:    s.PriceForMember,
		PriceForNonMember: s.PriceForNonMember,
	}
	return serviceBranchDetail, nil
}

type UpdateBranchServicePayload struct {
	IsVsible          bool    `json:"is_visible"`
	MaxCapacity       int     `json:"max_capacity"`
	PriceForMember    float64 `json:"price_for_member"`
	PriceForNonMember float64 `json:"price_for_non_member"`
}

func (s *UpdateBranchServicePayload) ToServiceBranchDetail() (*productsdomain.ServiceBranchDetail, error) {

	serviceBranchDetail := &productsdomain.ServiceBranchDetail{
		IsVisible:         s.IsVsible,
		MaxCapacity:       s.MaxCapacity,
		PriceForMember:    s.PriceForMember,
		PriceForNonMember: s.PriceForNonMember,
	}
	return serviceBranchDetail, nil
}

// responses
type ServiceResponse struct {
	ServiceID       uuid.UUID                          `json:"service_id"`
	CategoryID      uuid.UUID                          `json:"category_id"`
	Name            string                             `json:"name"`
	Description     string                             `json:"description"`
	DurationMinutes int64                              `json:"duration_minutes"`
	PriorityScore   int64                              `json:"priority_score"`
	IsFeatured      bool                               `json:"is_featured"`
	CreatedAt       time.Time                          `json:"created_at"`
	UpdatedAt       time.Time                          `json:"updated_at"`
	ServiceCategory ServiceCategoryResponse            `json:"service_category"`
	Images          []ImagesRensponse                  `json:"images"`
	Banners         []marketinghandlers.BannerResponse `json:"banners"`
}

type ImagesRensponse struct {
	ImageID      uuid.UUID `json:"image_id"`
	ImageURL     string    `json:"image_url"`
	AltText      string    `json:"alt_text"`
	DisplayOrder int       `json:"display_order"`
	IsPrimary    bool      `json:"is_primary"`
}

type ServiceCategoryResponse struct {
	CategoryID uuid.UUID `json:"category_id"`
	Name       string    `json:"name"`
}

type BranchServiceResponse struct {
	BranchID          uuid.UUID `json:"branch_id"`
	ServiceID         uuid.UUID `json:"service_id"`
	ServiceName       string    `json:"service_name"`
	IsVisible         bool      `json:"is_visible"`
	MaxCapacity       int       `json:"max_capacity"`
	PriceForMember    float64   `json:"price_for_member"`
	PriceForNonMember float64   `json:"price_for_non_member"`
}

type PublicServiceResponse struct {
	ServiceID               uuid.UUID                          `json:"service_id"`
	CategoryID              uuid.UUID                          `json:"category_id"`
	Name                    string                             `json:"name"`
	Description             string                             `json:"description"`
	DurationMinutes         int64                              `json:"duration_minutes"`
	PriorityScore           int64                              `json:"priority_score"`
	IsFeatured              bool                               `json:"is_featured"`
	CreatedAt               time.Time                          `json:"created_at"`
	UpdatedAt               time.Time                          `json:"updated_at"`
	ServiceCategory         ServiceCategoryResponse            `json:"service_category"`
	Images                  []ImagesRensponse                  `json:"images"`
	Banners                 []marketinghandlers.BannerResponse `json:"banners"`
	LowestPriceMember       float64                            `json:"lowest_price_member"`
	LowestPriceNoMember     float64                            `json:"lowest_price_no_member"`
	BaseCurrency            string                             `json:"base_currency"`
	Ref_LowestPriceMember   decimal.Decimal                    `json:"ref_lowest_price_member"`
	Ref_LowestPriceNoMember decimal.Decimal                    `json:"ref_lowest_price_no_member"`
	Ref_BaseCurrency        string                             `json:"ref_base_currency"`
}
