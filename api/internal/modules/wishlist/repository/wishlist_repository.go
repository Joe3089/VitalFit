package wishlistrepository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	wishlistdomain "github.com/vitalfit/api/internal/modules/wishlist/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
)

type WishlistStore struct {
	db *gorm.DB
}

func NewWishlistStore(db *gorm.DB) *WishlistStore {
	return &WishlistStore{db: db}
}

func (s *WishlistStore) AddToWishlist(ctx context.Context, wishlist *wishlistdomain.Wishlist) (uuid.UUID, error) {
	if err := s.db.WithContext(ctx).Create(wishlist).Error; err != nil {
		// Check for unique constraint violation
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return uuid.Nil, shared_errors.ErrConflict
		}
		return uuid.Nil, err
	}

	return wishlist.WishlistID, nil
}

func (s *WishlistStore) RemoveFromWishlist(ctx context.Context, wishlistID uuid.UUID) error {
	result := s.db.WithContext(ctx).
		Where("wishlist_id = ?", wishlistID).
		Delete(&wishlistdomain.Wishlist{})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return shared_errors.ErrNotFound
	}

	return nil
}

func (s *WishlistStore) GetUserWishlist(ctx context.Context, userID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]*wishlistdomain.WishlistWithService, int64, error) {
	var wishlist []*wishlistdomain.WishlistWithService
	var total int64

	query := s.db.WithContext(ctx).
		Table("wishlist").
		Joins("JOIN services ON wishlist.service_id = services.service_id").
		Where("wishlist.user_id = ?", userID)

	if fq.Search != "" {
		query = query.Where("services.name ILIKE ?", "%"+fq.Search+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Select("wishlist.wishlist_id, wishlist.user_id, wishlist.service_id, services.name as service_name, services.description, wishlist.created_at").
		Limit(fq.Limit).
		Offset((fq.Page - 1) * fq.Limit).
		Order("wishlist.created_at " + fq.Sort).
		Scan(&wishlist).Error

	if err != nil {
		return nil, 0, err
	}

	return wishlist, total, nil
}

func (s *WishlistStore) WishlistExists(ctx context.Context, userID, serviceID uuid.UUID) (bool, error) {
	var count int64

	err := s.db.WithContext(ctx).
		Model(&wishlistdomain.Wishlist{}).
		Where("user_id = ? AND service_id = ?", userID, serviceID).
		Count(&count).Error

	if err != nil {
		return false, err
	}

	return count > 0, nil
}
