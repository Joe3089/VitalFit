package otp

import (
	crand "crypto/rand"
	"encoding/base64"
	"fmt"
	"math/rand"
	"time"
)

const defaultAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func GenerateCode(length int) (string, error) {

	rand.NewSource(time.Now().UnixNano())

	code := make([]rune, length)
	alphabetRunes := []rune(defaultAlphabet)
	alphabetSize := len(alphabetRunes)

	if alphabetSize == 0 {
		return "", fmt.Errorf("alphabet cannot be empty")
	}

	for i := 0; i < length; i++ {
		randomIndex := rand.Intn(alphabetSize)
		code[i] = alphabetRunes[randomIndex]
	}

	return string(code), nil
}

func GenerateRandomString() (string, error) {
	b := make([]byte, 32)
	_, err := crand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}
