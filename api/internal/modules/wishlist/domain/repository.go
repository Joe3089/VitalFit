package wishlistdomain

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/pkg/pagination"
)

type WishlistRepository interface {
	// AddToWishlist adds a service to the user's wishlist
	AddToWishlist(ctx context.Context, wishlist *Wishlist) (uuid.UUID, error)

	// RemoveFromWishlist removes a service from the user's wishlist
	RemoveFromWishlist(ctx context.Context, wishlistID uuid.UUID) error

	// GetUserWishlist retrieves all wishlist items for a user with service details
	GetUserWishlist(ctx context.Context, userID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*WishlistWithService, int64, error)

	// WishlistExists checks if a user already has a service in their wishlist
	WishlistExists(ctx context.Context, userID, serviceID uuid.UUID) (bool, error)
}
