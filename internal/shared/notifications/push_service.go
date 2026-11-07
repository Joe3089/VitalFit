package notifications

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
	env "github.com/vitalfit/api/pkg/Env"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/option"
)

type PushService struct {
	client *messaging.Client
}

func NewMockPushService() *PushService {
	return &PushService{}
}

func NewPushService() (*PushService, error) {
	ctx := context.Background()

	credsBase64 := env.GetString("FIREBASE_CREDENTIALS_BASE64", "")
	if credsBase64 == "" {
		return nil, fmt.Errorf("FIREBASE_CREDENTIALS_BASE64 está vacía")
	}

	credsJSON, err := base64.StdEncoding.DecodeString(credsBase64)
	if err != nil {
		return nil, fmt.Errorf("error decodificando credenciales base64: %w", err)
	}
	creds, err := google.CredentialsFromJSON(ctx, credsJSON, "https://www.googleapis.com/auth/firebase.messaging")
	if err != nil {
		return nil, fmt.Errorf("error parseando credenciales de firebase: %w", err)
	}

	opt := option.WithCredentials(creds)

	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		return nil, fmt.Errorf("error inicializando firebase app: %w", err)
	}

	// 4. Obtener el cliente de mensajería
	client, err := app.Messaging(ctx)
	if err != nil {
		return nil, fmt.Errorf("error obteniendo cliente de mensajería: %w", err)
	}

	return &PushService{
		client: client,
	}, nil
}

func (s *PushService) SendPush(ctx context.Context, deviceToken string, title string, body string, data map[string]string) error {
	if s == nil || s.client == nil {
		return nil // push disabled (no Firebase credentials)
	}
	message := &messaging.Message{
		Notification: &messaging.Notification{
			Title: title,
			Body:  body,
		},
		Token: deviceToken,

		Data: data,
	}

	response, err := s.client.Send(ctx, message)
	if err != nil {
		return err
	}

	log.Println("Notification sent successfully. ID:", response)
	return nil
}

func (s *PushService) ConvertStructToDataMap(payload interface{}) (map[string]string, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	var temp map[string]interface{}
	if err := json.Unmarshal(data, &temp); err != nil {
		return nil, err
	}

	result := make(map[string]string)
	for k, v := range temp {
		if v == nil {
			continue
		}
		result[k] = fmt.Sprintf("%v", v)
	}

	return result, nil
}

func (s *PushService) ConvertSliceToDataMap(payload interface{}, key string) (map[string]string, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	return map[string]string{
		key: string(data),
	}, nil
}
