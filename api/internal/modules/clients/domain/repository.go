package clientsdomain

import (
	"context"

	"github.com/google/uuid"
)

type ClientRepository interface {
	// Medical Info Operations
	CreateMedicalInfo(ctx context.Context, medicalInfo *ClientMedicalInfo) error
	GetMedicalInfoByUserID(ctx context.Context, userID uuid.UUID) (*ClientMedicalInfo, error)
	UpdateMedicalInfo(ctx context.Context, medicalInfo *ClientMedicalInfo) error
	DeleteMedicalInfo(ctx context.Context, userID uuid.UUID) error
}
