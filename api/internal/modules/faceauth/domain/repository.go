package faceauthdomain

import (
	"context"

	"github.com/google/uuid"
)

type FaceAuthRepository interface {
	UpdateUserFaceID(ctx context.Context, userID uuid.UUID, faceID string) error
	GetUserIDByFaceID(ctx context.Context, faceID string) (uuid.UUID, error)
}
