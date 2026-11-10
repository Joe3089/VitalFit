package faceauthrepository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	"gorm.io/gorm"
)

type FaceAuthStore struct {
	db *gorm.DB
}

func NewFaceAuthStore(db *gorm.DB) *FaceAuthStore {
	return &FaceAuthStore{db: db}
}

func (r *FaceAuthStore) UpdateUserFaceID(ctx context.Context, userID uuid.UUID, faceID string) error {
	result := r.db.WithContext(ctx).Model(&authdomain.Users{}).
		Where("user_id = ?", userID).
		Updates(map[string]interface{}{
			"face_id":           &faceID,
			"face_auth_enabled": true,
		})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("user not found with ID: %s", userID)
	}
	return nil
}

func (r *FaceAuthStore) GetUserIDByFaceID(ctx context.Context, faceID string) (uuid.UUID, error) {
	var user authdomain.Users

	err := r.db.WithContext(ctx).
		Select("user_id").
		Where("face_id = ? AND face_auth_enabled = ?", faceID, true).
		First(&user).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return uuid.Nil, fmt.Errorf("face not associated with any active user")
		}
		return uuid.Nil, err
	}

	return user.UserID, nil
}
