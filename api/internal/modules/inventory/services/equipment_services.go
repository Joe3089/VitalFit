package inventoryservices

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/config"
	inventorydomain "github.com/vitalfit/api/internal/modules/inventory/domain"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/pkg/pagination"
)

type EquipmentServices struct {
	store  store.Storage
	config config.Config
}

func NewEquipmentServices(store store.Storage, cfg config.Config) *EquipmentServices {
	return &EquipmentServices{
		store:  store,
		config: cfg,
	}
}

func (s *EquipmentServices) CreateEquipment(ctx context.Context, equipment *inventorydomain.Equipment) error {
	_, err := s.store.Equipment.Create(ctx, equipment)
	if err != nil {
		return err
	}
	return nil
}

func (s *EquipmentServices) GetEquipments(ctx context.Context, fq pagination.PaginatedFeedQuery) (*inventorydomain.EquipmentQueryResults, error) {
	equipments, err := s.store.Equipment.GetAll(ctx, fq)
	if err != nil {
		return nil, err
	}
	return equipments, nil
}

func (s *EquipmentServices) GetTotalCount(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error) {
	count, err := s.store.Equipment.GetTotalCount(ctx, fq)
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (s *EquipmentServices) GetEquipmentByID(ctx context.Context, equipmentID uuid.UUID) (*inventorydomain.Equipment, error) {
	equipment, err := s.store.Equipment.GetByID(ctx, equipmentID)
	if err != nil {
		return nil, err
	}
	return equipment, nil
}

func (s *EquipmentServices) UpdateEquipment(ctx context.Context, equipment *inventorydomain.Equipment) error {
	err := s.store.Equipment.Update(ctx, equipment)
	if err != nil {
		return err
	}
	return nil
}

func (s *EquipmentServices) DeleteEquipment(ctx context.Context, equipmentID uuid.UUID) error {
	err := s.store.Equipment.Delete(ctx, equipmentID)
	if err != nil {
		return err
	}
	return nil
}
