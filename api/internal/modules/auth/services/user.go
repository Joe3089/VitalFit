package authservices

import (
	"context"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/pkg/pagination"
)

type UserService struct {
	store store.Storage
}

func NewUserService(store store.Storage) *UserService {
	return &UserService{
		store: store,
	}
}

func (h *UserService) GetByEmail(ctx context.Context, email string) (*authdomain.Users, error) {
	users, err := h.store.Users.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (h *UserService) GetByID(ctx context.Context, userID uuid.UUID) (*authdomain.Users, error) {
	users, err := h.store.Users.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (h *UserService) Update(ctx context.Context, user *authdomain.Users) error {
	if err := h.store.Users.Update(ctx, user); err != nil {
		return err
	}
	return nil
}

func (h *UserService) GetUserFromContext(c *gin.Context) *authdomain.Users {
	user, ok := c.Value("user").(*authdomain.Users)
	if !ok {
		return nil
	}
	return user
}

func (h *UserService) GetRoleByName(ctx context.Context, name string) (*authdomain.Roles, error) {
	role, err := h.store.Roles.GetByName(ctx, name)
	if err != nil {
		return nil, err
	}
	return role, nil
}

func (h *UserService) GetBranchAdmins(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*authdomain.Users, error) {
	users, err := h.store.Users.GetBranchAdmins(ctx, fq)
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (h *UserService) GetUsers(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*authdomain.Users, error) {
	users, err := h.store.Users.GetUsers(ctx, fq)
	if err != nil {
		return nil, err
	}
	return users, nil
}
func (h *UserService) GetClients(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*authdomain.Users, int64, error) {
	users, total, err := h.store.Users.GetClients(ctx, fq)
	if err != nil {
		return nil, 0, err
	}
	return users, total, nil
}

func (h *UserService) Delete(ctx context.Context, userID uuid.UUID) error {
	if err := h.store.Users.SoftDelete(ctx, userID); err != nil {
		return err
	}
	return nil
}

//roles

func (h *UserService) RoleHasPermission(ctx context.Context, roleID uuid.UUID, permission string) (bool, error) {
	return h.store.Roles.RoleHasPermission(ctx, roleID, permission)
}

func (h *UserService) GetRoles(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*authdomain.Roles, error) {
	return h.store.Roles.GetRoles(ctx, fq)
}

func (h *UserService) CreateRole(ctx context.Context, role *authdomain.Roles) error {
	return h.store.Roles.Create(ctx, role)
}

func (h *UserService) GetRoleByID(ctx context.Context, roleID uuid.UUID) (*authdomain.Roles, error) {
	return h.store.Roles.GetRoleByID(ctx, roleID)
}
func (h *UserService) UpdateRole(ctx context.Context, role *authdomain.Roles) error {
	return h.store.Roles.Update(ctx, role)
}

func (h *UserService) DeleteRole(ctx context.Context, roleID uuid.UUID) error {
	return h.store.Roles.Delete(ctx, roleID)
}
func (h *UserService) GetPermissions(ctx context.Context) ([]*authdomain.Permission, error) {
	return h.store.Roles.GetPermissions(ctx)
}

func (h *UserService) AssignRolePermission(ctx context.Context, roleID uuid.UUID, permissionIDs []uuid.UUID) error {
	return h.store.Roles.AssignRolePermission(ctx, roleID, permissionIDs)
}

func (g *UserService) DeleteRolePermission(ctx context.Context, roleID uuid.UUID, permissionID []uuid.UUID) error {
	return g.store.Roles.DeleteRolePermission(ctx, roleID, permissionID)
}

func (h *UserService) UpdateClient(ctx context.Context, user *authdomain.Users) error {
	return h.store.Users.UpdateUserClient(ctx, user)
}

func (h *UserService) UpdateStaff(ctx context.Context, user *authdomain.Users, roleName string) error {
	role, err := h.store.Roles.GetByName(ctx, roleName)
	if err != nil {
		return err
	}
	user.RoleID = role.RoleID
	return h.store.Users.UpdateUserStaff(ctx, user)
}

func (h *UserService) GetRolesFTotal(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error) {
	return h.store.Roles.GetRolesFTotal(ctx, fq)
}

func (h *UserService) BlockUser(ctx context.Context, userID uuid.UUID, justification string) error {
	return h.store.Users.BlockUser(ctx, userID, justification)
}

func (h *UserService) UnblockUser(ctx context.Context, userID uuid.UUID) error {
	return h.store.Users.UnblockUser(ctx, userID)
}

func (h *UserService) GetAllClients(ctx context.Context) ([]*authdomain.Users, error) {
	return h.store.Users.GetAllClients(ctx)
}

func (h *UserService) GetAllStaffUsers(ctx context.Context) ([]*authdomain.Users, error) {
	return h.store.Users.GetAllStaffUsers(ctx)
}
