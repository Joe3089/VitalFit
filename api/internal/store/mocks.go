package store

import (
	auditmocks "github.com/vitalfit/api/internal/modules/audit/mocks"
	authmocks "github.com/vitalfit/api/internal/modules/auth/mocks"
)

func NewMockStore() Storage {
	return Storage{
		Users:   authmocks.NewMockUserStore(),
		Roles:   authmocks.NewMockRoleStore(),
		Audit:   auditmocks.NewMockAuditStore(),
		Session: authmocks.NewMockSessionStore(),
	}
}
