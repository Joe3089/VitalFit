package mailer

import (
	"bytes"
	"errors"
	"fmt"
	"text/template"
	"time"

	gomail "gopkg.in/mail.v2"
)

type mailtrapClient struct {
	fromEmail     string
	apiKey        string
	sandboxApiKey string
}

func NewMailTrapClient(apiKey, fromEmail, sandboxApiKey string) (mailtrapClient, error) {
	if apiKey == "" && sandboxApiKey == "" {
		return mailtrapClient{}, errors.New("api key is required")
	}

	return mailtrapClient{
		fromEmail:     fromEmail,
		apiKey:        apiKey,
		sandboxApiKey: sandboxApiKey,
	}, nil
}
func (m mailtrapClient) Send(templateFile, username, email string, data any, isSandbox bool) (int, error) {
	// Template parsing and building
	tmpl, err := template.ParseFS(FS, "templates/"+templateFile)
	if err != nil {
		return -1, err
	}

	subject := new(bytes.Buffer)
	err = tmpl.ExecuteTemplate(subject, "subject", data)
	if err != nil {
		return -1, err
	}

	body := new(bytes.Buffer)
	err = tmpl.ExecuteTemplate(body, "body", data)
	if err != nil {
		return -1, err
	}

	message := gomail.NewMessage()
	message.SetHeader("From", m.fromEmail)
	message.SetHeader("To", email)
	message.SetHeader("Subject", subject.String())
	message.AddAlternative("text/html", body.String())

	dialer := gomail.NewDialer("live.smtp.mailtrap.io", 587, "api", m.apiKey)
	var retryErr error
	// Bucle de reintentos
	for i := 0; i < maxRetries; i++ {
		// En mailtrap el cliente es el dialer, y el envío es la función DialAndSend
		retryErr = dialer.DialAndSend(message)

		if retryErr == nil {
			// Si no hay error, el envío fue exitoso.
			// Asumo 200 como código de éxito ya que gomail no lo retorna directamente.
			return 200, nil
		}

		// Si hay un error, esperamos antes de reintentar (exponential backoff)
		// Por ejemplo: baseDelay, 2*baseDelay, 3*baseDelay, etc.
		if i < maxRetries-1 {
			time.Sleep(time.Second * time.Duration(i+1))
		}
	}

	// Si salimos del bucle, significa que fallaron todos los intentos.
	return -1, fmt.Errorf("failed to send email after %d attempts, last error: %w", maxRetries, retryErr)
}
