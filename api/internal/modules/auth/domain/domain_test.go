package authdomain_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
)

func TestPassword(t *testing.T) {
	t.Run("Set and Matches", func(t *testing.T) {
		var p authdomain.Password
		passwordText := "my-secure-password-123"

		// 1. Test Set
		err := p.Set(passwordText)
		assert.NoError(t, err, "Setting password should not produce an error")

		// 2. Test Matches (Success)
		match, err := p.Matches(passwordText)
		assert.NoError(t, err, "Matching correct password should not produce an error")
		assert.True(t, match, "Correct password should match")

		// 3. Test Matches (Failure)
		wrongPassword := "wrong-password"
		match, err = p.Matches(wrongPassword)
		assert.NoError(t, err, "Matching incorrect password should not produce an error")
		assert.False(t, match, "Incorrect password should not match")
	})
}
