package membershipsrepository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	membershipsdomain "github.com/vitalfit/api/internal/modules/memberships/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type MembershipStore struct {
	db *gorm.DB
}

func NewMembershipStore(db *gorm.DB) *MembershipStore {
	return &MembershipStore{
		db: db,
	}
}

// CreateMembershipType crea un nuevo tipo de membresía en la base de datos.
func (s *MembershipStore) CreateMembershipType(ctx context.Context, membership *membershipsdomain.MembershipType) error {
	err := s.db.WithContext(ctx).Create(membership).Error
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == "23505" { // unique_violation
				return shared_errors.ErrConflict
			}
		}
		return err
	}
	return nil
}

// CreateMembershipTypeTX permite crear un tipo de membresía dentro de una transacción activa.
func (s *MembershipStore) CreateMembershipTypeTX(ctx context.Context, tx *gorm.DB, membership *membershipsdomain.MembershipType) error {
	err := tx.WithContext(ctx).Create(membership).Error
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == "23505" {
				return shared_errors.ErrConflict
			}
		}
		return err
	}
	return nil
}

// UpdateMembershipType actualiza los datos de un tipo de membresía existente.
func (s *MembershipStore) UpdateMembershipType(ctx context.Context, membership *membershipsdomain.MembershipType) error {
	err := s.db.WithContext(ctx).Save(membership).Error
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == "23505" { // unique_violation
				return shared_errors.ErrConflict
			}
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return shared_errors.ErrNotFound
		}
		return err
	}
	return nil
}

func (s *MembershipStore) DeleteMembershipType(ctx context.Context, id uuid.UUID) error {
	err := s.db.WithContext(ctx).
		Model(&membershipsdomain.MembershipType{}).
		Where("membership_type_id = ?", id).
		Update("deleted_at", time.Now()).Error
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return shared_errors.ErrNotFound
		default:
			return err
		}
	}
	return nil
}

// GetMembershipTypeByID obtiene un tipo de membresía por su UUID.
func (s *MembershipStore) GetMembershipTypeByID(ctx context.Context, id uuid.UUID) (*membershipsdomain.MembershipType, error) {
	membership := &membershipsdomain.MembershipType{}
	err := s.db.WithContext(ctx).
		Where("membership_type_id = ? AND deleted_at IS NULL", id).
		First(membership).Error
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return nil, shared_errors.ErrNotFound
		default:
			return nil, err
		}
	}
	return membership, nil
}

// GetMembershipTypesByIDs obtiene múltiples tipos de membresía por sus UUIDs y los devuelve en un mapa.
func (s *MembershipStore) GetMembershipTypesByIDs(ctx context.Context, ids []uuid.UUID) (map[uuid.UUID]*membershipsdomain.MembershipType, error) {
	if len(ids) == 0 {
		return make(map[uuid.UUID]*membershipsdomain.MembershipType), nil
	}

	var memberships []*membershipsdomain.MembershipType
	if err := s.db.WithContext(ctx).Where("membership_type_id IN ?", ids).Find(&memberships).Error; err != nil {
		return nil, err
	}

	membershipsMap := make(map[uuid.UUID]*membershipsdomain.MembershipType, len(memberships))
	for _, m := range memberships {
		membershipsMap[m.MembershipTypeID] = m
	}

	return membershipsMap, nil
}

// GetMembershipTypes devuelve todos los tipos de membresía activos.
func (s *MembershipStore) GetMembershipTypes(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*membershipsdomain.MembershipType, error) {
	var memberships []*membershipsdomain.MembershipType

	baseQuery := s.db.WithContext(ctx).Model(&membershipsdomain.MembershipType{})

	if fq.Search != "" {
		baseQuery = baseQuery.Where("name ILIKE ?", "%"+fq.Search+"%")
	}

	query := baseQuery.
		Limit(fq.Limit).
		Offset(fq.Page*fq.Limit - fq.Limit).
		Order("created_at " + fq.Sort)

	if err := query.Find(&memberships).Error; err != nil {
		return nil, err
	}

	return memberships, nil
}

func (s *MembershipStore) GetMembershipTypesFTotal(ctx context.Context, fq pagination.PaginatedFeedQuery) (int64, error) {
	var count int64
	baseQuery := s.db.WithContext(ctx).Model(&membershipsdomain.MembershipType{})

	if fq.Search != "" {
		baseQuery = baseQuery.Where("name ILIKE ?", "%"+fq.Search+"%")
	}

	query := baseQuery.
		Order("created_at " + fq.Sort)

	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (s *MembershipStore) GetSummary(ctx context.Context) (*membershipsdomain.MembershipSummary, error) {
	var summary membershipsdomain.MembershipSummary

	query := s.db.WithContext(ctx).Model(&membershipsdomain.MembershipType{})

	err := query.Select(
		"COUNT(*) as total",
		"COUNT(CASE WHEN is_active = true THEN 1 END) as actives",
		"COUNT(CASE WHEN is_active = false THEN 1 END) as inactives",
	).Take(&summary).Error

	if err != nil {
		return nil, err
	}

	return &summary, nil
}

func (s *MembershipStore) UpdateClientMembership(ctx context.Context, membership *membershipsdomain.ClientMembership) error {
	err := s.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"membership_type_id",
			"start_date",
			"end_date",
			"status",
			"invoice_id",
			"cancellation_reason_id",
			"cancellation_notes",
		}),
	}).Create(membership).Error

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == "23503" {
				return shared_errors.ErrNotFound
			}
		}
		return err
	}
	return nil
}

func (s *MembershipStore) UpdateClientMembershipStatus(ctx context.Context, membership *membershipsdomain.ClientMembership) error {
	// Usamos Updates para actualizar solo los campos proporcionados en el struct `membership`.
	// GORM es lo suficientemente inteligente como para generar un UPDATE solo con los campos no nulos.
	query := s.db.WithContext(ctx).
		Model(&membershipsdomain.ClientMembership{}).
		Where("client_membership_id = ?", membership.ClientMembershipID)

	var result *gorm.DB
	if membership.Status == membershipsdomain.StatusActive {
		result = query.Updates(map[string]interface{}{
			"status":                 membership.Status,
			"cancellation_reason_id": nil,
			"cancellation_notes":     "",
		})
	} else {
		result = query.Updates(membership)
	}

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return shared_errors.ErrNotFound // El ID no existe, no se actualizó ninguna fila.
	}

	return nil
}

func (s *MembershipStore) ClientHasActiveMembership(ctx context.Context, clientID uuid.UUID, gracePeriodDays int) (bool, error) {
	var count int64
	err := s.db.WithContext(ctx).
		Model(&membershipsdomain.ClientMembership{}).
		Where("user_id = ?", clientID).
		Where("status = ?", membershipsdomain.StatusActive).
		Where("end_date >= ?", time.Now().AddDate(0, 0, -gracePeriodDays)).
		Count(&count).Error

	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func (s *MembershipStore) GetClientMembership(ctx context.Context, clientID uuid.UUID) (*membershipsdomain.ClientMembership, error) {
	var clientMembership membershipsdomain.ClientMembership
	err := s.db.WithContext(ctx).
		Preload("MembershipType").
		Where("user_id = ?", clientID).
		First(&clientMembership).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}

	return &clientMembership, nil
}

func (s *MembershipStore) GetClientMembershipByID(ctx context.Context, clientMembershipID uuid.UUID) (*membershipsdomain.ClientMembership, error) {
	var clientMembership membershipsdomain.ClientMembership
	err := s.db.WithContext(ctx).
		Preload("MembershipType").
		Preload("User").
		Preload("CancellationReason").
		Where("client_membership_id = ?", clientMembershipID).
		First(&clientMembership).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}

	return &clientMembership, nil
}

func (s *MembershipStore) GetClientsMemberships(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*membershipsdomain.ClientMembership, int64, error) {
	var clientMemberships []*membershipsdomain.ClientMembership
	var total int64

	query := s.db.WithContext(ctx).
		Model(&membershipsdomain.ClientMembership{}).
		Joins("JOIN users ON users.user_id = client_memberships.user_id").
		Joins("JOIN membership_types ON membership_types.membership_type_id = client_memberships.membership_type_id")

	if fq.Category != "" {
		query = query.Where("client_memberships.status = ?", fq.Category)
	}

	if fq.Search != "" {
		searchQuery := "%" + fq.Search + "%"
		searchFields := "users.first_name ILIKE ? OR users.last_name ILIKE ? OR users.email ILIKE ? OR users.identity_document ILIKE ? OR membership_types.name ILIKE ?"
		if fq.Category == "" {
			searchFields += " OR client_memberships.status::text ILIKE ?"
			query = query.Where(searchFields, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery)
		} else {
			query = query.Where(searchFields, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery)
		}
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortDirection := fq.Sort
	if sortDirection == "" {
		sortDirection = "desc"
	}

	page := fq.Page
	if page < 1 {
		page = 1
	}

	err := query.
		Preload("MembershipType").
		Preload("User").
		Order("client_memberships.start_date " + sortDirection).
		Limit(fq.Limit).
		Offset((page - 1) * fq.Limit).
		Find(&clientMemberships).Error

	if err != nil {
		return nil, 0, err
	}

	return clientMemberships, total, nil
}

func (s *MembershipStore) GetAllMembershipTypes(ctx context.Context) ([]*membershipsdomain.MembershipType, error) {
	var membershipTypes []*membershipsdomain.MembershipType
	err := s.db.WithContext(ctx).Find(&membershipTypes).Error
	if err != nil {
		return nil, err
	}
	return membershipTypes, nil

}

// Cancellation Reasons operations

func (s *MembershipStore) CreateCancellationReason(ctx context.Context, reason *membershipsdomain.CancellationReason) error {
	err := s.db.WithContext(ctx).Create(reason).Error
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == "23505" { // unique_violation on description
				return shared_errors.ErrConflict
			}
		}
		return err
	}
	return nil
}

func (s *MembershipStore) UpdateCancellationReason(ctx context.Context, reason *membershipsdomain.CancellationReason) error {
	err := s.db.WithContext(ctx).Save(reason).Error
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == "23505" { // unique_violation on description
				return shared_errors.ErrConflict
			}
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return shared_errors.ErrNotFound
		}
		return err
	}
	return nil
}

func (s *MembershipStore) DeleteCancellationReason(ctx context.Context, id uuid.UUID) error {
	// Soft delete - set deleted_at timestamp
	result := s.db.WithContext(ctx).Delete(&membershipsdomain.CancellationReason{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return shared_errors.ErrNotFound
	}
	return nil
}

func (s *MembershipStore) GetCancellationReasonByID(ctx context.Context, id uuid.UUID) (*membershipsdomain.CancellationReason, error) {
	reason := &membershipsdomain.CancellationReason{}
	err := s.db.WithContext(ctx).Where("reason_id = ?", id).First(reason).Error
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return nil, shared_errors.ErrNotFound
		default:
			return nil, err
		}
	}
	return reason, nil
}

func (s *MembershipStore) UpdateExpiredMemberships(ctx context.Context) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var expiredUserIDs []uuid.UUID
		now := time.Now()

		if err := tx.Model(&membershipsdomain.ClientMembership{}).
			Where("status = ? AND end_date < ?", membershipsdomain.StatusActive, now).
			Pluck("user_id", &expiredUserIDs).Error; err != nil {
			return err
		}

		if len(expiredUserIDs) == 0 {
			return nil
		}

		if err := tx.Model(&membershipsdomain.ClientMembership{}).
			Where("user_id IN ? AND status = ?", expiredUserIDs, membershipsdomain.StatusActive).
			Update("status", membershipsdomain.StatusExpired).Error; err != nil {
			return err
		}

		return tx.Table("client_profiles").
			Where("user_id IN ?", expiredUserIDs).
			Update("category", authdomain.ClientCategoryRegular).Error
	})
}

func (s *MembershipStore) GetCancellationReasons(ctx context.Context, fq pagination.PaginatedFeedQuery) ([]*membershipsdomain.CancellationReason, int64, error) {
	var reasons []*membershipsdomain.CancellationReason
	var total int64

	query := s.db.WithContext(ctx).Model(&membershipsdomain.CancellationReason{})

	if fq.Search != "" {
		query = query.Where("description ILIKE ?", "%"+fq.Search+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := fq.Page
	if page < 1 {
		page = 1
	}

	err := query.Order("description " + fq.Sort).
		Limit(fq.Limit).
		Offset((page - 1) * fq.Limit).
		Find(&reasons).Error
	if err != nil {
		return nil, 0, err
	}
	return reasons, total, nil
}

func (s *MembershipStore) GetCancellationReasonByDescription(ctx context.Context, description string) (*membershipsdomain.CancellationReason, error) {
	reason := &membershipsdomain.CancellationReason{}
	err := s.db.WithContext(ctx).Where("description = ?", description).First(reason).Error
	if err != nil {
		switch err {
		case gorm.ErrRecordNotFound:
			return nil, shared_errors.ErrNotFound
		default:
			return nil, err
		}
	}
	return reason, nil
}

func (s *MembershipStore) GetExpiringMemberships(ctx context.Context, days int) ([]membershipsdomain.MembershipExpiringDetail, error) {
	var results []membershipsdomain.MembershipExpiringDetail

	targetDate := time.Now().AddDate(0, 0, days).Format("2006-01-02")

	err := s.db.WithContext(ctx).Raw(`
        SELECT 
            cm.user_id,
            CONCAT(u.first_name, ' ', u.last_name) as user_name,
            u.email as user_email,
            mt.membership_type_id,
            mt.name as membership_name,
            ?::int as days_remaining
        FROM client_memberships cm
        JOIN users u ON cm.user_id = u.user_id
        JOIN membership_types mt ON cm.membership_type_id = mt.membership_type_id
        WHERE cm.status = ? 
        AND DATE(cm.end_date) = ? 
    `, days, membershipsdomain.StatusActive, targetDate).Scan(&results).Error

	if err != nil {
		return nil, err
	}

	return results, nil
}
