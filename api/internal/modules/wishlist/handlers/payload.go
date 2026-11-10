package wishlisthandlers

import (
	"time"

	"github.com/google/uuid"
)

// ----------------------------------------
// REQUEST PAYLOADS
// ----------------------------------------

type AddToWishlistRequest struct {
	ServiceID uuid.UUID `json:"service_id" binding:"required"`
}

// ----------------------------------------
// RESPONSE PAYLOADS
// ----------------------------------------

type WishlistItemResponse struct {
	WishlistID  uuid.UUID `json:"wishlist_id"`
	ServiceID   uuid.UUID `json:"service_id"`
	ServiceName string    `json:"service_name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

type AddToWishlistResponse struct {
	WishlistID uuid.UUID `json:"wishlist_id"`
	Message    string    `json:"message"`
}

type RemoveFromWishlistResponse struct {
	Message string `json:"message"`
}
