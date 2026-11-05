package schedulerepository

import (
	"context"

	"github.com/google/uuid"
	scheduledomain "github.com/vitalfit/api/internal/modules/schedule/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"gorm.io/gorm"
)

func (s *ScheduleStore) CancelClass(ctx context.Context, class *scheduledomain.Class, reason string, cancelledBy uuid.UUID) ([]uuid.UUID, error) {
	var affected []uuid.UUID

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		res := tx.Exec(`
			UPDATE classes
			SET status = ?, cancellation_reason = ?, cancelled_at = NOW(), cancelled_by = ?, is_visible = FALSE, updated_at = NOW()
			WHERE class_id = ? AND status <> ? AND deleted_at IS NULL`,
			scheduledomain.ClassStatusCancelled, reason, cancelledBy, class.ClassID, scheduledomain.ClassStatusCancelled)
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return shared_errors.ErrClassAlreadyCancelled
		}

		if err := tx.Raw(`
			UPDATE bookings SET status = 'CancelledBySystem', updated_at = NOW()
			WHERE class_id = ? AND status = 'Confirmed' AND deleted_at IS NULL
			RETURNING user_id`, class.ClassID).Scan(&affected).Error; err != nil {
			return err
		}
		if len(affected) == 0 {
			return nil
		}

		// Same refund rule as a client cancellation: credits are returned unless
		// the client is a member and the service is free for members.
		return tx.Exec(`
			UPDATE client_service_balances csb
			SET balance = csb.balance + 1, updated_at = NOW()
			FROM service_branch_details sbd
			WHERE csb.service_id = ? AND csb.user_id IN ?
			  AND sbd.service_id = csb.service_id AND sbd.branch_id = ?
			  AND (
				sbd.price_for_member > 0 OR NOT EXISTS (
					SELECT 1 FROM client_memberships cm
					WHERE cm.user_id = csb.user_id AND cm.status = 'Active' AND cm.end_date >= CURRENT_DATE
				)
			  )`, class.ServiceID, affected, class.BranchID).Error
	})
	return affected, err
}
