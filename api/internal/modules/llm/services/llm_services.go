package llmservices

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
	llmdomain "github.com/vitalfit/api/internal/modules/llm/domain"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/pkg/pagination"
	"go.uber.org/zap"
	"gorm.io/datatypes"
)

type LLMService struct {
	client *openai.Client
	store  store.Storage
	logger *zap.SugaredLogger
}

func NewLLMService(client *openai.Client, store store.Storage, logger *zap.SugaredLogger) *LLMService {
	return &LLMService{
		client: client,
		store:  store,
		logger: logger,
	}
}

func (s *LLMService) ProcessUserMessage(ctx context.Context, userID uuid.UUID, content string) (string, error) {
	convo, err := s.store.LLM.GetActiveConversation(ctx, userID)
	if err != nil {
		return "", fmt.Errorf("error searching for conversation: %v", err)
	}
	if convo == nil {
		convo, err = s.store.LLM.CreateConversation(ctx, userID)
		if err != nil {
			return "", fmt.Errorf("error creating conversation: %v", err)
		}
	}

	userMsg := &llmdomain.Message{
		ConversationID: convo.ConversationID,
		SenderRole:     llmdomain.RoleUser,
		Content:        content,
		CreatedAt:      time.Now(),
	}
	if err := s.store.LLM.SaveMessage(ctx, userMsg); err != nil {
		return "", err
	}

	fq := pagination.PaginatedFeedQuery{Limit: 20, Page: 1, Sort: "desc"}
	history, _, err := s.store.LLM.GetConversationHistory(ctx, convo.ConversationID, fq)
	if err != nil {
		return "", err
	}

	for i, j := 0, len(history)-1; i < j; i, j = i+1, j-1 {
		history[i], history[j] = history[j], history[i]
	}

	var openaiMsgs []openai.ChatCompletionMessage

	systemPrompt := fmt.Sprintf(`You are VitalBot, the expert assistant for VitalFit.
Your goal is to manage bookings and routines, making the user feel like they are talking to a human, not a database.
Current date and time: %s.

GOLDEN RULES (FOLLOW THEM OR FAIL):
1. **ZERO IDs TO USER:** NEVER ask the user for a UUID. NEVER show a UUID in your response. UUIDs are only for YOU to use in tools.
2. **SMART MAPPING:**
   - The user sees a simple numbered list (1, 2, 3...).
   - You see the UUIDs in the tool outputs (e.g., "[ID: 123...]").
   - IF the user selects "1", YOU MUST find the UUID for item #1 and use THAT UUID in the tool call.
   - NEVER send "1", "2", etc. as an ID to a tool.
   - If you are unsure which class it is, list the options again with simple numbers (1, 2, 3) and ask them to confirm the number.
3. **ERROR INTERPRETATION:**
   - If a tool fails (e.g., "class full"), explain it in natural language and offer alternatives. Do not say "Error executing tool".
4. **FORMAT:** Use emojis and clean lists. Do not use technical Markdown (like code blocks) for class lists.
5. **CONTEXT ASSUMPTION:** If you already know the branch from previous messages, do not ask for it again.
6. **LANGUAGE:** Always respond in the same language the user is speaking. If the user speaks English, respond in English. If Spanish, respond in Spanish.

Your final goal: The user books or cancels without knowing what an ID is.`, time.Now().Format("2006-01-02 15:04"))

	openaiMsgs = append(openaiMsgs, openai.ChatCompletionMessage{
		Role:    openai.ChatMessageRoleSystem,
		Content: systemPrompt,
	})

	for _, msg := range history {
		role := openai.ChatMessageRoleUser
		if msg.SenderRole == llmdomain.RoleAssistant {
			role = openai.ChatMessageRoleAssistant
		}

		openaiMsgs = append(openaiMsgs, openai.ChatCompletionMessage{
			Role:    role,
			Content: msg.Content,
		})
	}

	resp, err := s.client.CreateChatCompletion(
		ctx,
		openai.ChatCompletionRequest{
			Model:    openai.GPT4oMini,
			Messages: openaiMsgs,
			Tools:    tools,
		},
	)
	if err != nil {
		s.logger.Errorw("Error calling OpenAI", "error", err)
		return "Lo siento, estoy teniendo problemas de conexión. Intenta más tarde.", nil
	}

	msg := resp.Choices[0].Message

	for i := 0; i < 5 && len(msg.ToolCalls) > 0; i++ {
		openaiMsgs = append(openaiMsgs, msg)

		for _, toolCall := range msg.ToolCalls {
			if toolCall.Type == openai.ToolTypeFunction {
				toolOutput, err := s.callFunction(ctx, userID, toolCall.Function.Name, toolCall.Function.Arguments)
				if err != nil {
					toolOutput = fmt.Sprintf("Error executing tool: %v", err)
				}

				openaiMsgs = append(openaiMsgs, openai.ChatCompletionMessage{
					Role:       openai.ChatMessageRoleTool,
					Content:    toolOutput,
					ToolCallID: toolCall.ID,
				})
			}
		}

		resp, err = s.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
			Model:    openai.GPT4oMini,
			Messages: openaiMsgs,
			Tools:    tools,
		})
		if err != nil {
			s.logger.Errorw("Error calling OpenAI after tools", "error", err)
			return "Lo siento, hubo un error procesando la solicitud.", nil
		}
		msg = resp.Choices[0].Message
	}

	botContent := msg.Content

	botMsg := &llmdomain.Message{
		ConversationID: convo.ConversationID,
		SenderRole:     llmdomain.RoleAssistant,
		Content:        botContent,
		Metadata:       datatypes.JSON([]byte(`{}`)),
		CreatedAt:      time.Now(),
	}

	if err := s.store.LLM.SaveMessage(ctx, botMsg); err != nil {
		s.logger.Error("Error saving bot message", "error", err)
	}

	return botContent, nil
}

func (s *LLMService) GetChatHistory(ctx context.Context, userID uuid.UUID, fq pagination.PaginatedFeedQuery) ([]llmdomain.Message, int64, error) {
	convo, err := s.store.LLM.GetActiveConversation(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("error searching for active conversation: %v", err)
	}

	if convo == nil {
		return []llmdomain.Message{}, 0, nil
	}

	history, total, err := s.store.LLM.GetConversationHistory(ctx, convo.ConversationID, fq)
	if err != nil {
		return nil, 0, fmt.Errorf("error getting history: %v", err)
	}

	return history, total, nil
}

func (s *LLMService) ResetConversation(ctx context.Context, userID uuid.UUID) error {
	convo, err := s.store.LLM.GetActiveConversation(ctx, userID)
	if err != nil {
		return err
	}

	if convo == nil {
		return nil
	}

	if err := s.store.LLM.DeactivateConversation(ctx, convo.ConversationID); err != nil {
		return fmt.Errorf("error deactivating conversation: %v", err)
	}

	return nil
}
