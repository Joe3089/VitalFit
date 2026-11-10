package authmocks

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
)

type UserStoreMock struct {
	mock.Mock
}

type RoleStoreMock struct {
	mock.Mock
}

type SessionStoreMock struct {
	mock.Mock
}

func NewMockSessionStore() *SessionStoreMock {
	return &SessionStoreMock{}
}

func NewMockUserStore() *UserStoreMock {
	return &UserStoreMock{}
}

func NewMockRoleStore() *RoleStoreMock {
	return &RoleStoreMock{}
}

//USER MOCK FUNCTIONS

func (m *UserStoreMock) Create(ctx context.Context, tx *gorm.DB, user *authdomain.Users) error {
	args := m.Called(ctx, tx, user)
	return args.Error(0)
}

func (m *UserStoreMock) GetByID(ctx context.Context, userID uuid.UUID) (*authdomain.Users, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*authdomain.Users), args.Error(1)
}

func (m *UserStoreMock) CreateAndInvitate(ctx context.Context, user *authdomain.Users, token string, invitationExp time.Duration) error {
	args := m.Called(ctx, user, token, invitationExp)
	return args.Error(0)
}

func (m *UserStoreMock) Delete(ctx context.Context, userID uuid.UUID) error {
	args := m.Called(ctx, userID)
	return args.Error(0)
}
func (m *UserStoreMock) SoftDelete(ctx context.Context, userID uuid.UUID) error {
	args := m.Called(ctx, userID)
	return args.Error(0)
}

func (m *UserStoreMock) Activate(ctx context.Context, code string) error {
	args := m.Called(ctx, code)
	return args.Error(0)
}
func (m *UserStoreMock) ActivateUserStaff(ctx context.Context, token string, password string) error {
	args := m.Called(ctx, token, password)
	return args.Error(0)
}

func (m *UserStoreMock) GetByEmail(ctx context.Context, email string) (*authdomain.Users, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*authdomain.Users), args.Error(1)
}

func (m *UserStoreMock) Update(ctx context.Context, user *authdomain.Users) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *UserStoreMock) CreatePasswordResetToken(ctx context.Context, userID uuid.UUID, key string, tokenExp time.Duration) error {
	args := m.Called(ctx, userID, key, tokenExp)
	return args.Error(0)
}

func (m *UserStoreMock) DeleteResetToken(ctx context.Context, userID uuid.UUID) error {
	args := m.Called(ctx, userID)
	return args.Error(0)
}

func (m *UserStoreMock) ResetUserPassword(ctx context.Context, key string, user *authdomain.Users) error {
	args := m.Called(ctx, key, user)
	return args.Error(0)
}

func (m *UserStoreMock) GetBranchAdmins(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*authdomain.Users, error) {
	args := m.Called(ctx, fq)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*authdomain.Users), args.Error(1)
}

func (m *UserStoreMock) GetUsers(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*authdomain.Users, error) {
	args := m.Called(ctx, fq)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*authdomain.Users), args.Error(1)
}

func (m *UserStoreMock) GetClients(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*authdomain.Users, int64, error) {
	args := m.Called(ctx, fq)
	if args.Get(0) == nil {
		return nil, int64(args.Int(1)), args.Error(2)
	}
	return args.Get(0).([]*authdomain.Users), int64(args.Int(1)), args.Error(2)
}

func (m *UserStoreMock) UpdateUserStaff(ctx context.Context, user *authdomain.Users) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *UserStoreMock) UpdateUserClient(ctx context.Context, user *authdomain.Users) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *UserStoreMock) ValidateResetToken(ctx context.Context, key string) error {
	args := m.Called(ctx, key)
	return args.Error(0)
}

func (m *UserStoreMock) UpdateClientStatus(ctx context.Context, userID uuid.UUID, status authdomain.UserStatusEnum) error {
	args := m.Called(ctx, userID, status)
	return args.Error(0)
}

func (m *UserStoreMock) UpdateClientCategory(ctx context.Context, userID uuid.UUID, category authdomain.ClientCategoryEnum) error {
	args := m.Called(ctx, userID, category)
	return args.Error(0)
}
func (m *UserStoreMock) GetAllClients(ctx context.Context) ([]*authdomain.Users, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*authdomain.Users), args.Error(1)
}

func (m *UserStoreMock) GetAllStaffUsers(ctx context.Context) ([]*authdomain.Users, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*authdomain.Users), args.Error(1)
}

func (m *UserStoreMock) UpgradePassword(ctx context.Context, user *authdomain.Users) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}
func (m *UserStoreMock) UpdateActivationCode(ctx context.Context, userID uuid.UUID, token string, invitationExp time.Duration) error {
	args := m.Called(ctx, userID, token, invitationExp)
	return args.Error(0)
}

func (m *UserStoreMock) BlockUser(ctx context.Context, userID uuid.UUID, justification string) error {
	args := m.Called(ctx, userID, justification)
	return args.Error(0)
}

func (m *UserStoreMock) UnblockUser(ctx context.Context, userID uuid.UUID) error {
	args := m.Called(ctx, userID)
	return args.Error(0)
}

// ROLE MOCK FUNCTIONS
func (m *RoleStoreMock) GetByName(ctx context.Context, name string) (*authdomain.Roles, error) {
	args := m.Called(ctx, name)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*authdomain.Roles), args.Error(1)
}

func (m *RoleStoreMock) GetRoleByID(ctx context.Context, roleID uuid.UUID) (*authdomain.Roles, error) {
	args := m.Called(ctx, roleID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*authdomain.Roles), args.Error(1)
}

func (m *RoleStoreMock) GetRoles(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*authdomain.Roles, error) {
	args := m.Called(ctx, fq)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*authdomain.Roles), args.Error(1)
}

func (m *RoleStoreMock) GetRolesFTotal(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error) {
	args := m.Called(ctx, fq)
	return int64(args.Int(0)), args.Error(1)
}

func (m *RoleStoreMock) Create(ctx context.Context, role *authdomain.Roles) error {
	args := m.Called(ctx, role)
	return args.Error(0)
}

func (m *RoleStoreMock) Update(ctx context.Context, role *authdomain.Roles) error {
	args := m.Called(ctx, role)
	return args.Error(0)
}

func (m *RoleStoreMock) Delete(ctx context.Context, roleID uuid.UUID) error {
	args := m.Called(ctx, roleID)
	return args.Error(0)
}

func (m *RoleStoreMock) GetPermissions(ctx context.Context) ([]*authdomain.Permission, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*authdomain.Permission), args.Error(1)
}

func (m *RoleStoreMock) AssignRolePermission(ctx context.Context, roleID uuid.UUID, permissionID []uuid.UUID) error {
	args := m.Called(ctx, roleID, permissionID)
	return args.Error(0)
}

func (m *RoleStoreMock) DeleteRolePermission(ctx context.Context, roleID uuid.UUID, permissionID []uuid.UUID) error {
	args := m.Called(ctx, roleID, permissionID)
	return args.Error(0)
}

func (m *RoleStoreMock) RoleHasPermission(ctx context.Context, roleID uuid.UUID, permission string) (bool, error) {
	args := m.Called(ctx, roleID, permission)
	return args.Bool(0), args.Error(1)
}

func (m *RoleStoreMock) CreatePermission(ctx context.Context, tx *gorm.DB, permission *authdomain.Permission) error {
	args := m.Called(ctx, tx, permission)
	return args.Error(0)
}
func (m *RoleStoreMock) GetPermissionByName(ctx context.Context, name string) (*authdomain.Permission, error) {
	args := m.Called(ctx, name)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*authdomain.Permission), args.Error(1)
}

//session mocks

func (m *SessionStoreMock) Create(ctx context.Context, session *authdomain.Session) error {
	args := m.Called(ctx, session)
	return args.Error(0)
}

func (m *SessionStoreMock) GetByRefreshToken(ctx context.Context, refreshToken string) (*authdomain.Session, error) {
	args := m.Called(ctx, refreshToken)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*authdomain.Session), args.Error(1)
}

func (m *SessionStoreMock) GetByID(ctx context.Context, sessionID uuid.UUID) (*authdomain.Session, error) {
	args := m.Called(ctx, sessionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*authdomain.Session), args.Error(1)
}

func (m *SessionStoreMock) GetUserSessions(ctx context.Context, userID uuid.UUID) ([]*authdomain.Session, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*authdomain.Session), args.Error(1)
}

func (m *SessionStoreMock) RotateSession(ctx context.Context, sessionID uuid.UUID, oldToken, newToken string, newExpiry time.Time) error {
	args := m.Called(ctx, sessionID, oldToken, newToken, newExpiry)
	return args.Error(0)
}

func (m *SessionStoreMock) Revoke(ctx context.Context, sessionID uuid.UUID) error {
	args := m.Called(ctx, sessionID)
	return args.Error(0)
}

func (m *SessionStoreMock) RevokeAllForUser(ctx context.Context, userID uuid.UUID) error {
	args := m.Called(ctx, userID)
	return args.Error(0)
}
