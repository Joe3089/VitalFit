package llmhandlers

type ChatRequest struct {
	Message string `json:"message"`
}

type ChatResponse struct {
	Response string `json:"response"`
}
