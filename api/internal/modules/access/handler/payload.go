package accesshandler

import (
	"time"

	"github.com/google/uuid"
	accessdomain "github.com/vitalfit/api/internal/modules/access/domain"
)

type CheckInPayload struct {
	QrJWT    string `json:"qr_jwt,omitempty"`
	UserID   string `json:"user_id,omitempty"`
	BranchID string `json:"branch_id"`
}

type AttendanceHistoryResponse struct {
	AttendanceID uuid.UUID                     `json:"attendance_id"`
	UserID       uuid.UUID                     `json:"user_id"`
	UserName     string                        `json:"user_name"`
	ServiceID    uuid.UUID                     `json:"service_id"`
	ServiceName  string                        `json:"service_name"`
	ClassName    string                        `json:"class_name,omitempty"`
	ClassTime    *time.Time                    `json:"class_time,omitempty"`
	CheckInTime  time.Time                     `json:"check_in_time"`
	Status       accessdomain.AttendanceStatus `json:"status"`
}

type ServiceUsageResponse struct {
	AttendanceID uuid.UUID                     `json:"attendance_id"`
	ServiceID    uuid.UUID                     `json:"service_id"`
	ServiceName  string                        `json:"service_name"`
	BranchID     *uuid.UUID                    `json:"branch_id,omitempty"`
	BranchName   string                        `json:"branch_name,omitempty"`
	CheckInTime  time.Time                     `json:"check_in_time"`
	Status       accessdomain.AttendanceStatus `json:"status"`
}
