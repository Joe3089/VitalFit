package authdomain

import (
	"time"

	"github.com/google/uuid"
)

type Roles struct {
	RoleID      uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"role_id"`
	Name        string    `gorm:"type:varchar(50);unique;not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Permissions []Permission `gorm:"many2many:role_permissions;joinForeignKey:role_id;joinReferences:permission_id" json:"permissions,omitempty"`
}

type Permission struct {
	PermissionID uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"permission_id"`
	Name         string    `gorm:"type:varchar(100);unique;not null" json:"name"`
	Description  string    `gorm:"type:text" json:"description"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (Permission) TableName() string {
	return "permissions"
}

type RolePermission struct {
	RoleID       uuid.UUID `gorm:"column:role_id;primaryKey"`
	PermissionID uuid.UUID `gorm:"column:permission_id;primaryKey"`
}

func (RolePermission) TableName() string {
	return "role_permissions"
}
