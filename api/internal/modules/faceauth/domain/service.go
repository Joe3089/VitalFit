package faceauthdomain

import (
	"context"

	"github.com/google/uuid"
)

type FacAuthServiceInterface interface {
	EnrollFace(ctx context.Context, userID uuid.UUID, imageBytes []byte) error
	AuthenticateUser(ctx context.Context, imageBytes []byte) (uuid.UUID, error)
}
