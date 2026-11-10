package branchdomain

import (
	"time"

	"github.com/google/uuid"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	"gorm.io/gorm"
)

type BranchStatusEnum string
type DayOfWeekEnum string
type PaymentMethodTypeEnum string

const (
	BranchStatusActive      BranchStatusEnum = "Active"
	BranchStatusInactive    BranchStatusEnum = "Inactive"
	BranchStatusMaintenance BranchStatusEnum = "Maintenance"

	DayMonday    DayOfWeekEnum = "Monday"
	DayTuesday   DayOfWeekEnum = "Tuesday"
	DayWednesday DayOfWeekEnum = "Wednesday"
	DayThursday  DayOfWeekEnum = "Thursday"
	DayFriday    DayOfWeekEnum = "Friday"
	DaySaturday  DayOfWeekEnum = "Saturday"
	DaySunday    DayOfWeekEnum = "Sunday"

	PaymentMethodCash     PaymentMethodTypeEnum = "Cash"
	PaymentMethodCard     PaymentMethodTypeEnum = "Card"
	PaymentMethodTransfer PaymentMethodTypeEnum = "Transfer"
	PaymentMethodOther    PaymentMethodTypeEnum = "Other"
)

type Branch struct {
	BranchID    uuid.UUID        `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"branch_id"`
	Name        string           `gorm:"type:varchar(255);not null" json:"name"`
	TaxID       string           `gorm:"type:varchar(20);unique;not null" json:"tax_id"`
	Address     string           `gorm:"type:text" json:"address"`
	Latitude    float64          `gorm:"type:float" json:"latitude"`
	Longitude   float64          `gorm:"type:float" json:"longitude"`
	MaxCapacity int              `gorm:"type:int" json:"max_capacity"`
	Phone       string           `gorm:"type:varchar(30)" json:"phone"`
	Status      BranchStatusEnum `gorm:"type:branch_status_enum;not null;default:'Active'" json:"status"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
	DeletedAt   gorm.DeletedAt   `gorm:"index" json:"deleted_at,omitempty" swaggertype:"primitive,string"`

	StateID uuid.UUID `gorm:"type:uuid;not null" json:"state_id"`
	State   States    `json:"state"`

	ManagerID uuid.UUID `gorm:"column:user_id;type:uuid;not null" json:"manager_id"`

	Manager authdomain.Users `gorm:"foreignKey:ManagerID" json:"manager"`

	OperatingHours []OperatingHours `gorm:"foreignKey:BranchID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"operating_hours,omitempty"`
}

type OperatingHours struct {
	HourID    uuid.UUID     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"hour_id"`
	DayOfWeek DayOfWeekEnum `gorm:"type:day_of_week_enum;not null;uniqueIndex:idx_branch_day" json:"day_of_week"`
	BranchID  uuid.UUID     `gorm:"type:uuid;not null;uniqueIndex:idx_branch_day" json:"branch_id"`
	OpenTime  *string       `gorm:"type:time" json:"open_time"`
	CloseTime *string       `gorm:"type:time" json:"close_time"`
	IsClosed  bool          `gorm:"type:bool;default:false" json:"is_closed"`
}

type BranchQueryResults struct {
	Branches []*Branch
}

type BranchStatusCount struct {
	Active      int64
	Inactive    int64
	Maintenance int64
	Total       int64
}

type StatusCount struct {
	Status string
	Count  int64
}

type PublicBranchMapResponse struct {
	BranchID  uuid.UUID `json:"branch_id"`
	Name      string    `json:"name"`
	Address   string    `json:"address"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Phone     string    `json:"phone"`
}
