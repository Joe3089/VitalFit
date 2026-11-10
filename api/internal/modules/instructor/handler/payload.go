package instructorhandler

import (
	"strings"
	"time"

	"github.com/google/uuid"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	instructordomain "github.com/vitalfit/api/internal/modules/instructor/domain"
)

type CreateInstructorPayload struct {
	FirstName         string `json:"first_name" binding:"required"`
	LastName          string `json:"last_name" binding:"required"`
	Email             string `json:"email" binding:"required,email"`
	Phone             string `json:"phone" binding:"required"`
	IdentityDocument  string `json:"identity_document" binding:"required"`
	BirthDate         string `json:"birth_date" binding:"required"`
	Gender            string `json:"gender" binding:"required"`
	ProfilePictureURL string `json:"profile_picture_url"`
	Biography         string `json:"biography"`
}

func (c *CreateInstructorPayload) toInstructor() (*instructordomain.Instructor, error) {
	birthdate, err := time.Parse("2006-01-02", c.BirthDate)
	if err != nil {
		birthdate, err = time.Parse(time.RFC3339, c.BirthDate)
		if err != nil {
			return nil, err
		}
	}
	user := &authdomain.Users{
		FirstName:         c.FirstName,
		LastName:          c.LastName,
		Email:             c.Email,
		Phone:             c.Phone,
		IdentityDocument:  c.IdentityDocument,
		BirthDate:         birthdate,
		Gender:            authdomain.GenderEnum(strings.ToLower(c.Gender)),
		ProfilePictureURL: c.ProfilePictureURL,
	}
	return &instructordomain.Instructor{
		Biography: c.Biography,
		User:      user,
	}, nil

}

type UpdateInstructorPayload struct {
	FirstName         string `json:"first_name" binding:"omitempty"`
	LastName          string `json:"last_name" binding:"omitempty"`
	Email             string `json:"email" binding:"omitempty,email"`
	Phone             string `json:"phone" binding:"omitempty"`
	Gender            string `json:"gender" binding:"omitempty,oneof=male female prefer-not-to-say"`
	BirthDate         string `json:"birth_date" binding:"omitempty"`
	ProfilePictureURL string `json:"profile_picture_url"`
	Biography         string `json:"biography"`
}

func (u *UpdateInstructorPayload) toInstructor(instructorID uuid.UUID) (*instructordomain.Instructor, error) {
	var birthdate time.Time
	var err error
	if u.BirthDate != "" {
		birthdate, err = time.Parse("2006-01-02", u.BirthDate)
		if err != nil {
			return nil, err
		}
	}
	return &instructordomain.Instructor{
		InstructorID: instructorID,
		Biography:    u.Biography,
		User: &authdomain.Users{
			FirstName: u.FirstName,
			LastName:  u.LastName,
			Email:     u.Email,
			Phone:     u.Phone,
			Gender:    authdomain.GenderEnum(strings.ToLower(u.Gender)),
			BirthDate: birthdate,
		},
	}, nil
}

type InstructorResponse struct {
	InstructorID      uuid.UUID            `json:"instructor_id"`
	UserID            uuid.UUID            `json:"user_id"`
	FirstName         string               `json:"first_name"`
	LastName          string               `json:"last_name"`
	Email             string               `json:"email"`
	Phone             string               `json:"phone"`
	IdentityDocument  string               `json:"identity_document"`
	BirthDate         time.Time            `json:"birth_date"`
	Gender            string               `json:"gender"`
	ProfilePictureURL string               `json:"profile_picture_url"`
	Specialties       []*SpecialtyResponse `json:"specialties"`
	Biography         string               `json:"biography"`
}

type ListInstructorResponse struct {
	InstructorID      uuid.UUID `json:"instructor_id"`
	UserID            uuid.UUID `json:"user_id"`
	FirstName         string    `json:"first_name"`
	LastName          string    `json:"last_name"`
	Email             string    `json:"email"`
	Phone             string    `json:"phone"`
	IdentityDocument  string    `json:"identity_document"`
	BirthDate         time.Time `json:"birth_date"`
	Gender            string    `json:"gender"`
	ProfilePictureURL string    `json:"profile_picture_url"`
	Biography         string    `json:"biography"`
}

type AssignInstructorsToBranchPayload struct {
	Instructor []string `json:"instructor" binding:"required"`
}

func (a *AssignInstructorsToBranchPayload) toInstructor() ([]uuid.UUID, error) {
	instructor := make([]uuid.UUID, 0, len(a.Instructor))

	for _, i := range a.Instructor {
		id, err := uuid.Parse(i)
		if err != nil {
			return nil, err
		}
		instructor = append(instructor, id)
	}
	return instructor, nil
}

type BranchInstructorResponse struct {
	InstructorID   uuid.UUID `json:"instructor_id"`
	InstructorName string    `json:"instructor_name"`
	Email          string    `json:"email"`
	Phone          string    `json:"phone"`
}

type AssignInstructorsSpecialtiesPayload struct {
	Specialties []string `json:"specialties" binding:"required"`
}

func (a *AssignInstructorsSpecialtiesPayload) toUUID() ([]uuid.UUID, error) {
	specialties := make([]uuid.UUID, 0, len(a.Specialties))
	for _, s := range a.Specialties {
		id, err := uuid.Parse(s)
		if err != nil {
			return nil, err
		}
		specialties = append(specialties, id)
	}
	return specialties, nil
}

type SpecialtyResponse struct {
	SpecialtyID   uuid.UUID `json:"specialty_id"`
	SpecialtyName string    `json:"specialty_name"`
}

type AssignedClientResponse struct {
	UserID            uuid.UUID `json:"user_id"`
	FirstName         string    `json:"first_name"`
	LastName          string    `json:"last_name"`
	Email             string    `json:"email"`
	Phone             string    `json:"phone"`
	TotalBookings     int64     `json:"total_bookings"`
	ProfilePictureURL string    `json:"profile_picture_url"`
}
