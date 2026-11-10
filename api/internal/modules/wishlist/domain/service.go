package wishlistdomain

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/pkg/pagination"
)

type WishlistService interface {
	// AddToWishlist adds a service to the user's wishlist
	AddToWishlist(ctx context.Context, userID, serviceID uuid.UUID) (uuid.UUID, error)

	// RemoveFromWishlist removes a service from the user's wishlist
	RemoveFromWishlist(ctx context.Context, wishlistID uuid.UUID) error

	// GetUserWishlist retrieves all wishlist items for a user
	GetUserWishlist(ctx context.Context, userID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*WishlistWithService, int64, error)
}
