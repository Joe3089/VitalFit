package authdomain

import (
	"database/sql/driver"
	"fmt"
	"time"

	"github.com/google/uuid"
	membershipsdomain "github.com/vitalfit/api/internal/modules/memberships/domain"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// ENUMS
type GenderEnum string
type ClientCategoryEnum string
type UserStatusEnum string

const (
	GenderMale            GenderEnum         = "male"
	GenderFemale          GenderEnum         = "female"
	GenderPreferNotToSay  GenderEnum         = "prefer-not-to-say"
	UserStatusActive      UserStatusEnum     = "Active"
	UserStatusBlocked     UserStatusEnum     = "Blocked"
	ClientCategoryVIP     ClientCategoryEnum = "VIP"
	ClientCategoryRegular ClientCategoryEnum = "Regular"
	ClientCategoryNew     ClientCategoryEnum = "New"
	ClientCategoryAtRisk  ClientCategoryEnum = "AtRisk"
)

type Password struct {
	text *string
	hash []byte
}

func (p *Password) Set(text string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(text), 12)
	if err != nil {
		return err
	}
	p.text = &text
	p.hash = hash
	return nil
}

func (p *Password) Matches(text string) (bool, error) {
	err := bcrypt.CompareHashAndPassword(p.hash, []byte(text))
	if err == nil {
		return true, nil
	}
	if err == bcrypt.ErrMismatchedHashAndPassword {
		return false, nil
	}
	return false, err
}

func (p Password) Value() (driver.Value, error) {
	if len(p.hash) == 0 {
		return nil, nil
	}
	return p.hash, nil
}

func (p *Password) Scan(value interface{}) error {
	if value == nil {
		p.hash = nil
		return nil
	}
	v, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("unexpected scan type password: %T", value)
	}
	p.hash = v
	return nil
}

type Users struct {
	UserID           uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"user_id"`
	FirstName        string    `gorm:"type:varchar(100);not null" json:"first_name"`
	LastName         string    `gorm:"type:varchar(100);not null" json:"last_name"`
	Email            string    `gorm:"type:citext;unique;not null" json:"email"`
	Phone            string    `gorm:"type:varchar(50)" json:"phone"`
	IdentityDocument string    `gorm:"type:varchar(50);unique" json:"identity_document"`

	PasswordHash       Password       `gorm:"column:password_hash;type:bytea;not null" json:"-"`
	BirthDate          time.Time      `gorm:"type:date" json:"birth_date"`
	Gender             GenderEnum     `gorm:"type:gender_enum" json:"gender"`
	Status             UserStatusEnum `gorm:"type:user_status;not null;default:'Active'" json:"status"`
	BlockJustification string         `gorm:"type:text" json:"block_justification"`
	ProfilePictureURL  string         `gorm:"type:varchar(255)" json:"profile_picture_url"`
	IsValidated        bool           `gorm:"default:false" json:"is_validated"`
	FaceID             *string        `gorm:"type:varchar(255);unique" json:"face_id,omitempty"`
	FaceAuthEnabled    bool           `gorm:"default:false" json:"face_auth_enabled"`
	ClientProfile      ClientProfiles `gorm:"foreignKey:UserID;references:UserID"`

	ClientMembership *membershipsdomain.ClientMembership `gorm:"foreignKey:UserID" json:"client_membership,omitempty"`

	RoleID uuid.UUID `gorm:"type:uuid;not null" json:"role_id"`
	Role   Roles     `gorm:"foreignKey:RoleID;references:RoleID" json:"role"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty" swaggertype:"primitive,string"`
}

type ClientProfiles struct {
	UserID    uuid.UUID          `gorm:"type:uuid;primaryKey" json:"user_id"`
	QRCode    string             `gorm:"type:text" json:"qr_code"`
	Scoring   int                `gorm:"type:integer;default:0" json:"scoring"`
	Category  ClientCategoryEnum `gorm:"type:client_category;not null;default:'New'" json:"category"`
	CreatedAt time.Time          `json:"created_at"`
	UpdatedAt time.Time          `json:"updated_at"`
	DeletedAt gorm.DeletedAt     `gorm:"index" json:"deleted_at,omitempty" swaggertype:"primitive,string"`
}

type UserInvitations struct {
	Token  string `gorm:"type:varchar(255);unique;not null" json:"token"`
	UserID uuid.UUID
	Users  Users     `gorm:"foreignKey:UserID" json:"user"`
	Expiry time.Time `gorm:"expiry"`
}

type PasswordResetToken struct {
	Token  string `gorm:"type:varchar(255);unique;not null" json:"token"`
	UserID uuid.UUID
	Users  Users     `gorm:"foreignKey:UserID" json:"user"`
	Expiry time.Time `gorm:"expiry"`
}

func (u *Users) HasActiveMembership() bool {
	if u.ClientMembership == nil {
		return false
	}
	return u.ClientMembership.Status == membershipsdomain.StatusActive
}
