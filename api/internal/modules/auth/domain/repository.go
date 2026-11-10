package authdomain

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
)

type UserRepository interface {
	Create(ctx context.Context, tx *gorm.DB, user *Users) error
	GetByID(ctx context.Context, userID uuid.UUID) (*Users, error)
	CreateAndInvitate(ctx context.Context, user *Users, token string, invitationExp time.Duration) error
	Delete(ctx context.Context, userID uuid.UUID) error
	Activate(ctx context.Context, code string) error
	ActivateUserStaff(ctx context.Context, token string, password string) error
	GetByEmail(ctx context.Context, email string) (*Users, error)
	Update(ctx context.Context, user *Users) error
	CreatePasswordResetToken(ctx context.Context, userID uuid.UUID, key string, tokenExp time.Duration) error
	DeleteResetToken(ctx context.Context, userID uuid.UUID) error
	ResetUserPassword(ctx context.Context, key string, user *Users) error
	ValidateResetToken(ctx context.Context, key string) error
	GetBranchAdmins(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*Users, error)
	GetUsers(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*Users, error)
	GetClients(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*Users, int64, error)
	UpdateUserClient(ctx context.Context, user *Users) error
	UpdateUserStaff(ctx context.Context, user *Users) error
	SoftDelete(ctx context.Context, userID uuid.UUID) error
	UpdateClientStatus(ctx context.Context, userID uuid.UUID, status UserStatusEnum) error
	UpdateClientCategory(ctx context.Context, userID uuid.UUID, category ClientCategoryEnum) error
	GetAllClients(ctx context.Context) ([]*Users, error)
	UpgradePassword(ctx context.Context, user *Users) error
	UpdateActivationCode(ctx context.Context, userID uuid.UUID, token string, invitationExp time.Duration) error
	BlockUser(ctx context.Context, userID uuid.UUID, justification string) error
	UnblockUser(ctx context.Context, userID uuid.UUID) error
	GetAllStaffUsers(ctx context.Context) ([]*Users, error)
}

type RolesRepository interface {
	GetByName(ctx context.Context, name string) (*Roles, error)
	GetRoleByID(ctx context.Context, roleID uuid.UUID) (*Roles, error)
	GetRoles(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*Roles, error)
	GetRolesFTotal(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error)
	Create(ctx context.Context, role *Roles) error
	Update(ctx context.Context, role *Roles) error
	Delete(ctx context.Context, roleID uuid.UUID) error

	GetPermissions(ctx context.Context) ([]*Permission, error)
	AssignRolePermission(ctx context.Context, roleID uuid.UUID, permissionID []uuid.UUID) error
	DeleteRolePermission(ctx context.Context, roleID uuid.UUID, permissionID []uuid.UUID) error
	RoleHasPermission(ctx context.Context, roleID uuid.UUID, permission string) (bool, error)
	CreatePermission(ctx context.Context, tx *gorm.DB, permission *Permission) error
	GetPermissionByName(ctx context.Context, name string) (*Permission, error)
}

type SessionRepository interface {
	Create(ctx context.Context, session *Session) error
	GetByRefreshToken(ctx context.Context, refreshToken string) (*Session, error)
	GetByID(ctx context.Context, sessionID uuid.UUID) (*Session, error)
	GetUserSessions(ctx context.Context, userID uuid.UUID) ([]*Session, error)
	RotateSession(ctx context.Context, sessionID uuid.UUID, oldToken, newToken string, newExpiry time.Time) error
	Revoke(ctx context.Context, sessionID uuid.UUID) error
	RevokeAllForUser(ctx context.Context, userID uuid.UUID) error
}
