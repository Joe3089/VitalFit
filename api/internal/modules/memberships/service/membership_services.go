package membershipsservice

import (
	"context"

	"github.com/google/uuid"
	membershipsdomain "github.com/vitalfit/api/internal/modules/memberships/domain"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/pkg/pagination"
)

// MembershipService implementa la lógica de negocio para los tipos de membresía.
type MembershipService struct {
	store store.Storage
}

// NewMembershipService crea una nueva instancia del servicio de membresías.
func NewMembershipService(store store.Storage) *MembershipService {
	return &MembershipService{
		store: store,
	}
}

// CreateMembershipType crea un nuevo tipo de membresía.
func (s *MembershipService) CreateMembershipType(ctx context.Context, membership *membershipsdomain.MembershipType) error {
	err := s.store.Membership.CreateMembershipType(ctx, membership)
	if err != nil {
		return err
	}
	return nil
}

// UpdateMembershipType actualiza un tipo de membresía existente.
func (s *MembershipService) UpdateMembershipType(ctx context.Context, membership *membershipsdomain.MembershipType) error {
	err := s.store.Membership.UpdateMembershipType(ctx, membership)
	if err != nil {
		return err
	}
	return nil
}

// DeleteMembershipType realiza una eliminación lógica (soft delete) del tipo de membresía.
func (s *MembershipService) DeleteMembershipType(ctx context.Context, id uuid.UUID) error {
	err := s.store.Membership.DeleteMembershipType(ctx, id)
	if err != nil {
		return err
	}
	return nil
}

// GetMembershipTypeByID obtiene un tipo de membresía por su ID.
func (s *MembershipService) GetMembershipTypeByID(ctx context.Context, id uuid.UUID) (*membershipsdomain.MembershipType, error) {
	membership, err := s.store.Membership.GetMembershipTypeByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return membership, nil
}

// GetMembershipTypes devuelve todos los tipos de membresía activos.
func (s *MembershipService) GetMembershipTypes(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*membershipsdomain.MembershipType, error) {
	memberships, err := s.store.Membership.GetMembershipTypes(ctx, fq)
	if err != nil {
		return nil, err
	}
	return memberships, nil
}

func (s *MembershipService) GetMembershipTypesFTotal(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error) {
	total, err := s.store.Membership.GetMembershipTypesFTotal(ctx, fq)
	if err != nil {
		return 0, err
	}
	return total, nil
}

func (s *MembershipService) GetSummary(ctx context.Context) (*membershipsdomain.MembershipSummary, error) {
	summary, err := s.store.Membership.GetSummary(ctx)
	if err != nil {
		return nil, err
	}
	return summary, nil
}

func (s *MembershipService) UpdateClientMembership(ctx context.Context, membership *membershipsdomain.ClientMembership) error {
	return s.store.Membership.UpdateClientMembership(ctx, membership)
}

func (s *MembershipService) UpdateClientMembershipStatus(ctx context.Context, membership *membershipsdomain.ClientMembership) error {
	return s.store.Membership.UpdateClientMembershipStatus(ctx, membership)
}

func (s *MembershipService) GetClientMembership(ctx context.Context, clientID uuid.UUID) (*membershipsdomain.ClientMembership, error) {
	return s.store.Membership.GetClientMembership(ctx, clientID)
}

func (s *MembershipService) GetClientMembershipByID(ctx context.Context, clientMembershipID uuid.UUID) (*membershipsdomain.ClientMembership, error) {
	return s.store.Membership.GetClientMembershipByID(ctx, clientMembershipID)
}

func (s *MembershipService) GetClientsMemberships(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*membershipsdomain.ClientMembership, int64, error) {
	return s.store.Membership.GetClientsMemberships(ctx, fq)
}

// Cancellation Reasons operations

func (s *MembershipService) CreateCancellationReason(ctx context.Context, reason *membershipsdomain.CancellationReason) error {
	// Check if description already exists
	existing, err := s.store.Membership.GetCancellationReasonByDescription(ctx, reason.Description)
	if err == nil && existing != nil {
		return err
	}

	return s.store.Membership.CreateCancellationReason(ctx, reason)
}

func (s *MembershipService) UpdateCancellationReason(ctx context.Context, reason *membershipsdomain.CancellationReason) error {
	return s.store.Membership.UpdateCancellationReason(ctx, reason)
}

func (s *MembershipService) DeleteCancellationReason(ctx context.Context, id uuid.UUID) error {
	return s.store.Membership.DeleteCancellationReason(ctx, id)
}

func (s *MembershipService) GetCancellationReasonByID(ctx context.Context, id uuid.UUID) (*membershipsdomain.CancellationReason, error) {
	return s.store.Membership.GetCancellationReasonByID(ctx, id)
}

func (s *MembershipService) GetCancellationReasons(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*membershipsdomain.CancellationReason, int64, error) {
	return s.store.Membership.GetCancellationReasons(ctx, fq)
}

func (s *MembershipService) UpdateExpiredMemberships(ctx context.Context) error {
	return s.store.Membership.UpdateExpiredMemberships(ctx)
}

func (s *MembershipService) GetExpiringMemberships(ctx context.Context, days int) ([]membershipsdomain.MembershipExpiringDetail, error) {
	return s.store.Membership.GetExpiringMemberships(ctx, days)
}
