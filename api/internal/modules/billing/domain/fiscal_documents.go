package billingdomain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FiscalDocumentType struct {
	DocumentTypeID uuid.UUID      `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"document_type_id"`
	Name           string         `gorm:"type:varchar(100);unique;not null" json:"name"`
	Prefix         string         `gorm:"type:varchar(10);unique;not null" json:"prefix"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

func (FiscalDocumentType) TableName() string {
	return "fiscal_document_types"
}
