package accessdomain

import (
	"time"

	"github.com/google/uuid"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	branchdomain "github.com/vitalfit/api/internal/modules/branches/domain"
	productsdomain "github.com/vitalfit/api/internal/modules/products/domain"
	scheduledomain "github.com/vitalfit/api/internal/modules/schedule/domain"
)

type AttendanceStatus string

const (
	AttendanceStatusAttended  AttendanceStatus = "Attended"
	AttendanceStatusNoShow    AttendanceStatus = "NoShow"
	AttendanceStatusCancelled AttendanceStatus = "Cancelled"
)

type AttendanceLog struct {
	AttendanceID uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"attendance_id"`
	UserID       uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	ServiceID    uuid.UUID  `gorm:"type:uuid;not null" json:"service_id"`
	BranchID     *uuid.UUID `gorm:"type:uuid;index" json:"branch_id,omitempty"`

	ClassID *uuid.UUID `gorm:"column:schedule_id;type:uuid;index" json:"class_id,omitempty"`

	CheckInTime time.Time        `gorm:"not null;default:now();index" json:"check_in_time"`
	Status      AttendanceStatus `gorm:"type:attendance_status_enum;not null;default:'Attended'" json:"status"`

	CreatedAt time.Time `gorm:"default:now()" json:"created_at"`

	User    authdomain.Users       `gorm:"foreignKey:UserID;references:UserID" json:"-"`
	Branch  *branchdomain.Branch   `gorm:"foreignKey:BranchID;references:BranchID" json:"-"`
	Service productsdomain.Service `gorm:"foreignKey:ServiceID;references:ServiceID" json:"-"`
	Class   *scheduledomain.Class  `gorm:"foreignKey:ClassID;references:ClassID" json:"-"`
}

func (AttendanceLog) TableName() string {
	return "attendance_log"
}

type CheckInResponse struct {
	Message     string    `json:"message"`
	AccessType  string    `json:"access_type"`
	ServiceName string    `json:"service_name,omitempty"`
	CheckInTime time.Time `json:"check_in_time"`
	UserID      uuid.UUID `json:"user_id"`
}

type ClientScore struct {
	UserID          uuid.UUID `json:"user_id"`
	AttendanceCount int64     `json:"attendance_count"`
	Score           int       `json:"score"`
}
