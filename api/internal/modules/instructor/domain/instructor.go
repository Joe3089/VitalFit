package instructordomain

import (
	"time"

	"github.com/google/uuid"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	branchdomain "github.com/vitalfit/api/internal/modules/branches/domain"
	productsdomain "github.com/vitalfit/api/internal/modules/products/domain"

	"gorm.io/gorm"
)

type Instructor struct {
	InstructorID uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"instructor_id"`
	UserID       uuid.UUID      `gorm:"type:uuid;unique;not null" json:"user_id"`
	Biography    string         `gorm:"type:text" json:"biography"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	User     *authdomain.Users     `gorm:"foreignKey:UserID;references:UserID" json:"user,omitempty"`
	Branches []branchdomain.Branch `gorm:"many2many:branch_instructors;foreignKey:InstructorID;joinForeignKey:instructor_id;references:BranchID;joinReferences:branch_id" json:"branches,omitempty"`

	Specialties []*productsdomain.ServiceCategory `gorm:"many2many:instructor_specialties;foreignKey:InstructorID;joinForeignKey:instructor_id;references:CategoryID;joinReferences:category_id" json:"specialties,omitempty"`
}

func (Instructor) TableName() string {
	return "instructors"
}

type BranchInstructor struct {
	BranchID     uuid.UUID `gorm:"primaryKey"`
	InstructorID uuid.UUID `gorm:"primaryKey"`
}

func (BranchInstructor) TableName() string {
	return "branch_instructors"
}

type InstructorSpecialty struct {
	InstructorID uuid.UUID `gorm:"primaryKey"`
	CategoryID   uuid.UUID `gorm:"primaryKey"`
}

func (InstructorSpecialty) TableName() string {
	return "instructor_specialties"
}

type InstructorSummary struct {
	Total   int64 `json:"total"`
	Actives int64 `json:"actives"`
	Blocked int64 `json:"blocked"`
}

type AssignedClient struct {
	UserID            uuid.UUID `json:"user_id"`
	FirstName         string    `json:"first_name"`
	LastName          string    `json:"last_name"`
	Email             string    `json:"email"`
	Phone             string    `json:"phone"`
	TotalBookings     int64     `json:"total_bookings"`
	ProfilePictureURL string    `json:"profile_picture_url"`
}
