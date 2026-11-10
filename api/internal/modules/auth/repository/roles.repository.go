package authrepository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5/pgconn"

	"github.com/google/uuid"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/db"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type RoleStore struct {
	db *gorm.DB
}

func NewRoleStore(db *gorm.DB) *RoleStore {
	return &RoleStore{db: db}
}

func (s *RoleStore) GetByName(ctx context.Context, name string) (*authdomain.Roles, error) {
	var role authdomain.Roles

	err := s.db.WithContext(ctx).
		Preload("Permissions").
		Where("name = ?", name).
		First(&role).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}

	return &role, nil
}

func (s *RoleStore) GetRoleByID(ctx context.Context, roleID uuid.UUID) (*authdomain.Roles, error) {
	var role authdomain.Roles
	err := s.db.WithContext(ctx).
		Preload("Permissions").
		Where("role_id = ?", roleID).
		First(&role).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}
	return &role, nil
}

func (s *RoleStore) GetRoles(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*authdomain.Roles, error) {
	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()

	var roles []*authdomain.Roles

	query := s.db.WithContext(ctx)

	if fq.Search != "" {
		searchQuery := "%" + fq.Search + "%"
		query = query.Where("name ILIKE ?", searchQuery)
	}
	err := query.Limit(fq.Limit).
		Offset(fq.Page*fq.Limit - fq.Limit).
		Order("created_at " + fq.Sort).
		Find(&roles).Error

	if err != nil {
		return nil, err
	}

	return roles, nil
}

func (s *RoleStore) Create(ctx context.Context, role *authdomain.Roles) error {
	err := s.db.WithContext(ctx).Select(
		"Name", "Description", "Permissions",
	).Create(role).Error

	if err != nil {
		return err
	}
	return nil
}

func (s *RoleStore) GetRolesFTotal(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error) {
	var count int64
	query := s.db.WithContext(ctx).Model(&authdomain.Roles{})

	if fq.Search != "" {
		searchQuery := "%" + fq.Search + "%"
		query = query.Where("name ILIKE ?", searchQuery)
	}
	err := query.Count(&count).Error

	if err != nil {
		return 0, err
	}
	return count, err
}

func (s *RoleStore) Update(ctx context.Context, role *authdomain.Roles) error {
	err := s.db.WithContext(ctx).Model(&role).Select(
		"Name", "Description",
	).Updates(role).Error

	if err != nil {
		return err
	}
	return nil
}

func (s *RoleStore) Delete(ctx context.Context, roleID uuid.UUID) error {
	err := s.db.WithContext(ctx).Delete(&authdomain.Roles{}, roleID).Error
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return shared_errors.ErrNotFound
		default:
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23503" {
				return shared_errors.ErrConflict
			}
			return err
		}
	}
	return nil
}

func (s *RoleStore) GetPermissions(ctx context.Context) ([]*authdomain.Permission, error) {
	var permissions []*authdomain.Permission
	err := s.db.WithContext(ctx).Find(&permissions).Error
	if err != nil {
		return nil, err
	}
	return permissions, nil
}

func (s *RoleStore) AssignRolePermission(ctx context.Context, roleID uuid.UUID, permissionIDs []uuid.UUID) error {

	var linksToCreate []authdomain.RolePermission
	for _, pid := range permissionIDs {
		linksToCreate = append(linksToCreate, authdomain.RolePermission{
			RoleID:       roleID,
			PermissionID: pid,
		})
	}

	if len(linksToCreate) == 0 {
		return nil
	}

	err := db.WithTX(s.db, func(tx *gorm.DB) error {
		if err := tx.WithContext(ctx).
			Clauses(clause.OnConflict{DoNothing: true}).
			Create(&linksToCreate).Error; err != nil {
			return err
		}
		return nil
	})

	return err
}

func (s *RoleStore) DeleteRolePermission(ctx context.Context, roleID uuid.UUID, permissionID []uuid.UUID) error {
	if len(permissionID) == 0 {
		return nil
	}

	err := db.WithTX(s.db, func(tx *gorm.DB) error {
		if err := tx.WithContext(ctx).
			Where("role_id = ?", roleID).
			Where("permission_id IN ?", permissionID).
			Delete(&authdomain.RolePermission{}).Error; err != nil {
			return err
		}
		return nil
	})
	return err
}

func (s *RoleStore) RoleHasPermission(ctx context.Context, roleID uuid.UUID, permission string) (bool, error) {
	var count int64

	err := s.db.WithContext(ctx).Table("roles").
		Joins("JOIN role_permissions ON roles.role_id = role_permissions.role_id").
		Joins("JOIN permissions ON permissions.permission_id = role_permissions.permission_id").
		Where("roles.role_id = ?", roleID).
		Where("permissions.name = ?", permission).
		Count(&count).Error

	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func (s *RoleStore) CreatePermission(ctx context.Context, tx *gorm.DB, permission *authdomain.Permission) error {
	err := tx.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "name"}},
			DoNothing: true,
		}).
		Create(permission).Error

	return err
}

func (s *RoleStore) GetPermissionByName(ctx context.Context, name string) (*authdomain.Permission, error) {
	var permission authdomain.Permission
	err := s.db.WithContext(ctx).
		Where("name = ?", name).
		First(&permission).Error
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return nil, shared_errors.ErrNotFound
		default:
			return nil, err
		}

	}
	return &permission, nil

}
