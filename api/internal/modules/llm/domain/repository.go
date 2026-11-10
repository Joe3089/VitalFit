package llmdomain

import (
	"context"

	"github.com/google/uuid"
	"github.com/vitalfit/api/pkg/pagination"
)

type LLMRepository interface {
	GetActiveConversation(ctx context.Context, userID uuid.UUID) (*Conversation, error)
	CreateConversation(ctx context.Context, userID uuid.UUID) (*Conversation, error)
	SaveMessage(ctx context.Context, msg *Message) error
	GetConversationHistory(ctx context.Context, convoID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]Message, int64, error)
	DeactivateConversation(ctx context.Context, convoID uuid.UUID) error
}
