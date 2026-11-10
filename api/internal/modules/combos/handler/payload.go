package comboshandler

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	combosdomain "github.com/vitalfit/api/internal/modules/combos/domain"
)

type CreatePackageItemRequest struct {
	ServiceID        string `json:"serviceId" binding:"required"`
	SessionsIncluded int    `json:"sessionsIncluded" binding:"required,min=1"`
}

type CreatePackageRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	Price       float64 `json:"price" binding:"required,gt=0"`

	StartAt string `json:"startAt,omitempty"`
	EndAt   string `json:"endAt,omitempty"`

	PackageItems []CreatePackageItemRequest `json:"packageItems" binding:"required,min=1"`
}

func (r *CreatePackageRequest) ToPackage() (*combosdomain.Package, error) {
	var pkg combosdomain.Package

	pkg.Name = r.Name
	pkg.Description = r.Description
	pkg.Price = r.Price

	if r.StartAt != "" {
		startAt, err := time.Parse(time.RFC3339, r.StartAt)
		if err != nil {
			return nil, err
		}
		pkg.StartAt = &startAt
	}

	if r.EndAt != "" {
		endAt, err := time.Parse(time.RFC3339, r.EndAt)
		if err != nil {
			return nil, err
		}
		pkg.EndAt = &endAt
	}

	pkg.PackageItems = make([]combosdomain.PackageItem, len(r.PackageItems))
	for i, item := range r.PackageItems {
		serviceID, err := uuid.Parse(item.ServiceID)
		if err != nil {
			return nil, err
		}
		pkg.PackageItems[i] = combosdomain.PackageItem{
			ServiceID:        serviceID,
			SessionsIncluded: item.SessionsIncluded,
		}
	}

	return &pkg, nil
}

//response

type PackageResponse struct {
	PackageID   uuid.UUID  `json:"packageId"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	Price       float64    `json:"price"`
	IsActive    bool       `json:"isActive"`
	StartAt     *time.Time `json:"startAt"`
	EndAt       *time.Time `json:"endAt"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

type PackageResponseByID struct {
	PackageResponse

	PackageItems []PackageItemResponse `json:"packageItems"`
}

type PackageItemResponse struct {
	ServiceID        uuid.UUID `json:"serviceId"`
	Name             string    `json:"name"`
	SessionsIncluded int       `json:"sessionsIncluded"`
}

type PublicPackageResponse struct {
	PackageID    uuid.UUID       `json:"packageId"`
	Name         string          `json:"name"`
	Description  string          `json:"description"`
	IsActive     bool            `json:"isActive"`
	StartAt      *time.Time      `json:"startAt"`
	EndAt        *time.Time      `json:"endAt"`
	Price        float64         `json:"price"`
	BaseCurrency string          `json:"base_currency"`
	RefPrice     decimal.Decimal `json:"ref_price"`
	RefCurrency  string          `json:"ref_currency"`
}
