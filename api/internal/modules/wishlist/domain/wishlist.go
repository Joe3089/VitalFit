package wishlistdomain

import (
	"time"

	"github.com/google/uuid"
)

type Wishlist struct {
	WishlistID uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"wishlist_id"`
	UserID     uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	ServiceID  uuid.UUID `gorm:"type:uuid;not null" json:"service_id"`
	CreatedAt  time.Time `gorm:"type:timestamptz;not null;default:now()" json:"created_at"`
}

type WishlistWithService struct {
	WishlistID  uuid.UUID `json:"wishlist_id"`
	UserID      uuid.UUID `json:"user_id"`
	ServiceID   uuid.UUID `json:"service_id"`
	ServiceName string    `json:"service_name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}
