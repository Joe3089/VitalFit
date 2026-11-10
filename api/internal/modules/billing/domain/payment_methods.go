package billingdomain

import (
	// Importado para manejar el tipo json.RawMessage
	"encoding/json"
	"time"

	"github.com/google/uuid"
	branchdomain "github.com/vitalfit/api/internal/modules/branches/domain"
	"gorm.io/gorm"
)

// --- ENUMS DE TIPO ---
// (El que ya tenías)
type PaymentMethodTypeEnum string

const (
	PaymentMethodCash     PaymentMethodTypeEnum = "Cash"
	PaymentMethodCard     PaymentMethodTypeEnum = "Card"
	PaymentMethodTransfer PaymentMethodTypeEnum = "Transfer"
	PaymentMethodOther    PaymentMethodTypeEnum = "Other"
)

type PaymentProcessingTypeEnum string
type BranchPaymentVisibilityEnum string

const (
	PaymentProcessingGateway      PaymentProcessingTypeEnum   = "Gateway"
	PaymentProcessingOffline      PaymentProcessingTypeEnum   = "Offline"
	BranchPaymentVisibilityClient BranchPaymentVisibilityEnum = "Client"
	BranchPaymentVisibilityStaff  BranchPaymentVisibilityEnum = "Staff"
	BranchPaymentVisibilityAll    BranchPaymentVisibilityEnum = "All"
)

type PaymentMethods struct {
	MethodID            uuid.UUID                   `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"method_id"`
	Name                string                      `gorm:"type:varchar(255);not null;unique" json:"name"`
	Type                PaymentMethodTypeEnum       `gorm:"type:payment_method_type_enum;not null" json:"type"`
	Description         string                      `gorm:"type:text" json:"description,omitempty"`
	ProcessingType      PaymentProcessingTypeEnum   `gorm:"type:payment_processing_type_enum;not null;default:'Offline'" json:"processing_type"`
	DisplayName         string                      `gorm:"type:varchar(100)" json:"display_name,omitempty"`
	Configuration       json.RawMessage             `gorm:"type:jsonb;default:'{}'" json:"configuration,omitempty" swaggertype:"object"`
	Visibility          BranchPaymentVisibilityEnum `gorm:"type:branch_payment_visibility_enum;not null;default:'All'" json:"visibility"`
	SurchargeFixed      int64                       `gorm:"type:bigint;not null;default:0" json:"surcharge_fixed"`
	SurchargePercentage float64                     `gorm:"type:decimal(4,2);not null;default:0" json:"surcharge_percentage"`
	GlobalStatus        bool                        `gorm:"type:bool;default:true" json:"global_status"`
	CreatedAt           time.Time                   `json:"created_at"`
	UpdatedAt           time.Time                   `json:"updated_at"`
	DeletedAt           gorm.DeletedAt              `gorm:"index" json:"-"`

	BranchLinks []PaymentMethodsBranch `gorm:"foreignKey:MethodID" json:"branch_links,omitempty" swaggerignore:"true"`
}

type PaymentMethodsBranch struct {
	BranchID  uuid.UUID            `gorm:"type:uuid;primaryKey" json:"branch_id"`
	MethodID  uuid.UUID            `gorm:"type:uuid;primaryKey" json:"method_id"`
	IsActive  bool                 `gorm:"type:bool;not null;default:true" json:"is_active"`
	CreatedAt time.Time            `json:"created_at"`
	UpdatedAt time.Time            `json:"updated_at"`
	Branch    *branchdomain.Branch `gorm:"foreignKey:BranchID" json:"-"`
	Method    *PaymentMethods      `gorm:"foreignKey:MethodID" json:"-"`
}

func (PaymentMethodsBranch) TableName() string {
	return "payment_methods_branch"
}
