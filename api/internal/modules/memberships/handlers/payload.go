package membershipshandlers

import (
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	membershipsdomain "github.com/vitalfit/api/internal/modules/memberships/domain"
)

// CreateMembershipPayload define la estructura esperada en el body
// del request para crear un nuevo tipo de membresía.
type CreateMembershipPayload struct {
	Name         string  `json:"name" binding:"required"`
	Description  string  `json:"description"`
	DurationDays int     `json:"duration_days" binding:"required"`
	Price        float64 `json:"price" binding:"required"`
	IsActive     bool    `json:"is_active"`
}

// UpdateMembershipPayload define la estructura esperada para actualizar
// un tipo de membresía existente.
type UpdateMembershipPayload struct {
	Name         string  `json:"name"`
	Description  string  `json:"description"`
	DurationDays int     `json:"duration_days"`
	Price        float64 `json:"price"`
	IsActive     bool    `json:"is_active"`
}

// Convierte el payload de creación en una entidad de dominio.
func (p *CreateMembershipPayload) toMembership() (*membershipsdomain.MembershipType, error) {
	m := &membershipsdomain.MembershipType{
		Name:         p.Name,
		Description:  p.Description,
		DurationDays: p.DurationDays,
		Price:        p.Price,
		IsActive:     p.IsActive,
	}
	return m, nil
}

// Convierte el payload de actualización en una entidad de dominio.
func (p *UpdateMembershipPayload) toMembership() (*membershipsdomain.MembershipType, error) {
	m := &membershipsdomain.MembershipType{
		Name:         p.Name,
		Description:  p.Description,
		DurationDays: p.DurationDays,
		Price:        p.Price,
		IsActive:     p.IsActive,
	}
	return m, nil
}

// MembershipResponse representa la estructura del tipo de membresía
// devuelta al cliente en las respuestas de lectura.
type MembershipResponse struct {
	MembershipTypeID uuid.UUID `json:"membership_type_id"`
	Name             string    `json:"name"`
	Description      string    `json:"description"`
	DurationDays     int       `json:"duration_days"`
	Price            float64   `json:"price"`
	IsActive         bool      `json:"is_active"`
}

// public membership response
type MembershipPublicResponse struct {
	MembershipTypeID uuid.UUID       `json:"membership_type_id"`
	Name             string          `json:"name"`
	Description      string          `json:"description"`
	DurationDays     int             `json:"duration_days"`
	Price            float64         `json:"price"`
	Base_Currency    string          `json:"base_currency"`
	Ref_Price        decimal.Decimal `json:"ref_price"`
	Ref_Currency     string          `json:"ref_currency"`
	IsActive         bool            `json:"is_active"`
}

type UpdateClientMembershipPayload struct {
	Status         string `json:"status" binding:"required,oneof=Active Expired Cancelled"`
	CancelReasonID string `json:"cancel_reason_id"`
	CancelNotes    string `json:"cancel_notes"`
}

// Cancellation Reasons Payloads

type CreateCancellationReasonPayload struct {
	Description string `json:"description" binding:"required"`
	IsActive    bool   `json:"is_active"`
}

type UpdateCancellationReasonPayload struct {
	Description string `json:"description"`
	IsActive    *bool  `json:"is_active"`
}

type CancellationReasonResponse struct {
	ReasonID    uuid.UUID `json:"reason_id"`
	Description string    `json:"description"`
	IsActive    bool      `json:"is_active"`
}
