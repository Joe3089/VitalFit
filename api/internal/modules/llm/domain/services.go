package llmdomain

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/pkg/pagination"
)

type LLMServiceInterface interface {
	ProcessUserMessage(ctx context.Context, userID uuid.UUID, content string) (string, error)
	GetChatHistory(ctx context.Context, userID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]Message, int64, error)
	ResetConversation(ctx context.Context, userID uuid.UUID) error
}
