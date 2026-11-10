package policiesdomain

import (
	"errors"
	"strconv"
	"time"

	"github.com/google/uuid"
)

const (
	DataTypeInteger    = "INTEGER"
	DataTypeDecimal    = "DECIMAL"
	DataTypePercentage = "PERCENTAGE"
	DataTypeBoolean    = "BOOLEAN"
	DataTypeString     = "STRING"
	DataTypeCSV        = "CSV_LIST"
)

type CommercialPolicy struct {
	ID uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`

	PolicyKey string `gorm:"type:varchar(100);uniqueIndex;not null" json:"policy_key"`

	DisplayName string `gorm:"type:varchar(150);not null" json:"display_name"`
	Description string `gorm:"type:text" json:"description"`

	Value string `gorm:"type:text;not null" json:"value"`

	DataType string `gorm:"type:varchar(50);not null" json:"data_type"`

	MinLimit *float64 `gorm:"type:decimal(10,2)" json:"min_limit"`
	MaxLimit *float64 `gorm:"type:decimal(10,2)" json:"max_limit"`

	IsActive bool `gorm:"default:true" json:"is_active"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (CommercialPolicy) TableName() string {
	return "commercial_policies"
}

func (p *CommercialPolicy) ParseValue() (interface{}, error) {
	switch p.DataType {
	case DataTypeInteger:
		return strconv.Atoi(p.Value)
	case DataTypeDecimal, DataTypePercentage:
		return strconv.ParseFloat(p.Value, 64)
	case DataTypeBoolean:
		return strconv.ParseBool(p.Value)
	case DataTypeString, DataTypeCSV:
		return p.Value, nil
	default:
		return nil, errors.New("unknown data type")
	}
}

func (p *CommercialPolicy) GetInt() (int, error) {
	if p.DataType != DataTypeInteger {
		return 0, errors.New("policy is not an integer")
	}
	return strconv.Atoi(p.Value)
}

func (p *CommercialPolicy) GetFloat() (float64, error) {
	if p.DataType != DataTypeDecimal && p.DataType != DataTypePercentage {
		return 0, errors.New("policy is not a float")
	}
	return strconv.ParseFloat(p.Value, 64)
}

func (p *CommercialPolicy) GetBool() (bool, error) {
	if p.DataType != DataTypeBoolean {
		return false, errors.New("policy is not a boolean")
	}
	return strconv.ParseBool(p.Value)
}
