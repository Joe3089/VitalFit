package authmocks

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type TestAuthenticator struct{}

const secret = "test"

var baseClaims = jwt.MapClaims{
	"aud": "test-aud",
	"iss": "test-aud",
	"exp": time.Now().Add(time.Hour).Unix(),
}

func (a *TestAuthenticator) GenerateToken(claims jwt.Claims) (string, error) {
	serviceClaims, ok := claims.(jwt.MapClaims)
	if !ok {
		return "", jwt.ErrInvalidKey
	}

	finalClaims := jwt.MapClaims{}

	for k, v := range baseClaims {
		finalClaims[k] = v
	}

	if sub, found := serviceClaims["sub"]; found {
		finalClaims["sub"] = sub
	} else {
		return "", jwt.ErrTokenInvalidClaims
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, finalClaims)
	tokenString, _ := token.SignedString([]byte(secret))
	return tokenString, nil
}

func (a *TestAuthenticator) ValidateToken(token string) (*jwt.Token, error) {
	return jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
}
