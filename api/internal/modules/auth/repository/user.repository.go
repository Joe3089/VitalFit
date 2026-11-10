package authrepository

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	instructordomain "github.com/vitalfit/api/internal/modules/instructor/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/db"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type UserStore struct {
	db *gorm.DB
}

func NewUserStore(db *gorm.DB) *UserStore {
	return &UserStore{
		db: db,
	}
}

func (s *UserStore) Create(ctx context.Context, tx *gorm.DB, user *authdomain.Users) error {
	err := tx.WithContext(ctx).Create(&user).Error
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			if pgErr.ConstraintName == "users_email_key" {
				return shared_errors.ErrConflict
			}
			if pgErr.ConstraintName == "users_identity_document_key" {
				return shared_errors.ErrConflict
			}
		}
		return err
	}
	//for seed
	if user.Role.Name == "client" && user.ClientProfile.UserID == uuid.Nil {
		clientProfile := authdomain.ClientProfiles{
			UserID:   user.UserID,
			Category: authdomain.ClientCategoryNew,
		}
		if err := tx.WithContext(ctx).Create(&clientProfile).Error; err != nil {
			return err
		}
	}
	return nil
}

func (s *UserStore) GetByID(ctx context.Context, userID uuid.UUID) (*authdomain.Users, error) {
	var user authdomain.Users

	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()

	result := s.db.WithContext(ctx).
		Preload("Role").
		Preload("ClientProfile").
		Preload("ClientMembership").
		Where("user_id = ?", userID).
		First(&user)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, result.Error
	}
	return &user, nil
}

func (s *UserStore) GetBranchAdmins(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*authdomain.Users, error) {
	var users []*authdomain.Users
	searchQuery := "%" + fq.Search + "%"
	err := s.db.WithContext(ctx).
		Joins("JOIN roles ON roles.role_id = users.role_id").
		Preload("Role").
		Where("roles.name = ?", "branch_admin").
		Where("users.first_name ILIKE ? OR users.last_name ILIKE ? OR users.email ILIKE ? OR users.identity_document ILIKE ? OR CONCAT(users.first_name, ' ', users.last_name) ILIKE ?", searchQuery, searchQuery, searchQuery, searchQuery, searchQuery).
		Find(&users).Error
	if err != nil {
		return nil, err
	}
	return users, nil
}
func (s *UserStore) GetUsers(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*authdomain.Users, error) {
	var users []*authdomain.Users
	searchQuery := "%" + fq.Search + "%"

	query := s.db.WithContext(ctx).
		Joins("JOIN roles ON roles.role_id = users.role_id").
		Preload("Role").
		Where("roles.name <> ?", "client")

	query = query.Where(
		"users.first_name ILIKE ? OR users.last_name ILIKE ? OR users.email ILIKE ? OR users.identity_document ILIKE ? OR CONCAT(users.first_name, ' ', users.last_name) ILIKE ?",
		searchQuery, searchQuery, searchQuery, searchQuery, searchQuery,
	)

	if fq.Role != "" {
		query = query.Where("roles.name = ?", fq.Role)
	}

	err := query.Find(&users).Error
	if err != nil {
		return nil, err
	}

	return users, nil
}

func (s *UserStore) GetClients(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*authdomain.Users, int64, error) {
	var users []*authdomain.Users
	var total int64
	searchQuery := "%" + fq.Search + "%"

	query := s.db.WithContext(ctx).
		Model(&authdomain.Users{}).
		Joins("JOIN roles ON roles.role_id = users.role_id").
		Where("roles.name = ?", "client").
		Where("users.first_name ILIKE ? OR users.last_name ILIKE ? OR users.email ILIKE ? OR users.identity_document ILIKE ? OR CONCAT(users.first_name, ' ', users.last_name) ILIKE ?", searchQuery, searchQuery, searchQuery, searchQuery, searchQuery)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Preload("Role").Limit(fq.Limit).Offset(fq.Page*fq.Limit - fq.Limit).Order("users.created_at " + fq.Sort).Find(&users).Error

	if err != nil {
		return nil, 0, err
	}
	return users, total, nil
}

func (s *UserStore) CreateAndInvitate(ctx context.Context, user *authdomain.Users, token string, invitationExp time.Duration) error {
	//transacction
	return db.WithTX(s.db, func(tx *gorm.DB) error {

		if err := s.Create(ctx, tx, user); err != nil {
			return err //rollback
		}

		if err := s.createUserInvitation(ctx, tx, token, user.UserID, invitationExp); err != nil {
			return err //rollback
		}

		return nil //commit
	})
}

func (s *UserStore) Delete(ctx context.Context, userID uuid.UUID) error {
	return db.WithTX(s.db, func(tx *gorm.DB) error {
		if err := s.delete(ctx, tx, userID); err != nil {
			return err //rollback
		}
		if err := s.deleteUserInvitations(ctx, tx, userID); err != nil {
			return err //rollback
		}
		return nil //commit
	})
}

func (s *UserStore) Activate(ctx context.Context, code string) error {
	return db.WithTX(s.db, func(tx *gorm.DB) error {
		user, err := s.getUserFromInvitation(ctx, tx, code)
		if err != nil {
			return err
		}
		user.IsValidated = true
		if err := s.Update(ctx, user); err != nil {
			return err
		}

		if err := s.deleteUserInvitations(ctx, tx, user.UserID); err != nil {
			return err
		}

		return nil
	})

}

func (s *UserStore) ActivateUserStaff(ctx context.Context, token string, password string) error {
	return db.WithTX(s.db, func(tx *gorm.DB) error {
		user, err := s.getUserFromInvitation(ctx, tx, token)
		if err != nil {
			return err
		}
		user.IsValidated = true
		user.PasswordHash.Set(password)
		if err := s.Update(ctx, user); err != nil {
			return err
		}

		if err := s.deleteUserInvitations(ctx, tx, user.UserID); err != nil {
			return err
		}

		return nil
	})

}

func (s *UserStore) UpdateActivationCode(ctx context.Context, userID uuid.UUID, token string, invitationExp time.Duration) error {
	return db.WithTX(s.db, func(tx *gorm.DB) error {
		if err := s.deleteUserInvitations(ctx, tx, userID); err != nil {
			return err
		}

		if err := s.createUserInvitation(ctx, tx, token, userID, invitationExp); err != nil {
			return err
		}

		return nil
	})
}

func (s *UserStore) GetByEmail(ctx context.Context, email string) (*authdomain.Users, error) {
	var user authdomain.Users
	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()
	err := s.db.WithContext(ctx).
		Preload("Role").
		Preload("ClientProfile").
		Preload("ClientMembership").
		Where("email = ?", email).
		First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (s *UserStore) Update(ctx context.Context, user *authdomain.Users) error {
	err := s.db.WithContext(ctx).Save(user).Error
	if err != nil {
		return err
	}
	return nil
}

func (s *UserStore) delete(ctx context.Context, tx *gorm.DB, userID uuid.UUID) error {
	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()

	result := tx.WithContext(ctx).Unscoped().Delete(&authdomain.Users{}, userID)

	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (s *UserStore) SoftDelete(ctx context.Context, userID uuid.UUID) error {
	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()

	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&authdomain.Users{}, userID).Error; err != nil {
			return err
		}

		if err := tx.Where("user_id = ?", userID).Delete(&instructordomain.Instructor{}).Error; err != nil {
			return err
		}

		return nil
	})
}

// Elimina las invitaciones asociadas a ese usuario.
func (s *UserStore) deleteUserInvitations(ctx context.Context, tx *gorm.DB, userID uuid.UUID) error {
	// Elimina todos los registros de invitaciones que tienen este UserID
	result := tx.WithContext(ctx).Where("user_id = ?", userID).Delete(&authdomain.UserInvitations{})

	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (s *UserStore) createUserInvitation(ctx context.Context, tx *gorm.DB, code string, userID uuid.UUID, invitationExp time.Duration) error {
	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()
	return tx.WithContext(ctx).Create(&authdomain.UserInvitations{
		Token:  code,
		UserID: userID,
		Expiry: time.Now().Add(invitationExp),
	}).Error
}

func (s *UserStore) getUserFromInvitation(ctx context.Context, tx *gorm.DB, code string) (*authdomain.Users, error) {

	var invitation authdomain.UserInvitations

	hash := sha256.Sum256([]byte(code))
	hashCode := hex.EncodeToString(hash[:])

	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()

	result := tx.WithContext(ctx).
		Preload("Users").
		Where("token = ? AND expiry > ?", hashCode, time.Now()).
		First(&invitation)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, result.Error
	}

	return &invitation.Users, nil
}

func (s *UserStore) CreatePasswordResetToken(ctx context.Context, userID uuid.UUID, key string, tokenExp time.Duration) error {
	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()
	return db.WithTX(s.db, func(tx *gorm.DB) error {
		if err := s.deleteUserReset(ctx, tx, userID); err != nil {
			return err
		}

		if err := s.userResetToken(ctx, tx, userID, key, tokenExp); err != nil {
			return err //rollback
		}
		return nil //commit

	})
}

func (s *UserStore) DeleteResetToken(ctx context.Context, userID uuid.UUID) error {
	return db.WithTX(s.db, func(tx *gorm.DB) error {
		if err := s.deleteUserReset(ctx, tx, userID); err != nil {
			return err //rollback
		}

		return nil //commit
	})
}

func (s *UserStore) ResetUserPassword(ctx context.Context, key string, user *authdomain.Users) error {
	return db.WithTX(s.db, func(tx *gorm.DB) error {
		userReset, err := s.getUserResetToken(ctx, tx, key)
		if err != nil {
			return err
		}
		user.UserID = userReset.UserID
		if err := tx.WithContext(ctx).Model(user).Select("password_hash").Updates(user).Error; err != nil {
			return err
		}
		if err := s.deleteUserReset(ctx, tx, user.UserID); err != nil {
			return err
		}
		return nil
	})
}

func (s *UserStore) UpgradePassword(ctx context.Context, user *authdomain.Users) error {
	return db.WithTX(s.db, func(tx *gorm.DB) error {
		if err := tx.WithContext(ctx).Model(user).Select("password_hash").Updates(user).Error; err != nil {
			return err
		}
		return nil
	})
}

func (s *UserStore) userResetToken(ctx context.Context, tx *gorm.DB, userID uuid.UUID, key string, tokenExp time.Duration) error {
	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()

	err := tx.WithContext(ctx).Create(&authdomain.PasswordResetToken{
		Token:  key,
		UserID: userID,
		Expiry: time.Now().Add(tokenExp),
	}).Error
	if err != nil {
		return err
	}
	return nil
}

func (s *UserStore) deleteUserReset(ctx context.Context, tx *gorm.DB, userID uuid.UUID) error {
	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()
	err := tx.WithContext(ctx).Where("user_id = ?", userID).Delete(&authdomain.PasswordResetToken{}).Error
	if err != nil {
		return err
	}
	return nil
}

func (s *UserStore) getUserResetToken(ctx context.Context, tx *gorm.DB, key string) (*authdomain.Users, error) {
	var resetToken authdomain.PasswordResetToken
	hash := sha256.Sum256([]byte(key))
	hashCode := hex.EncodeToString(hash[:])

	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()

	result := tx.WithContext(ctx).
		Preload("Users").
		Where("token = ? AND expiry > ?", hashCode, time.Now()).
		First(&resetToken)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, result.Error
	}

	return &resetToken.Users, nil
}

func (s *UserStore) UpdateUserClient(ctx context.Context, user *authdomain.Users) error {
	return s.db.WithContext(ctx).Model(&authdomain.Users{UserID: user.UserID}).Select(
		"FirstName",
		"LastName",
		"Email",
		"Phone",
		"IdentityDocument",
		"BirthDate",
		"Gender",
		"ProfilePictureURL",
	).Updates(user).Error
}

func (s *UserStore) UpdateUserStaff(ctx context.Context, user *authdomain.Users) error {
	return s.db.WithContext(ctx).Model(&authdomain.Users{UserID: user.UserID}).Select(
		"FirstName",
		"LastName",
		"Email",
		"Phone",
		"IdentityDocument",
		"BirthDate",
		"Gender",
		"ProfilePictureURL",
		"RoleID",
	).Updates(user).Error
}

func (s *UserStore) ValidateResetToken(ctx context.Context, key string) error {
	var resetToken authdomain.PasswordResetToken
	hash := sha256.Sum256([]byte(key))
	hashCode := hex.EncodeToString(hash[:])

	ctx, cancel := context.WithTimeout(ctx, db.QueryTimeoutDuration)
	defer cancel()

	result := s.db.WithContext(ctx).
		Where("token = ? AND expiry > ?", hashCode, time.Now()).
		First(&resetToken)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return shared_errors.ErrNotFound
		}
		return result.Error
	}

	return nil
}

func (s *UserStore) UpdateClientStatus(ctx context.Context, userID uuid.UUID, status authdomain.UserStatusEnum) error {
	return s.db.WithContext(ctx).
		Model(&authdomain.Users{}).
		Where("user_id = ?", userID).
		Update("status", status).Error
}

func (s *UserStore) UpdateClientCategory(ctx context.Context, userID uuid.UUID, category authdomain.ClientCategoryEnum) error {
	return s.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"category"}),
	}).Create(&authdomain.ClientProfiles{
		UserID:   userID,
		Category: category,
	}).Error
}

func (s *UserStore) GetAllClients(ctx context.Context) ([]*authdomain.Users, error) {
	var users []*authdomain.Users
	err := s.db.WithContext(ctx).
		Joins("JOIN roles ON roles.role_id = users.role_id").
		Where("roles.name = ?", "client").Find(&users).Error
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (s *UserStore) GetAllStaffUsers(ctx context.Context) ([]*authdomain.Users, error) {
	var users []*authdomain.Users
	err := s.db.WithContext(ctx).
		Joins("JOIN roles ON roles.role_id = users.role_id").
		Preload("Role").
		Where("roles.name <> ?", "client").
		Find(&users).Error
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (s *UserStore) BlockUser(ctx context.Context, userID uuid.UUID, justification string) error {
	result := s.db.WithContext(ctx).Model(&authdomain.Users{}).
		Where("user_id = ?", userID).
		Updates(map[string]interface{}{
			"status":              authdomain.UserStatusBlocked,
			"block_justification": justification,
		})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return shared_errors.ErrNotFound
	}
	return nil
}

func (s *UserStore) UnblockUser(ctx context.Context, userID uuid.UUID) error {
	result := s.db.WithContext(ctx).Model(&authdomain.Users{}).
		Where("user_id = ?", userID).
		Updates(map[string]interface{}{
			"status":              authdomain.UserStatusActive,
			"block_justification": "",
		})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return shared_errors.ErrNotFound
	}
	return nil
}
