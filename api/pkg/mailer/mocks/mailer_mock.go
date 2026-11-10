package mailermocks

import "github.com/stretchr/testify/mock"

// MockMailer fake implementation for testing.
type MockMailer struct {
	mock.Mock
}

// Send implementa la interfaz mailer.Mailer.
func (m *MockMailer) Send(templateFile, username, email string, data any, isSandbox bool) (int, error) {
	// Ahora podemos usar m.Called() porque mock.Mock está embebido.
	args := m.Called(templateFile, username, email, data, isSandbox)
	return args.Int(0), args.Error(1)
}
