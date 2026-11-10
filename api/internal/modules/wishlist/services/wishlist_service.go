package wishlistservice

import (
	"context"

	"github.com/google/uuid"
	wishlistdomain "github.com/vitalfit/api/internal/modules/wishlist/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/pkg/pagination"
)

type WishlistService struct {
	store store.Storage
}

func NewWishlistService(store store.Storage) *WishlistService {
	return &WishlistService{store: store}
}

func (s *WishlistService) AddToWishlist(ctx context.Context, userID, serviceID uuid.UUID) (uuid.UUID, error) {
	// Verify service exists
	_, err := s.store.Products.GetServiceByID(ctx, serviceID)
	if err != nil {
		return uuid.Nil, err
	}

	// Check if already in wishlist
	exists, err := s.store.Wishlist.WishlistExists(ctx, userID, serviceID)
	if err != nil {
		return uuid.Nil, err
	}

	if exists {
		return uuid.Nil, shared_errors.ErrConflict
	}

	wishlist := &wishlistdomain.Wishlist{
		UserID:    userID,
		ServiceID: serviceID,
	}

	return s.store.Wishlist.AddToWishlist(ctx, wishlist)
}

func (s *WishlistService) RemoveFromWishlist(ctx context.Context, wishlistID uuid.UUID) error {
	return s.store.Wishlist.RemoveFromWishlist(ctx, wishlistID)
}

func (s *WishlistService) GetUserWishlist(ctx context.Context, userID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*wishlistdomain.WishlistWithService, int64, error) {
	return s.store.Wishlist.GetUserWishlist(ctx, userID, fq)
}
