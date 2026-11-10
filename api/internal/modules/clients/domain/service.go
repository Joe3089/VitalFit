package clientsdomain

import (
	"context"

	"github.com/google/uuid"
)

type ClientServiceInterface interface {
	// Medical Info Operations
	CreateMedicalInfo(ctx context.Context, userID, modifiedBy uuid.UUID, userRole string, data *MedicalInfoData, ipAddress, userAgent string) (*ClientMedicalInfo, error)
	GetMedicalInfo(ctx context.Context, userID, requestedBy uuid.UUID, userRole string, ipAddress, userAgent string) (*MedicalInfoData, error)
	UpdateMedicalInfo(ctx context.Context, userID, modifiedBy uuid.UUID, userRole string, data *MedicalInfoData, ipAddress, userAgent string) (*ClientMedicalInfo, error)
}

// MedicalInfoData represents the unencrypted medical information
type MedicalInfoData struct {
	MedicalConditions string `json:"medical_conditions,omitempty"`
	MedicalRisks      string `json:"medical_risks,omitempty"`
	Warnings          string `json:"warnings,omitempty"`
	Allergies         string `json:"allergies,omitempty"`
	Medications       string `json:"medications,omitempty"`
	EmergencyContact  string `json:"emergency_contact,omitempty"`
	BloodType         string `json:"blood_type,omitempty"`
}
