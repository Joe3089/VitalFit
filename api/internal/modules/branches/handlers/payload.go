package branchhandlers

import (
	"github.com/google/uuid"
	branchdomain "github.com/vitalfit/api/internal/modules/branches/domain"
)

type CreateBranchPayload struct {
	Name           string                 `json:"name" binding:"required,min=3"`
	TaxID          string                 `json:"tax_id" binding:"required,min=5"`
	Address        string                 `json:"address"`
	Latitude       float64                `json:"latitude"`
	Longitude      float64                `json:"longitude"`
	MaxCapacity    int                    `json:"max_capacity" binding:"omitempty,min=1"`
	Phone          string                 `json:"phone"`
	Status         string                 `json:"status" binding:"omitempty,oneof=Active Inactive Maintenance"`
	State          string                 `json:"state" binding:"required"`
	Country        string                 `json:"country" binding:"required"`
	ManagerID      uuid.UUID              `json:"manager_id" binding:"required"`
	OperatingHours []OperatingHourPayload `json:"operating_hours" binding:"omitempty,dive"`
}

type OperatingHourPayload struct {
	DayOfWeek string  `json:"day_of_week" binding:"required,oneof=Monday Tuesday Wednesday Thursday Friday Saturday Sunday"`
	OpenTime  *string `json:"open_time"`
	CloseTime *string `json:"close_time"`
	IsClosed  bool    `json:"is_closed" default:"false"`
}

func (s *CreateBranchPayload) toBranch() (*branchdomain.Branch, error) {
	branch := &branchdomain.Branch{
		Name:        s.Name,
		TaxID:       s.TaxID,
		Address:     s.Address,
		Latitude:    s.Latitude,
		Longitude:   s.Longitude,
		MaxCapacity: s.MaxCapacity,
		Phone:       s.Phone,
		Status:      branchdomain.BranchStatusEnum(s.Status),
		ManagerID:   s.ManagerID,
	}

	return branch, nil
}

func (s *OperatingHourPayload) toOperatingHour() (*branchdomain.OperatingHours, error) {
	operatingHour := &branchdomain.OperatingHours{
		DayOfWeek: branchdomain.DayOfWeekEnum(s.DayOfWeek),
		OpenTime:  s.OpenTime,
		CloseTime: s.CloseTime,
		IsClosed:  s.IsClosed,
	}

	return operatingHour, nil
}

type UpdateBranchPayload struct {
	Name           string                 `json:"name" binding:"required,min=3"`
	TaxID          string                 `json:"tax_id" binding:"required,min=5"`
	Address        string                 `json:"address"`
	Latitude       float64                `json:"latitude"`
	Longitude      float64                `json:"longitude"`
	MaxCapacity    int                    `json:"max_capacity" binding:"omitempty,min=1"`
	Phone          string                 `json:"phone"`
	Status         string                 `json:"status" binding:"omitempty,oneof=Active Inactive Maintenance"`
	State          string                 `json:"state" binding:"required"`
	Country        string                 `json:"country" binding:"required"`
	ManagerID      uuid.UUID              `json:"manager_id" binding:"required"`
	OperatingHours []OperatingHourPayload `json:"operating_hours" binding:"omitempty,dive"`
}

// response
type BranchListResponse struct {
	BranchID        uuid.UUID `json:"branch_id"`
	Name            string    `json:"name"`
	TaxID           string    `json:"tax_id"`
	StateName       string    `json:"state_name"`
	CountryName     string    `json:"country_name"`
	ManagerName     string    `json:"manager_name"`
	ManagerLastName string    `json:"manager_last_name"`
	Status          string    `json:"status"`
}

type BranchResponseData struct {
	BranchID         uuid.UUID                     `json:"branch_id"`
	Name             string                        `json:"name" binding:"required,min=3"`
	TaxID            string                        `json:"tax_id" binding:"required,min=5"`
	Address          string                        `json:"address"`
	Latitude         float64                       `json:"latitude"`
	Longitude        float64                       `json:"longitude"`
	MaxCapacity      int                           `json:"max_capacity" binding:"omitempty,min=1"`
	Phone            string                        `json:"phone"`
	Status           string                        `json:"status" binding:"omitempty,oneof=Active Inactive Maintenance"`
	State            string                        `json:"state" binding:"required"`
	Country          string                        `json:"country" binding:"required"`
	ManagerID        uuid.UUID                     `json:"manager"`
	ManagerFirstName string                        `json:"manager_first_name"`
	ManagerLastName  string                        `json:"manager_last_name"`
	OperatingHours   []branchdomain.OperatingHours `json:"operating_hours" binding:"omitempty,dive"`
}

type PublicBranchMapResponse struct {
	BranchID  uuid.UUID `json:"branch_id"`
	Name      string    `json:"name"`
	Address   string    `json:"address"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Phone     string    `json:"phone"`
}
