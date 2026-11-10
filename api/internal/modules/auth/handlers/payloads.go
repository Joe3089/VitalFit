package authhandlers

import (
	"strings"
	"time"

	"github.com/google/uuid"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
)

type CreateUserClientPayload struct {
	FirstName         string `json:"first_name" binding:"required"`
	LastName          string `json:"last_name" binding:"required"`
	Email             string `json:"email" binding:"required,email"`
	Phone             string `json:"phone" binding:"required"`
	IdentityDocument  string `json:"identity_document" binding:"required"`
	Password          string `json:"password" binding:"required,min=8,containsany=ABCDEFGHIJKLMNOPQRSTUVWXYZ,containsany=0123456789,containsany=!@#$%^&*"`
	BirthDate         string `json:"birth_date" binding:"required"`
	Gender            string `json:"gender" binding:"required"`
	ProfilePictureURL string `json:"profile_picture_url"`
}

type CreateUserStaffPayload struct {
	FirstName         string `json:"first_name" binding:"required"`
	LastName          string `json:"last_name" binding:"required"`
	Email             string `json:"email" binding:"required,email"`
	Phone             string `json:"phone" binding:"required"`
	IdentityDocument  string `json:"identity_document" binding:"required"`
	BirthDate         string `json:"birth_date" binding:"required"`
	Gender            string `json:"gender" binding:"required"`
	ProfilePictureURL string `json:"profile_picture_url"`
	RoleName          string `json:"role_name" binding:"omitempty"`
}

func (c *CreateUserStaffPayload) CreateUser() (*authdomain.Users, error) {
	birthdate, err := time.Parse("2006-01-02", c.BirthDate)
	if err != nil {
		birthdate, err = time.Parse(time.RFC3339, c.BirthDate)
		if err != nil {
			return nil, err
		}
	}
	return &authdomain.Users{
		FirstName:         c.FirstName,
		LastName:          c.LastName,
		Email:             c.Email,
		Phone:             c.Phone,
		IdentityDocument:  c.IdentityDocument,
		BirthDate:         birthdate,
		Gender:            authdomain.GenderEnum(strings.ToLower(c.Gender)),
		ProfilePictureURL: c.ProfilePictureURL,
	}, nil
}

func (c *CreateUserClientPayload) CreateUser() (*authdomain.Users, error) {
	birthdate, err := time.Parse("2006-01-02", c.BirthDate)
	if err != nil {
		birthdate, err = time.Parse(time.RFC3339, c.BirthDate)
		if err != nil {
			return nil, err
		}
	}
	return &authdomain.Users{
		FirstName:         c.FirstName,
		LastName:          c.LastName,
		Email:             c.Email,
		Phone:             c.Phone,
		IdentityDocument:  c.IdentityDocument,
		BirthDate:         birthdate,
		Gender:            authdomain.GenderEnum(strings.ToLower(c.Gender)),
		ProfilePictureURL: c.ProfilePictureURL,
	}, nil
}

type CodePayload struct {
	Code string `json:"code" binding:"required"`
}

type ResendActivationCodePayload struct {
	Email string `json:"email" binding:"required,email"`
}

type CreateUserTokenPayload struct {
	Email       string `json:"email" binding:"required,email,max=255"`
	Password    string `json:"password" binding:"required,min=3,max=72"`
	Context     string `json:"context"`
	DeviceToken string `json:"device_token,omitempty"`
}

type ForgotPasswordPayload struct {
	Email string `json:"email" binding:"required,email,max=255"`
}

type ResetPasswordPayload struct {
	// Complexity rules come from the configurable password policy (HU-ADMIN-07).
	Password        string `json:"password" binding:"required,min=6,max=72"`
	ConfirmPassword string `json:"confirm_password" binding:"required,eqfield=Password"`
	Token           string `json:"token" binding:"required"`
}

type UpdatePassswordPayload struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6,max=72"`
	ConfirmPassword string `json:"confirm_password" binding:"required,eqfield=NewPassword"`
}

type CreateRolesPayload struct {
	Name        string   `json:"name" binding:"required"`
	Description string   `json:"description" binding:"required"`
	Permissions []string `json:"permissions" binding:"omitempty"`
}

func (c *CreateRolesPayload) createRole() (*authdomain.Roles, error) {

	permissions := make([]authdomain.Permission, 0, len(c.Permissions))

	for _, pID := range c.Permissions {
		id, err := uuid.Parse(pID)
		if err != nil {
			return nil, err
		}
		permissions = append(permissions, authdomain.Permission{
			PermissionID: id,
		})
	}

	return &authdomain.Roles{
		Name:        c.Name,
		Description: c.Description,
		Permissions: permissions,
	}, nil
}

type PermissionsPayload struct {
	Permissions []string `json:"permissions" binding:"required"`
}

func (c *PermissionsPayload) toPermission() ([]uuid.UUID, error) {
	permisions := make([]uuid.UUID, 0, len(c.Permissions))

	for _, pID := range c.Permissions {
		id, err := uuid.Parse(pID)
		if err != nil {
			return nil, err
		}
		permisions = append(permisions, id)
	}
	return permisions, nil
}

type UpdateStaffPasswordPayload struct {
	Password        string `json:"password" binding:"required,min=6,max=72"`
	ConfirmPassword string `json:"confirm_password" binding:"required,eqfield=Password"`
}

type UpdateUserClientPayload struct {
	FirstName         string `json:"first_name" binding:"required"`
	LastName          string `json:"last_name" binding:"required"`
	Email             string `json:"email" binding:"required,email"`
	Phone             string `json:"phone" binding:"required"`
	IdentityDocument  string `json:"identity_document" binding:"required"`
	BirthDate         string `json:"birth_date" binding:"required"`
	Gender            string `json:"gender" binding:"required"`
	ProfilePictureURL string `json:"profile_picture_url"`
}

func (c *UpdateUserClientPayload) CreateUser() (*authdomain.Users, error) {
	birthdate, err := time.Parse("2006-01-02", c.BirthDate)
	if err != nil {
		birthdate, err = time.Parse(time.RFC3339, c.BirthDate)
		if err != nil {
			return nil, err
		}
	}
	return &authdomain.Users{
		FirstName:         c.FirstName,
		LastName:          c.LastName,
		Email:             c.Email,
		Phone:             c.Phone,
		BirthDate:         birthdate,
		Gender:            authdomain.GenderEnum(strings.ToLower(c.Gender)),
		IdentityDocument:  c.IdentityDocument,
		ProfilePictureURL: c.ProfilePictureURL,
	}, nil
}

type UpdateUserStaffPayload struct {
	FirstName         string `json:"first_name" binding:"required"`
	LastName          string `json:"last_name" binding:"required"`
	Email             string `json:"email" binding:"required,email"`
	Phone             string `json:"phone" binding:"required"`
	IdentityDocument  string `json:"identity_document" binding:"required"`
	BirthDate         string `json:"birth_date" binding:"required"`
	Gender            string `json:"gender" binding:"required"`
	ProfilePictureURL string `json:"profile_picture_url"`
	RoleName          string `json:"role_name" binding:"omitempty"`
}

func (c *UpdateUserStaffPayload) CreateUser() (*authdomain.Users, error) {
	birthdate, err := time.Parse("2006-01-02", c.BirthDate)
	if err != nil {
		birthdate, err = time.Parse(time.RFC3339, c.BirthDate)
		if err != nil {
			return nil, err
		}
	}
	return &authdomain.Users{
		FirstName:         c.FirstName,
		LastName:          c.LastName,
		Email:             c.Email,
		Phone:             c.Phone,
		BirthDate:         birthdate,
		Gender:            authdomain.GenderEnum(strings.ToLower(c.Gender)),
		IdentityDocument:  c.IdentityDocument,
		ProfilePictureURL: c.ProfilePictureURL,
	}, nil
}

type GetUserByEmailPayload struct {
	Email string `json:"email" binding:"required,email"`
}

// response
type BranchAdminResponse struct {
	UserID    uuid.UUID `json:"user_id"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	RoleID    uuid.UUID `json:"role_id"`
	RoleName  string    `json:"role_name"`
}

type UserResponse struct {
	UserID           uuid.UUID `json:"user_id"`
	FirstName        string    `json:"first_name"`
	LastName         string    `json:"last_name"`
	RoleID           uuid.UUID `json:"role_id"`
	RoleName         string    `json:"role_name"`
	Email            string    `json:"email"`
	IdentityDocument string    `json:"identity_document"`
	IsValidated      bool      `json:"is_validated"`
	ProfilePicture   string    `json:"profile_picture_url,omitempty"`
	Status           string    `json:"status"`
}

type GetUserResponse struct {
	UserID              uuid.UUID `json:"user_id"`
	FirstName           string    `json:"first_name"`
	LastName            string    `json:"last_name"`
	RoleID              uuid.UUID `json:"role_id"`
	RoleName            string    `json:"role_name"`
	Email               string    `json:"email"`
	IdentityDocument    string    `json:"identity_document"`
	BirthDate           string    `json:"birth_date"`
	Gender              string    `json:"gender"`
	Phone               string    `json:"phone"`
	ProfilePictureURL   string    `json:"profile_picture_url"`
	Category            string    `json:"category,omitempty"`
	HasActiveMembership bool      `json:"has_active_membership"`
	IsValidated         bool      `json:"is_validated"`
	Status              string    `json:"status"`
}

type OAuthLoginPayload struct {
	SessionToken string `json:"session_token" binding:"required"`
	DeviceToken  string `json:"device_token,omitempty"`
}

type RenewTokenPayload struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type BlockUserPayload struct {
	BlockJustification string `json:"block_justification" binding:"required"`
}
