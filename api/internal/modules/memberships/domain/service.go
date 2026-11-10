package membershipsdomain

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/pkg/pagination"
)

type MembershipsServiceInterface interface {
	CreateMembershipType(ctx context.Context, membership *MembershipType) error
	UpdateMembershipType(ctx context.Context, membership *MembershipType) error
	DeleteMembershipType(ctx context.Context, id uuid.UUID) error
	GetMembershipTypeByID(ctx context.Context, id uuid.UUID) (*MembershipType, error)
	GetMembershipTypes(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*MembershipType, error)
	GetMembershipTypesFTotal(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error)
	GetSummary(ctx context.Context) (*MembershipSummary, error)

	UpdateClientMembership(ctx context.Context, membership *ClientMembership) error
	UpdateClientMembershipStatus(ctx context.Context, membership *ClientMembership) error
	GetClientMembership(ctx context.Context, clientID uuid.UUID) (*ClientMembership, error)
	GetClientsMemberships(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*ClientMembership, int64, error)
	GetClientMembershipByID(ctx context.Context, clientMembershipID uuid.UUID) (*ClientMembership, error)

	CreateCancellationReason(ctx context.Context, reason *CancellationReason) error
	UpdateCancellationReason(ctx context.Context, reason *CancellationReason) error
	DeleteCancellationReason(ctx context.Context, id uuid.UUID) error
	GetCancellationReasonByID(ctx context.Context, id uuid.UUID) (*CancellationReason, error)
	GetCancellationReasons(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*CancellationReason, int64, error)
	UpdateExpiredMemberships(ctx context.Context) error
	GetExpiringMemberships(ctx context.Context, days int) ([]MembershipExpiringDetail, error)
}
