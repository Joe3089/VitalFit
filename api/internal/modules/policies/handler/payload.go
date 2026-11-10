package policieshandler

type UpdatePolicyValue struct {
	Value string `json:"value"`
}

type PolicyResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Value       string `json:"value"`
	Category    string `json:"category"`
	Active      bool   `json:"active"`
	DataType    string `json:"data_type"`
}
