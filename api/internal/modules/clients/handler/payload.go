package clientshandler

// CreateMedicalInfoPayload represents the request payload for creating medical information
type CreateMedicalInfoPayload struct {
	MedicalConditions string `json:"medical_conditions,omitempty" example:"Diabetes Type 2, Hypertension"`
	MedicalRisks      string `json:"medical_risks,omitempty" example:"High blood pressure, family history of heart disease"`
	Warnings          string `json:"warnings,omitempty" example:"Avoid high-intensity exercises"`
	Allergies         string `json:"allergies,omitempty" example:"Penicillin, Peanuts"`
	Medications       string `json:"medications,omitempty" example:"Metformin 500mg daily"`
	EmergencyContact  string `json:"emergency_contact,omitempty" example:"Jane Doe - +1234567890 (Wife)"`
	BloodType         string `json:"blood_type,omitempty" example:"O+"`
}

// UpdateMedicalInfoPayload represents the request payload for updating medical information
type UpdateMedicalInfoPayload struct {
	MedicalConditions string `json:"medical_conditions,omitempty" example:"Diabetes Type 2, Hypertension"`
	MedicalRisks      string `json:"medical_risks,omitempty" example:"High blood pressure, family history of heart disease"`
	Warnings          string `json:"warnings,omitempty" example:"Avoid high-intensity exercises"`
	Allergies         string `json:"allergies,omitempty" example:"Penicillin, Peanuts"`
	Medications       string `json:"medications,omitempty" example:"Metformin 500mg daily"`
	EmergencyContact  string `json:"emergency_contact,omitempty" example:"Jane Doe - +1234567890 (Wife)"`
	BloodType         string `json:"blood_type,omitempty" example:"O+"`
}

// MedicalInfoResponse represents the response for medical information
type MedicalInfoResponse struct {
	MedicalConditions string `json:"medical_conditions,omitempty"`
	MedicalRisks      string `json:"medical_risks,omitempty"`
	Warnings          string `json:"warnings,omitempty"`
	Allergies         string `json:"allergies,omitempty"`
	Medications       string `json:"medications,omitempty"`
	EmergencyContact  string `json:"emergency_contact,omitempty"`
	BloodType         string `json:"blood_type,omitempty"`
}
