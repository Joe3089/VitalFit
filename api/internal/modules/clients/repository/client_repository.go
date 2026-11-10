package clientsrepository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	clientsdomain "github.com/vitalfit/api/internal/modules/clients/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"gorm.io/gorm"
)

type ClientStore struct {
	db *gorm.DB
}

func NewClientStore(db *gorm.DB) *ClientStore {
	return &ClientStore{
		db: db,
	}
}

// CreateMedicalInfo creates a new medical info record
func (r *ClientStore) CreateMedicalInfo(ctx context.Context, medicalInfo *clientsdomain.ClientMedicalInfo) error {
	return r.db.WithContext(ctx).Create(medicalInfo).Error
}

// GetMedicalInfoByUserID retrieves medical info for a specific user
func (r *ClientStore) GetMedicalInfoByUserID(ctx context.Context, userID uuid.UUID) (*clientsdomain.ClientMedicalInfo, error) {
	var medicalInfo clientsdomain.ClientMedicalInfo
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		First(&medicalInfo).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}
	return &medicalInfo, nil
}

// UpdateMedicalInfo updates an existing medical info record
func (r *ClientStore) UpdateMedicalInfo(ctx context.Context, medicalInfo *clientsdomain.ClientMedicalInfo) error {
	return r.db.WithContext(ctx).
		Model(&clientsdomain.ClientMedicalInfo{}).
		Where("user_id = ?", medicalInfo.UserID).
		Updates(medicalInfo).Error
}

// DeleteMedicalInfo soft deletes a medical info record
func (r *ClientStore) DeleteMedicalInfo(ctx context.Context, userID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Delete(&clientsdomain.ClientMedicalInfo{}).Error
}
