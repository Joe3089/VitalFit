package branchdomain

import (
	"github.com/google/uuid"
)

type Countries struct {
	CountryID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	Name      string    `gorm:"type:varchar(100);not null;unique"`

	States []States `gorm:"foreignKey:CountryID"`
}
type States struct {
	StateID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	Name    string    `gorm:"type:varchar(100);not null"`

	CountryID uuid.UUID `gorm:"type:uuid;not null;index:idx_states_country_id"`
	Country   Countries `gorm:"constraint:OnDelete:CASCADE"`
}
