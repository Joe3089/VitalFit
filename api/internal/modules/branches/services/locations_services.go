package branchservices

import (
	"context"

	branchdomain "github.com/vitalfit/api/internal/modules/branches/domain"
	"github.com/vitalfit/api/internal/store"
)

type LocationsServices struct {
	store store.Storage
}

func NewLocationsServices(store store.Storage) *LocationsServices {
	return &LocationsServices{
		store: store,
	}
}

func (s *LocationsServices) FindOrCreateStateByCountry(ctx context.Context, stateName string, countryName string) (*branchdomain.States, error) {
	state, err := s.store.Locations.FindOrCreateStateByCountry(ctx, stateName, countryName)
	if err != nil {
		return nil, err
	}
	return state, nil
}
