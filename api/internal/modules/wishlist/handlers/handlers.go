package wishlisthandlers

import (
	appservices "github.com/vitalfit/api/internal/app/services"
)

type WishlistHandlers struct {
	services appservices.Services
}

func NewWishlistHandlers(services appservices.Services) *WishlistHandlers {
	return &WishlistHandlers{
		services: services,
	}
}
