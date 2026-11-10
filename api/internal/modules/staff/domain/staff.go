package staffdomain

import (
	"github.com/google/uuid"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	branchdomain "github.com/vitalfit/api/internal/modules/branches/domain"
)

type BranchStaff struct {
	BranchID uuid.UUID `gorm:"type:uuid;primaryKey;column:branch_id"`
	UserID   uuid.UUID `gorm:"type:uuid;primaryKey;column:user_id;index:idx_branch_staff_user_id"`

	Branch branchdomain.Branch `gorm:"foreignKey:BranchID;references:BranchID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`

	User authdomain.Users `gorm:"foreignKey:UserID;references:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
}

func (BranchStaff) TableName() string {
	return "branch_staff"
}
