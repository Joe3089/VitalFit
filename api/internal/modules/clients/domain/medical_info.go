package clientsdomain

import (
	"time"

	"github.com/google/uuid"
)

// ClientMedicalInfo stores encrypted medical information for clients
type ClientMedicalInfo struct {
	MedicalInfoID uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"medical_info_id"`
	UserID        uuid.UUID `gorm:"type:uuid;not null;unique;index" json:"user_id"`

	// Encrypted medical data fields
	MedicalConditions string `gorm:"type:text" json:"medical_conditions,omitempty"` // Encrypted
	MedicalRisks      string `gorm:"type:text" json:"medical_risks,omitempty"`      // Encrypted
	Warnings          string `gorm:"type:text" json:"warnings,omitempty"`           // Encrypted
	Allergies         string `gorm:"type:text" json:"allergies,omitempty"`          // Encrypted
	Medications       string `gorm:"type:text" json:"medications,omitempty"`        // Encrypted
	EmergencyContact  string `gorm:"type:text" json:"emergency_contact,omitempty"`  // Encrypted
	BloodType         string `gorm:"type:varchar(10)" json:"blood_type,omitempty"`

	// Metadata
	LastUpdatedBy uuid.UUID  `gorm:"type:uuid;not null" json:"last_updated_by"`
	CreatedAt     time.Time  `gorm:"default:now()" json:"created_at"`
	UpdatedAt     time.Time  `gorm:"default:now()" json:"updated_at"`
	DeletedAt     *time.Time `gorm:"index" json:"deleted_at,omitempty"`
}

func (ClientMedicalInfo) TableName() string {
	return "client_medical_info"
}
