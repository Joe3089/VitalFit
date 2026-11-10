package marketinghandlers

import (
	"time"

	"github.com/google/uuid"
	marketingdomain "github.com/vitalfit/api/internal/modules/marketing/domain"
)

type CreateBannerPayload struct {
	Name     string `json:"name" binding:"required"`
	ImageURL string `json:"image_url" binding:"required"`
	LinkURL  string `json:"link_url" binding:"required"`
	IsActive bool   `json:"is_active" binding:"required"`
}

type UpdateBannerPayload struct {
	Name     string `json:"name"`
	ImageURL string `json:"image_url"`
	LinkURL  string `json:"link_url" `
	IsActive bool   `json:"is_active"`
}

func (s *CreateBannerPayload) toBanner() (*marketingdomain.Banner, error) {
	banner := &marketingdomain.Banner{
		Name:     s.Name,
		ImageURL: s.ImageURL,
		LinkURL:  s.LinkURL,
		IsActive: s.IsActive,
	}
	return banner, nil
}

func (s *UpdateBannerPayload) toBanner() (*marketingdomain.Banner, error) {
	banner := &marketingdomain.Banner{
		Name:     s.Name,
		ImageURL: s.ImageURL,
		LinkURL:  s.LinkURL,
		IsActive: s.IsActive,
	}
	return banner, nil
}

type BannerResponse struct {
	BannerID uuid.UUID `json:"banner_id"`
	Name     string    `json:"name"`
	ImageURL string    `json:"image_url"`
	LinkURL  string    `json:"link_url"`
	IsActive bool      `json:"is_active"`
}

type RandomBannerResponse struct {
	ImageURL  string    `json:"image_url"`
	ServiceID uuid.UUID `json:"service_id"`
}

// Promotion payloads

type CreatePromotionPayload struct {
	Name          string                       `json:"name" binding:"required"`
	Code          string                       `json:"code" binding:"required"`
	DiscountType  marketingdomain.DiscountType `json:"discount_type" binding:"required,oneof=Percentage FixedAmount"`
	DiscountValue float64                      `json:"discount_value" binding:"required,gt=0"`
	StartDate     time.Time                    `json:"start_date" binding:"required"`
	EndDate       time.Time                    `json:"end_date" binding:"required"`
	IsActive      bool                         `json:"is_active"`
}

type UpdatePromotionPayload struct {
	Name          string                       `json:"name"`
	Code          string                       `json:"code"`
	DiscountType  marketingdomain.DiscountType `json:"discount_type" binding:"omitempty,oneof=Percentage FixedAmount"`
	DiscountValue float64                      `json:"discount_value" binding:"omitempty,gt=0"`
	StartDate     *time.Time                   `json:"start_date"`
	EndDate       *time.Time                   `json:"end_date"`
	IsActive      *bool                        `json:"is_active"`
}

func (p *CreatePromotionPayload) toPromotion() (*marketingdomain.Promotion, error) {
	promotion := &marketingdomain.Promotion{
		Name:          p.Name,
		Code:          p.Code,
		DiscountType:  p.DiscountType,
		DiscountValue: p.DiscountValue,
		StartDate:     p.StartDate,
		EndDate:       p.EndDate,
		IsActive:      p.IsActive,
	}
	return promotion, nil
}

type PromotionResponse struct {
	PromotionID   uuid.UUID                    `json:"promotion_id"`
	Name          string                       `json:"name"`
	Code          string                       `json:"code"`
	DiscountType  marketingdomain.DiscountType `json:"discount_type"`
	DiscountValue float64                      `json:"discount_value"`
	StartDate     time.Time                    `json:"start_date"`
	EndDate       time.Time                    `json:"end_date"`
	IsActive      bool                         `json:"is_active"`
	CreatedAt     time.Time                    `json:"created_at"`
	UpdatedAt     *time.Time                   `json:"updated_at,omitempty"`
}
