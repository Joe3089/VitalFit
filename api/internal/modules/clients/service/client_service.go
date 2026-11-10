package clientsservice

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/google/uuid"
	clientsdomain "github.com/vitalfit/api/internal/modules/clients/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/internal/store"
)

type ClientService struct {
	store         store.Storage
	encryptionKey []byte
}

func NewClientService(store store.Storage, encryptionKey string) *ClientService {
	// Ensure encryption key is 32 bytes for AES-256
	key := []byte(encryptionKey)
	if len(key) < 32 {
		// Pad with zeros if too short
		key = append(key, make([]byte, 32-len(key))...)
	} else if len(key) > 32 {
		// Truncate if too long
		key = key[:32]
	}

	return &ClientService{
		store:         store,
		encryptionKey: key,
	}
}

// encrypt encrypts plaintext using AES-256-GCM
func (s *ClientService) encrypt(plaintext string) (string, error) {
	if plaintext == "" {
		return "", nil
	}

	block, err := aes.NewCipher(s.encryptionKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// decrypt decrypts ciphertext using AES-256-GCM
func (s *ClientService) decrypt(ciphertext string) (string, error) {
	if ciphertext == "" {
		return "", nil
	}

	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(s.encryptionKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	if len(data) < gcm.NonceSize() {
		return "", errors.New("malformed ciphertext")
	}

	nonce := data[:gcm.NonceSize()]
	ciphertextBytes := data[gcm.NonceSize():]
	plaintext, err := gcm.Open(nil, nonce, ciphertextBytes, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

// CreateMedicalInfo creates new medical information for a client
func (s *ClientService) CreateMedicalInfo(ctx context.Context, userID, modifiedBy uuid.UUID, userRole string, data *clientsdomain.MedicalInfoData, ipAddress, userAgent string) (*clientsdomain.ClientMedicalInfo, error) {
	// Check if medical info already exists
	existing, err := s.store.Client.GetMedicalInfoByUserID(ctx, userID)
	if err == nil && existing != nil {
		return nil, errors.New("medical information already exists for this user")
	}

	// Encrypt sensitive fields
	encryptedConditions, err := s.encrypt(data.MedicalConditions)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt medical conditions: %w", err)
	}

	encryptedRisks, err := s.encrypt(data.MedicalRisks)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt medical risks: %w", err)
	}

	encryptedWarnings, err := s.encrypt(data.Warnings)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt warnings: %w", err)
	}

	encryptedAllergies, err := s.encrypt(data.Allergies)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt allergies: %w", err)
	}

	encryptedMedications, err := s.encrypt(data.Medications)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt medications: %w", err)
	}

	encryptedEmergencyContact, err := s.encrypt(data.EmergencyContact)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt emergency contact: %w", err)
	}

	medicalInfo := &clientsdomain.ClientMedicalInfo{
		UserID:            userID,
		MedicalConditions: encryptedConditions,
		MedicalRisks:      encryptedRisks,
		Warnings:          encryptedWarnings,
		Allergies:         encryptedAllergies,
		Medications:       encryptedMedications,
		EmergencyContact:  encryptedEmergencyContact,
		BloodType:         data.BloodType,
		LastUpdatedBy:     modifiedBy,
	}

	if err := s.store.Client.CreateMedicalInfo(ctx, medicalInfo); err != nil {
		return nil, err
	}

	return medicalInfo, nil
}

// GetMedicalInfo retrieves and decrypts medical information
func (s *ClientService) GetMedicalInfo(ctx context.Context, userID, requestedBy uuid.UUID, userRole string, ipAddress, userAgent string) (*clientsdomain.MedicalInfoData, error) {
	medicalInfo, err := s.store.Client.GetMedicalInfoByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, shared_errors.ErrNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}

	// Decrypt sensitive fields
	decryptedConditions, err := s.decrypt(medicalInfo.MedicalConditions)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt medical conditions: %w", err)
	}

	decryptedRisks, err := s.decrypt(medicalInfo.MedicalRisks)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt medical risks: %w", err)
	}

	decryptedWarnings, err := s.decrypt(medicalInfo.Warnings)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt warnings: %w", err)
	}

	decryptedAllergies, err := s.decrypt(medicalInfo.Allergies)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt allergies: %w", err)
	}

	decryptedMedications, err := s.decrypt(medicalInfo.Medications)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt medications: %w", err)
	}

	decryptedEmergencyContact, err := s.decrypt(medicalInfo.EmergencyContact)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt emergency contact: %w", err)
	}

	return &clientsdomain.MedicalInfoData{
		MedicalConditions: decryptedConditions,
		MedicalRisks:      decryptedRisks,
		Warnings:          decryptedWarnings,
		Allergies:         decryptedAllergies,
		Medications:       decryptedMedications,
		EmergencyContact:  decryptedEmergencyContact,
		BloodType:         medicalInfo.BloodType,
	}, nil
}

// UpdateMedicalInfo updates existing medical information
func (s *ClientService) UpdateMedicalInfo(ctx context.Context, userID, modifiedBy uuid.UUID, userRole string, data *clientsdomain.MedicalInfoData, ipAddress, userAgent string) (*clientsdomain.ClientMedicalInfo, error) {
	// Check if medical info exists
	existing, err := s.store.Client.GetMedicalInfoByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, shared_errors.ErrNotFound) {
			return nil, shared_errors.ErrNotFound
		}
		return nil, err
	}

	// Encrypt and update fields
	if data.MedicalConditions != "" {
		encryptedConditions, err := s.encrypt(data.MedicalConditions)
		if err != nil {
			return nil, fmt.Errorf("failed to encrypt medical conditions: %w", err)
		}
		existing.MedicalConditions = encryptedConditions
	}

	if data.MedicalRisks != "" {
		encryptedRisks, err := s.encrypt(data.MedicalRisks)
		if err != nil {
			return nil, fmt.Errorf("failed to encrypt medical risks: %w", err)
		}
		existing.MedicalRisks = encryptedRisks
	}

	if data.Warnings != "" {
		encryptedWarnings, err := s.encrypt(data.Warnings)
		if err != nil {
			return nil, fmt.Errorf("failed to encrypt warnings: %w", err)
		}
		existing.Warnings = encryptedWarnings
	}

	if data.Allergies != "" {
		encryptedAllergies, err := s.encrypt(data.Allergies)
		if err != nil {
			return nil, fmt.Errorf("failed to encrypt allergies: %w", err)
		}
		existing.Allergies = encryptedAllergies
	}

	if data.Medications != "" {
		encryptedMedications, err := s.encrypt(data.Medications)
		if err != nil {
			return nil, fmt.Errorf("failed to encrypt medications: %w", err)
		}
		existing.Medications = encryptedMedications
	}

	if data.EmergencyContact != "" {
		encryptedEmergencyContact, err := s.encrypt(data.EmergencyContact)
		if err != nil {
			return nil, fmt.Errorf("failed to encrypt emergency contact: %w", err)
		}
		existing.EmergencyContact = encryptedEmergencyContact
	}

	if data.BloodType != "" {
		existing.BloodType = data.BloodType
	}

	existing.LastUpdatedBy = modifiedBy
	existing.UpdatedAt = time.Now()

	if err := s.store.Client.UpdateMedicalInfo(ctx, existing); err != nil {
		return nil, err
	}

	return existing, nil
}
