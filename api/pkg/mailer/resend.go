package mailer

import (
	"bytes"
	"errors"
	"fmt"
	"text/template"
	"time"

	"github.com/resend/resend-go/v2"
)

type resendClient struct {
	fromEmail string
	apiKey    string
}

func NewResendClient(apiKey, fromEmail string) (resendClient, error) {
	if apiKey == "" {
		return resendClient{}, errors.New("api key is required")
	}

	return resendClient{
		fromEmail: fromEmail,
		apiKey:    apiKey,
	}, nil

}

func (r resendClient) Send(templateFile string, username, email string, data any, isSandbox bool) (int, error) {
	// 1. Template parsing and building (Mantiene la misma lógica)
	tmpl, err := template.ParseFS(FS, "templates/"+templateFile)
	if err != nil {
		return -1, err
	}

	// Parsear el ASUNTO
	subject := new(bytes.Buffer)
	if err := tmpl.ExecuteTemplate(subject, "subject", data); err != nil {
		return -1, err
	}

	// Parsear el CUERPO HTML
	body := new(bytes.Buffer)
	if err := tmpl.ExecuteTemplate(body, "body", data); err != nil {
		return -1, err
	}

	client := resend.NewClient(r.apiKey)
	// 2. Construir los Parámetros de Resend
	params := &resend.SendEmailRequest{
		From:    r.fromEmail,      // Viene de la configuración de resendClient
		To:      []string{email},  // El destinatario
		Html:    body.String(),    // El cuerpo renderizado como HTML
		Subject: subject.String(), // El asunto renderizado
	}

	// Opcional: Si quieres gestionar diferentes environments de Mailtrap a Resend
	// Resend usa claves de API diferentes para entornos distintos, no un parámetro 'isSandbox' en la solicitud.
	// El parámetro 'isSandbox' aquí se mantiene por compatibilidad, pero no afecta a la llamada API de Resend.
	// Si necesitas sandboxing, usa una clave de API de Resend de prueba o un dominio de sandbox.

	var retryErr error
	// 3. Bucle de reintentos
	for i := 0; i < maxRetries; i++ {
		// La API de Resend requiere un Contexto.
		sent, err := client.Emails.Send(params)

		// Verifica si la llamada fue exitosa
		if err == nil && sent != nil && sent.Id != "" {
			// Éxito: Resend responde con un 200/202,
			// pero el SDK solo retorna 'sent' y 'nil' error en éxito.
			return 200, nil
		}

		// Si hay error (conexión, 4xx, 5xx), preparamos el reintento.
		retryErr = err

		// Esperamos antes de reintentar (exponential backoff)
		if i < maxRetries-1 {
			time.Sleep(time.Second * time.Duration(i+1))
		}
	}

	// 4. Si salimos del bucle, fallaron todos los intentos.
	return -1, fmt.Errorf("failed to send email after %d attempts, last error: %w", maxRetries, retryErr)
}
