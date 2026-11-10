package billingdomain

import (
	"database/sql"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	branchdomain "github.com/vitalfit/api/internal/modules/branches/domain"
	combosdomain "github.com/vitalfit/api/internal/modules/combos/domain"
	membershipsdomain "github.com/vitalfit/api/internal/modules/memberships/domain"
	productsdomain "github.com/vitalfit/api/internal/modules/products/domain"
	"gorm.io/gorm"
)

type InvoiceStatus string

const (
	InvoiceStatusPaid    InvoiceStatus = "Paid"
	InvoiceStatusUnpaid  InvoiceStatus = "Unpaid"
	InvoiceStatusVoid    InvoiceStatus = "Void"
	InvoiceStatusOverdue InvoiceStatus = "Overdue"
)

type PaymentStatus string

const (
	PaymentStatusCompleted PaymentStatus = "Completed"
	PaymentStatusFailed    PaymentStatus = "Failed"
	PaymentStatusRefunded  PaymentStatus = "Refunded"
	PaymentStatusPending   PaymentStatus = "Pending"
)

type RefundStatus string

const (
	RefundStatusPending   RefundStatus = "Pending"
	RefundStatusProcessed RefundStatus = "Processed"
	RefundStatusFailed    RefundStatus = "Failed"
)

type Invoice struct {
	InvoiceID uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"invoice_id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	BranchID  uuid.UUID `gorm:"type:uuid;index" json:"branch_id"`

	DocumentTypeID uuid.UUID `gorm:"type:uuid;not null" json:"document_type_id"`
	InvoiceNumber  string    `gorm:"type:varchar(50);not null;unique" json:"invoice_number"`
	IssueDate      time.Time `gorm:"type:date;not null" json:"issue_date"`
	DueDate        time.Time `gorm:"type:date;not null" json:"due_date"`

	SubTotal decimal.Decimal `gorm:"type:decimal(10,2);not null;default:0" json:"sub_total"`

	Tax         decimal.Decimal `gorm:"type:decimal(10,2);default:0" json:"tax"`
	TotalAmount decimal.Decimal `gorm:"type:decimal(10,2);not null;default:0" json:"total_amount"`

	Status    InvoiceStatus  `gorm:"type:invoice_status;not null;index" json:"status"`
	CreatedAt time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Asociaciones
	User         authdomain.Users    `gorm:"foreignKey:UserID;references:UserID"`
	Branch       branchdomain.Branch `gorm:"foreignKey:BranchID"`
	DocumentType FiscalDocumentType  `gorm:"foreignKey:DocumentTypeID"`

	InvoiceItems []InvoiceItem `gorm:"foreignKey:InvoiceID" json:"invoice_items,omitempty"`
	Payments     []Payment     `gorm:"foreignKey:InvoiceID" json:"payments,omitempty"`
}

func (Invoice) TableName() string {
	return "invoices"
}

func (i *Invoice) CalculateTotals() {
	zero := decimal.NewFromInt(0)

	i.SubTotal = zero
	i.Tax = zero
	i.TotalAmount = zero

	for index := range i.InvoiceItems {
		item := &i.InvoiceItems[index]

		quantityDec := decimal.NewFromInt(int64(item.Quantity))
		grossAmount := item.UnitPrice.Mul(quantityDec)

		item.Subtotal = grossAmount.Sub(item.DiscountApplied)

		if item.Subtotal.LessThan(zero) {
			item.Subtotal = zero
		}

		item.TaxAmount = item.Subtotal.Mul(item.TaxRate).Round(2)

		item.TotalLine = item.Subtotal.Add(item.TaxAmount)

		i.SubTotal = i.SubTotal.Add(item.Subtotal)
		i.Tax = i.Tax.Add(item.TaxAmount)
	}

	i.TotalAmount = i.SubTotal.Add(i.Tax)
}

func (i *Invoice) CalculateTotalPaid() decimal.Decimal {
	total := decimal.NewFromInt(0)
	for _, p := range i.Payments {
		if p.Status == PaymentStatusCompleted {
			total = total.Add(p.AmountBase)
		}
	}
	return total
}

func (i *Invoice) GetRemainingDebt() decimal.Decimal {
	paid := i.CalculateTotalPaid()
	return i.TotalAmount.Sub(paid)
}

type InvoiceItem struct {
	InvoiceItemID uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"invoice_item_id"`
	InvoiceID     uuid.UUID `gorm:"type:uuid;not null;index" json:"invoice_id"`

	Quantity  int             `gorm:"not null;default:1" json:"quantity"`
	UnitPrice decimal.Decimal `gorm:"type:decimal(10,2);not null" json:"unit_price"`

	//PromotionID     uuid.NullUUID   `gorm:"type:uuid" json:"promotion_id"`
	DiscountApplied decimal.Decimal `gorm:"type:decimal(10,2);default:0" json:"discount_applied"`

	TaxRate   decimal.Decimal `gorm:"type:decimal(5,4);not null;default:0" json:"tax_rate"`
	TaxAmount decimal.Decimal `gorm:"type:decimal(10,2);not null;default:0" json:"tax_amount"`

	Subtotal  decimal.Decimal `gorm:"type:decimal(10,2);not null;default:0" json:"subtotal"`
	TotalLine decimal.Decimal `gorm:"type:decimal(10,2);not null;default:0" json:"total_line"`

	MembershipTypeID uuid.NullUUID `gorm:"type:uuid" json:"membership_type_id"`
	ServiceID        uuid.NullUUID `gorm:"type:uuid" json:"service_id"`
	PackageID        uuid.NullUUID `gorm:"type:uuid" json:"package_id"`

	Invoice        Invoice                          `gorm:"foreignKey:InvoiceID"`
	MembershipType membershipsdomain.MembershipType `gorm:"foreignKey:MembershipTypeID"`
	Service        productsdomain.Service           `gorm:"foreignKey:ServiceID"`
	Package        combosdomain.Package             `gorm:"foreignKey:PackageID"`
}

func (InvoiceItem) TableName() string {
	return "invoice_items"
}

type Payment struct {
	PaymentID   uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"payment_id"`
	InvoiceID   uuid.UUID `gorm:"type:uuid;not null;index" json:"invoice_id"`
	PaymentDate time.Time `gorm:"type:timestamptz;not null" json:"payment_date"`

	AmountPaid   decimal.Decimal `gorm:"type:decimal(10,2);not null" json:"amount_paid"`
	CurrencyPaid string          `gorm:"type:varchar(3);not null" json:"currency_paid"`

	AmountBase   decimal.Decimal `gorm:"type:decimal(10,2);not null" json:"amount_base"`
	CurrencyBase string          `gorm:"type:varchar(3);not null;default:'USD'" json:"currency_base"`
	ExchangeRate decimal.Decimal `gorm:"type:decimal(18,8);not null" json:"exchange_rate"`

	PaymentMethodID uuid.UUID      `gorm:"type:uuid;not null" json:"payment_method_id"`
	TransactionID   sql.NullString `gorm:"type:varchar(255)" json:"transaction_id"`
	ReceiptURL      sql.NullString `gorm:"type:varchar(255)" json:"receipt_url"`
	Status          PaymentStatus  `gorm:"type:payment_status;not null;index" json:"status"`
	CreatedAt       time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	Invoice       Invoice        `gorm:"foreignKey:InvoiceID"`
	PaymentMethod PaymentMethods `gorm:"foreignKey:PaymentMethodID"`

	Refunds []Refund `gorm:"foreignKey:PaymentID" json:"refunds,omitempty"`
}

func (Payment) TableName() string {
	return "payments"
}

type Refund struct {
	RefundID  uuid.UUID     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"refund_id"`
	PaymentID uuid.UUID     `gorm:"type:uuid;not null;index" json:"payment_id"`
	InvoiceID uuid.NullUUID `gorm:"type:uuid;index" json:"invoice_id"`
	Reason    string        `gorm:"type:varchar(255);not null" json:"reason"`

	AmountRefunded   decimal.Decimal `gorm:"type:decimal(10,2);not null" json:"amount_refunded"`
	CurrencyRefunded string          `gorm:"type:varchar(3);not null" json:"currency_refunded"`

	AmountBase   decimal.Decimal `gorm:"type:decimal(10,2);not null" json:"amount_base"`
	CurrencyBase string          `gorm:"type:varchar(3);not null;default:'USD'" json:"currency_base"`
	ExchangeRate decimal.Decimal `gorm:"type:decimal(18,8);not null" json:"exchange_rate"`

	RefundMethodID uuid.NullUUID  `gorm:"type:uuid" json:"refund_method_id"`
	TransactionID  sql.NullString `gorm:"type:varchar(255)" json:"transaction_id"`
	Status         RefundStatus   `gorm:"type:refund_status;not null;default:'Pending';index" json:"status"`
	CreatedAt      time.Time      `gorm:"autoCreateTime" json:"created_at"`
	ProcessedAt    sql.NullTime   `json:"processed_at"`

	Payment      Payment        `gorm:"foreignKey:PaymentID"`
	Invoice      Invoice        `gorm:"foreignKey:InvoiceID"`
	RefundMethod PaymentMethods `gorm:"foreignKey:MethodID"`
}

func (Refund) TableName() string {
	return "refunds"
}

var CountryNameToCode = map[string]string{
	// --- Latin America ---
	"VENEZUELA":          "VE",
	"ARGENTINA":          "AR",
	"BOLIVIA":            "BO",
	"BRAZIL":             "BR",
	"CHILE":              "CL",
	"COLOMBIA":           "CO",
	"COSTA RICA":         "CR",
	"CUBA":               "CU",
	"DOMINICAN REPUBLIC": "DO",
	"ECUADOR":            "EC",
	"EL SALVADOR":        "SV",
	"GUATEMALA":          "GT",
	"HONDURAS":           "HN",
	"MEXICO":             "MX",
	"NICARAGUA":          "NI",
	"PANAMA":             "PA",
	"PARAGUAY":           "PY",
	"PERU":               "PE",
	"URUGUAY":            "UY",

	// --- North America ---
	"CANADA":                   "CA",
	"UNITED STATES":            "US",
	"UNITED STATES OF AMERICA": "US",
	"USA":                      "US",

	// --- Europe ---
	"SPAIN":          "ES",
	"GERMANY":        "DE",
	"FRANCE":         "FR",
	"ITALY":          "IT",
	"PORTUGAL":       "PT",
	"NETHERLANDS":    "NL",
	"BELGIUM":        "BE",
	"AUSTRIA":        "AT",
	"SWITZERLAND":    "CH",
	"UNITED KINGDOM": "GB",
	"IRELAND":        "IE",
	"SWEDEN":         "SE",
	"NORWAY":         "NO",
	"DENMARK":        "DK",
	"FINLAND":        "FI",
	"HUNGARY":        "HU",
	"GREECE":         "GR",
	"POLAND":         "PL",
	"ROMANIA":        "RO",
	"CZECH REPUBLIC": "CZ",
	"UKRAINE":        "UA",
	"RUSSIA":         "RU",

	// --- Asia / Pacific ---
	"CHINA":       "CN",
	"JAPAN":       "JP",
	"INDIA":       "IN",
	"SOUTH KOREA": "KR",
	"AUSTRALIA":   "AU",
	"NEW ZEALAND": "NZ",
	"SINGAPORE":   "SG",
	"INDONESIA":   "ID",
	"THAILAND":    "TH",
	"VIETNAM":     "VN",
	"PHILIPPINES": "PH",
	"MALAYSIA":    "MY",

	// --- Middle East & Africa ---
	"ISRAEL":               "IL",
	"SAUDI ARABIA":         "SA",
	"UNITED ARAB EMIRATES": "AE",
	"TURKEY":               "TR",
	"SOUTH AFRICA":         "ZA",
	"EGYPT":                "EG",
	"MOROCCO":              "MA",
	"NIGERIA":              "NG",
}

var StandardTaxRates = map[string]float64{
	// --- Latinoamérica ---
	"VE": 0.16, // Venezuela (IVA)
	"AR": 0.21, // Argentina
	"BO": 0.13, // Bolivia
	"BR": 0.17, // Brasil (Promedio ICMS - Muy complejo por estado)
	"CL": 0.19, // Chile
	"CO": 0.19, // Colombia
	"CR": 0.13, // Costa Rica
	"CU": 0.10, // Cuba
	"DO": 0.18, // República Dominicana
	"EC": 0.15, // Ecuador (Subió a 15% en 2024 temporalmente, verificar)
	"SV": 0.13, // El Salvador
	"GT": 0.12, // Guatemala
	"HN": 0.15, // Honduras
	"MX": 0.16, // México (IVA)
	"NI": 0.15, // Nicaragua
	"PA": 0.07, // Panamá (ITBMS - De los más bajos)
	"PY": 0.10, // Paraguay
	"PE": 0.18, // Perú
	"UY": 0.22, // Uruguay (IVA Básico)

	// --- Norteamérica ---
	"CA": 0.05, // Canadá (Solo GST federal. PST varía por provincia)
	"US": 0.00, // USA (Sales Tax es estatal/local, varía de 0% a 10% según ZIP code)

	// --- Europa (Unión Europea & Otros) ---
	"ES": 0.21, // España
	"DE": 0.19, // Alemania
	"FR": 0.20, // Francia
	"IT": 0.22, // Italia
	"PT": 0.23, // Portugal
	"NL": 0.21, // Países Bajos
	"BE": 0.21, // Bélgica
	"AT": 0.20, // Austria
	"CH": 0.08, // Suiza (Muy bajo para Europa)
	"GB": 0.20, // Reino Unido
	"IE": 0.23, // Irlanda
	"SE": 0.25, // Suecia
	"NO": 0.25, // Noruega
	"DK": 0.25, // Dinamarca
	"FI": 0.24, // Finlandia
	"HU": 0.27, // Hungría (El más alto de la UE)
	"GR": 0.24, // Grecia
	"PL": 0.23, // Polonia
	"RO": 0.19, // Rumania
	"CZ": 0.21, // República Checa
	"UA": 0.20, // Ucrania
	"RU": 0.20, // Rusia

	// --- Asia / Pacífico ---
	"CN": 0.13, // China
	"JP": 0.10, // Japón
	"IN": 0.18, // India (GST Estándar)
	"KR": 0.10, // Corea del Sur
	"AU": 0.10, // Australia (GST)
	"NZ": 0.15, // Nueva Zelanda
	"SG": 0.09, // Singapur (Subió en 2024)
	"ID": 0.11, // Indonesia
	"TH": 0.07, // Tailandia
	"VN": 0.10, // Vietnam
	"PH": 0.12, // Filipinas
	"MY": 0.06, // Malasia (SST, varía)

	// --- Medio Oriente ---
	"IL": 0.17, // Israel
	"SA": 0.15, // Arabia Saudita
	"AE": 0.05, // Emiratos Árabes Unidos
	"TR": 0.20, // Turquía

	"ZA": 0.15, // Sudáfrica
	"EG": 0.14, // Egipto
	"MA": 0.20, // Marruecos
	"NG": 0.07, // Nigeria
}

func GetTaxRateByLocation(locationName string) decimal.Decimal {
	normalizedInput := strings.ToUpper(strings.TrimSpace(locationName))

	code, isName := CountryNameToCode[normalizedInput]

	if !isName {
		code = normalizedInput
	}

	rate, exists := StandardTaxRates[code]
	if !exists {
		return decimal.NewFromInt(0)
	}

	return decimal.NewFromFloat(rate)
}

//REDIS

const (
	LatestRatesKey        = "latest_rates"
	RatePrefix            = "rate"
	RateExpiration        = 3 * time.Minute
	LatestRatesExpiration = 2 * time.Hour
)

type ExchangeRates struct {
	Disclaimer string             `json:"disclaimer"`
	License    string             `json:"license"`
	Timestamp  int64              `json:"timestamp"`
	Base       string             `json:"base"`
	Rates      map[string]float64 `json:"rates"`
}
