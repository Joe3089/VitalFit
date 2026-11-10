package branchrepository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	branchdomain "github.com/vitalfit/api/internal/modules/branches/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/db"
	"gorm.io/gorm"
)

type LocationsStore struct {
	db *gorm.DB
}

func NewLocationsStore(db *gorm.DB) *LocationsStore {
	return &LocationsStore{db: db}
}

func (s *LocationsStore) findCountryByName(ctx context.Context, Tx *gorm.DB, name string) (*branchdomain.Countries, error) {
	var country branchdomain.Countries

	err := Tx.WithContext(ctx).Where("name = ?", name).First(&country).Error
	if err != nil {
		return nil, err
	}
	return &country, nil
}

func (s *LocationsStore) findStateByName(ctx context.Context, Tx *gorm.DB, name string, countryID uuid.UUID) (*branchdomain.States, error) {
	var state branchdomain.States
	err := Tx.WithContext(ctx).Where("name = ? AND country_id = ?", name, countryID).First(&state).Error
	if err != nil {
		return nil, err
	}
	return &state, nil
}

func (s *LocationsStore) createCountry(ctx context.Context, tx *gorm.DB, country *branchdomain.Countries) (*branchdomain.Countries, error) {
	err := tx.WithContext(ctx).Create(country).Error
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, shared_errors.ErrConflict
		}
		return nil, err
	}
	return country, nil
}

func (s *LocationsStore) createState(ctx context.Context, tx *gorm.DB, state *branchdomain.States) (*branchdomain.States, error) {
	err := tx.WithContext(ctx).Create(state).Error
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, shared_errors.ErrConflict
		}
		return nil, err
	}
	return state, nil
}
func (s *LocationsStore) FindOrCreateStateByCountry(ctx context.Context, stateName string, countryName string) (*branchdomain.States, error) {

	var country *branchdomain.Countries
	var state *branchdomain.States

	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()
	//transaction
	err := db.WithTX(s.db, func(tx *gorm.DB) error {
		var err error
		country, err = s.findCountryByName(ctx, tx, countryName)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				newCountry := &branchdomain.Countries{
					Name: countryName,
				}
				country, err = s.createCountry(ctx, tx, newCountry)
				if err != nil {
					return err //rollback
				}
			} else {
				return err // rollback
			}
		}
		state, err = s.findStateByName(ctx, tx, stateName, country.CountryID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				newState := &branchdomain.States{
					Name:      stateName,
					CountryID: country.CountryID,
				}
				state, err = s.createState(ctx, tx, newState)
				if err != nil {
					return err //rollback
				}
			} else {
				return err //rollback
			}
		}
		return nil //commit
	})

	if err != nil {
		return nil, err
	}
	return state, nil
}
