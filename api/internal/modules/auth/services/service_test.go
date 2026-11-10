package authservices_test

import (
	"context"
	"net/http"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vitalfit/api/config"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	authmocks "github.com/vitalfit/api/internal/modules/auth/mocks"
	authservices "github.com/vitalfit/api/internal/modules/auth/services"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/internal/store"
	mailermocks "github.com/vitalfit/api/pkg/mailer/mocks"
	"github.com/vitalfit/api/pkg/pagination"
)

func setup(t *testing.T) (*authservices.AuthService, *authservices.UserService, *authmocks.UserStoreMock, *authmocks.RoleStoreMock, *authmocks.SessionStoreMock, *mailermocks.MockMailer) {
	t.Helper()

	mockStore := store.NewMockStore()
	userStoreMock := mockStore.Users.(*authmocks.UserStoreMock)
	roleStoreMock := mockStore.Roles.(*authmocks.RoleStoreMock)

	sessionStoreMock := &authmocks.SessionStoreMock{}
	mockStore.Session = sessionStoreMock

	cfg := config.LoadConfig()
	testAuth := &authmocks.TestAuthenticator{}
	mailer := &mailermocks.MockMailer{}

	authService := authservices.NewAuthServices(mockStore, *cfg, testAuth, mailer)
	userService := authservices.NewUserService(mockStore)

	return authService, userService, userStoreMock, roleStoreMock, sessionStoreMock, mailer
}

func TestAuthService(t *testing.T) {
	authService, _, userStoreMock, roleStoreMock, sessionStoreMock, mailerMock := setup(t)

	mockUser := &authdomain.Users{
		UserID:    uuid.New(),
		Email:     "test@example.com",
		FirstName: "Test",
	}

	t.Run("RegisterUserClient", func(t *testing.T) {
		roleStoreMock.On("GetByName", mock.Anything, "client").Return(&authdomain.Roles{RoleID: uuid.New()}, nil).Once()
		userStoreMock.On("CreateAndInvitate", mock.Anything, mockUser, "token", mock.AnythingOfType("time.Duration")).Return(nil).Once()

		err := authService.RegisterUserClient(context.Background(), mockUser, "token")
		assert.NoError(t, err)
		roleStoreMock.AssertExpectations(t)
		userStoreMock.AssertExpectations(t)
	})

	t.Run("RegisterUserStaff", func(t *testing.T) {
		roleStoreMock.On("GetByName", mock.Anything, "instructor").Return(&authdomain.Roles{RoleID: uuid.New()}, nil).Once()
		userStoreMock.On("CreateAndInvitate", mock.Anything, mockUser, "token", mock.AnythingOfType("time.Duration")).Return(nil).Once()

		err := authService.RegisterUserStaff(context.Background(), mockUser, "token", "instructor")
		assert.NoError(t, err)
		roleStoreMock.AssertExpectations(t)
		userStoreMock.AssertExpectations(t)
	})

	t.Run("MailSender", func(t *testing.T) {
		t.Run("success", func(t *testing.T) {
			mailerMock.On("Send", "template.html", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(http.StatusOK, nil).Once()
			status, err := authService.MailSender(context.Background(), mockUser, "key", "template.html")
			assert.NoError(t, err)
			assert.Equal(t, http.StatusOK, status)
			mailerMock.AssertExpectations(t)
		})

		t.Run("failure", func(t *testing.T) {
			mailerMock.On("Send", "template.html", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(http.StatusInternalServerError, assert.AnError).Once()
			status, err := authService.MailSender(context.Background(), mockUser, "key", "template.html")
			assert.Error(t, err)
			assert.Equal(t, http.StatusInternalServerError, status)
			mailerMock.AssertExpectations(t)
		})
	})

	t.Run("Delete", func(t *testing.T) {
		userStoreMock.On("Delete", mock.Anything, mockUser.UserID).Return(nil).Once()
		err := authService.Delete(context.Background(), mockUser.UserID)
		assert.NoError(t, err)
		userStoreMock.AssertExpectations(t)
	})

	t.Run("Activate", func(t *testing.T) {
		userStoreMock.On("Activate", mock.Anything, "valid-code").Return(nil).Once()
		err := authService.Activate(context.Background(), "valid-code")
		assert.NoError(t, err)
		userStoreMock.AssertExpectations(t)
	})

	t.Run("GetByEmail", func(t *testing.T) {
		userStoreMock.On("GetByEmail", mock.Anything, mockUser.Email).Return(mockUser, nil).Once()
		user, err := authService.GetByEmail(context.Background(), mockUser.Email)
		assert.NoError(t, err)
		assert.Equal(t, mockUser, user)
		userStoreMock.AssertExpectations(t)
	})

	t.Run("CreatePasswordResetToken", func(t *testing.T) {
		testKey := "some-hashed-key"

		t.Run("should create token successfully if user exists", func(t *testing.T) {
			userStoreMock.On("GetByEmail", mock.Anything, mockUser.Email).Return(mockUser, nil).Once()
			userStoreMock.On("CreatePasswordResetToken", mock.Anything, mockUser.UserID, testKey, mock.AnythingOfType("time.Duration")).Return(nil).Once()

			err := authService.CreatePasswordResetToken(context.Background(), mockUser.Email, testKey)

			assert.NoError(t, err)
			userStoreMock.AssertExpectations(t)
		})

		t.Run("should return error if user does not exist", func(t *testing.T) {
			nonExistentEmail := "notfound@example.com"
			userStoreMock.On("GetByEmail", mock.Anything, nonExistentEmail).Return(nil, shared_errors.ErrNotFound).Once()

			err := authService.CreatePasswordResetToken(context.Background(), nonExistentEmail, testKey)

			assert.Error(t, err)
			assert.Equal(t, shared_errors.ErrNotFound, err)
			userStoreMock.AssertExpectations(t)
		})

		t.Run("should return error if token creation in db fails", func(t *testing.T) {
			userStoreMock.On("GetByEmail", mock.Anything, mockUser.Email).Return(mockUser, nil).Once()
			userStoreMock.On("CreatePasswordResetToken", mock.Anything, mockUser.UserID, testKey, mock.AnythingOfType("time.Duration")).Return(assert.AnError).Once()

			err := authService.CreatePasswordResetToken(context.Background(), mockUser.Email, testKey)

			assert.Error(t, err)
			assert.Equal(t, assert.AnError, err)
			userStoreMock.AssertExpectations(t)
		})
	})

	t.Run("DeleteResetToken", func(t *testing.T) {
		userStoreMock.On("DeleteResetToken", mock.Anything, mockUser.UserID).Return(nil).Once()
		err := authService.DeleteResetToken(context.Background(), mockUser.UserID)
		assert.NoError(t, err)
		userStoreMock.AssertExpectations(t)
	})

	t.Run("GenerateToken", func(t *testing.T) {
		sessionStoreMock.On("Create", mock.Anything, mock.AnythingOfType("*authdomain.Session")).Return(nil).Once()
		token, _, err := authService.GenerateToken(context.Background(), mockUser, "test-agent", "127.0.0.1", "")
		assert.NoError(t, err)
		assert.NotEmpty(t, token)

		parsedToken, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
			return []byte("test"), nil
		})
		assert.NoError(t, err)
		claims, ok := parsedToken.Claims.(jwt.MapClaims)
		assert.True(t, ok)
		assert.Equal(t, mockUser.UserID.String(), claims["sub"])
	})

	t.Run("ValidateToken", func(t *testing.T) {
		sessionStoreMock.On("Create", mock.Anything, mock.AnythingOfType("*authdomain.Session")).Return(nil).Once()
		validToken, _, _ := authService.GenerateToken(context.Background(), mockUser, "test-agent", "127.0.0.1", "")

		parsedToken, err := authService.ValidateToken(validToken)
		assert.NoError(t, err)
		assert.True(t, parsedToken.Valid)

		_, err = authService.ValidateToken("invalid.token.string")
		assert.Error(t, err)
	})

	t.Run("ResetPassword", func(t *testing.T) {
		userStoreMock.On("ResetUserPassword", mock.Anything, "valid-key", mockUser).Return(nil).Once()
		err := authService.ResetPassword(context.Background(), "valid-key", mockUser)
		assert.NoError(t, err)
		userStoreMock.AssertExpectations(t)
	})

	t.Run("UpdateActivationCode", func(t *testing.T) {
		code := "new-hashed-code"
		userStoreMock.On("UpdateActivationCode", mock.Anything, mockUser.UserID, code, mock.AnythingOfType("time.Duration")).Return(nil).Once()

		err := authService.UpdateActivationCode(context.Background(), mockUser.UserID, code)
		assert.NoError(t, err)
		userStoreMock.AssertExpectations(t)
	})

	t.Run("UpgradePassword", func(t *testing.T) {
		userStoreMock.On("UpgradePassword", mock.Anything, mockUser).Return(nil).Once()

		err := authService.UpgradePassword(context.Background(), mockUser)
		assert.NoError(t, err)
		userStoreMock.AssertExpectations(t)
	})
}

func TestUserService(t *testing.T) {
	_, userService, userStoreMock, roleStoreMock, _, _ := setup(t)

	mockUser := &authdomain.Users{
		UserID:    uuid.New(),
		Email:     "test@example.com",
		FirstName: "Test",
	}

	t.Run("GetByEmail", func(t *testing.T) {
		t.Run("success", func(t *testing.T) {
			userStoreMock.On("GetByEmail", mock.Anything, mockUser.Email).Return(mockUser, nil).Once()
			user, err := userService.GetByEmail(context.Background(), mockUser.Email)
			assert.NoError(t, err)
			assert.Equal(t, mockUser, user)
			userStoreMock.AssertExpectations(t)
		})

		t.Run("not found", func(t *testing.T) {
			userStoreMock.On("GetByEmail", mock.Anything, "notfound@example.com").Return(nil, shared_errors.ErrNotFound).Once()
			_, err := userService.GetByEmail(context.Background(), "notfound@example.com")
			assert.ErrorIs(t, err, shared_errors.ErrNotFound)
			userStoreMock.AssertExpectations(t)
		})
	})

	t.Run("GetByID", func(t *testing.T) {
		t.Run("success", func(t *testing.T) {
			userStoreMock.On("GetByID", mock.Anything, mockUser.UserID).Return(mockUser, nil).Once()
			user, err := userService.GetByID(context.Background(), mockUser.UserID)
			assert.NoError(t, err)
			assert.Equal(t, mockUser, user)
			userStoreMock.AssertExpectations(t)
		})

		t.Run("not found", func(t *testing.T) {
			notFoundID := uuid.New()
			userStoreMock.On("GetByID", mock.Anything, notFoundID).Return(nil, shared_errors.ErrNotFound).Once()
			_, err := userService.GetByID(context.Background(), notFoundID)
			assert.ErrorIs(t, err, shared_errors.ErrNotFound)
			userStoreMock.AssertExpectations(t)
		})
	})

	t.Run("Update", func(t *testing.T) {
		t.Run("success", func(t *testing.T) {
			userToUpdate := &authdomain.Users{UserID: mockUser.UserID, FirstName: "Updated"}
			userStoreMock.On("Update", mock.Anything, userToUpdate).Return(nil).Once()
			err := userService.Update(context.Background(), userToUpdate)
			assert.NoError(t, err)
			userStoreMock.AssertExpectations(t)
		})

		t.Run("failure", func(t *testing.T) {
			userToUpdate := &authdomain.Users{UserID: mockUser.UserID, FirstName: "Updated"}
			userStoreMock.On("Update", mock.Anything, userToUpdate).Return(assert.AnError).Once()
			err := userService.Update(context.Background(), userToUpdate)
			assert.ErrorIs(t, err, assert.AnError)
			userStoreMock.AssertExpectations(t)
		})
	})

	t.Run("GetRoleByName", func(t *testing.T) {
		mockRole := &authdomain.Roles{
			Name: "admin",
			Permissions: []authdomain.Permission{
				{Name: "users:create"},
			},
		}

		t.Run("success", func(t *testing.T) {
			roleStoreMock.On("GetByName", mock.Anything, "admin").Return(mockRole, nil).Once()
			role, err := userService.GetRoleByName(context.Background(), "admin")
			assert.NoError(t, err)
			assert.Equal(t, mockRole, role)
			roleStoreMock.AssertExpectations(t)
		})

		t.Run("not found", func(t *testing.T) {
			roleStoreMock.On("GetByName", mock.Anything, "nonexistent").Return(nil, shared_errors.ErrNotFound).Once()
			_, err := userService.GetRoleByName(context.Background(), "nonexistent")
			assert.ErrorIs(t, err, shared_errors.ErrNotFound)
			roleStoreMock.AssertExpectations(t)
		})
	})

	t.Run("CreateRole", func(t *testing.T) {
		mockRole := &authdomain.Roles{Name: "new_role"}
		roleStoreMock.On("Create", mock.Anything, mockRole).Return(nil).Once()
		err := userService.CreateRole(context.Background(), mockRole)
		assert.NoError(t, err)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("GetRoleByID", func(t *testing.T) {
		mockRole := &authdomain.Roles{RoleID: uuid.New(), Name: "test_role"}
		roleStoreMock.On("GetRoleByID", mock.Anything, mockRole.RoleID).Return(mockRole, nil).Once()
		role, err := userService.GetRoleByID(context.Background(), mockRole.RoleID)
		assert.NoError(t, err)
		assert.Equal(t, mockRole, role)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("GetRoles", func(t *testing.T) {
		t.Run("success", func(t *testing.T) {
			mockRoles := []*authdomain.Roles{{Name: "admin"}, {Name: "client"}}
			fq := pagination.PaginatedFeedQuery{Limit: 10, Page: 1}
			roleStoreMock.On("GetRoles", mock.Anything, fq).Return(mockRoles, nil).Once()

			roles, err := userService.GetRoles(context.Background(), fq)

			assert.NoError(t, err)
			assert.Equal(t, mockRoles, roles)
			roleStoreMock.AssertExpectations(t)
		})
	})

	t.Run("UpdateRole", func(t *testing.T) {
		mockRole := &authdomain.Roles{RoleID: uuid.New(), Name: "updated_role"}
		roleStoreMock.On("Update", mock.Anything, mockRole).Return(nil).Once()
		err := userService.UpdateRole(context.Background(), mockRole)
		assert.NoError(t, err)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("DeleteRole", func(t *testing.T) {
		roleID := uuid.New()
		roleStoreMock.On("Delete", mock.Anything, roleID).Return(nil).Once()
		err := userService.DeleteRole(context.Background(), roleID)
		assert.NoError(t, err)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("GetPermissions", func(t *testing.T) {
		mockPermissions := []*authdomain.Permission{{Name: "perm1"}, {Name: "perm2"}}
		roleStoreMock.On("GetPermissions", mock.Anything).Return(mockPermissions, nil).Once()
		permissions, err := userService.GetPermissions(context.Background())
		assert.NoError(t, err)
		assert.Equal(t, mockPermissions, permissions)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("AssignRolePermission", func(t *testing.T) {
		roleID := uuid.New()
		permissionIDs := []uuid.UUID{uuid.New()}
		roleStoreMock.On("AssignRolePermission", mock.Anything, roleID, permissionIDs).Return(nil).Once()
		err := userService.AssignRolePermission(context.Background(), roleID, permissionIDs)
		assert.NoError(t, err)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("DeleteRolePermission", func(t *testing.T) {
		roleID := uuid.New()
		permissionIDs := []uuid.UUID{uuid.New()}
		roleStoreMock.On("DeleteRolePermission", mock.Anything, roleID, permissionIDs).Return(nil).Once()
		err := userService.DeleteRolePermission(context.Background(), roleID, permissionIDs)
		assert.NoError(t, err)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("RoleHasPermission", func(t *testing.T) {
		roleID := uuid.New()
		permissionName := "users:create"

		t.Run("has permission", func(t *testing.T) {
			roleStoreMock.On("RoleHasPermission", mock.Anything, roleID, permissionName).Return(true, nil).Once()
			has, err := userService.RoleHasPermission(context.Background(), roleID, permissionName)
			assert.NoError(t, err)
			assert.True(t, has)
			roleStoreMock.AssertExpectations(t)
		})

		t.Run("does not have permission", func(t *testing.T) {
			roleStoreMock.On("RoleHasPermission", mock.Anything, roleID, permissionName).Return(false, nil).Once()
			has, err := userService.RoleHasPermission(context.Background(), roleID, permissionName)
			assert.NoError(t, err)
			assert.False(t, has)
			roleStoreMock.AssertExpectations(t)
		})
	})

	t.Run("GetClients", func(t *testing.T) {
		t.Run("success", func(t *testing.T) {
			mockClients := []*authdomain.Users{{UserID: uuid.New(), FirstName: "Client"}}
			total := 1
			fq := pagination.PaginatedFeedQuery{Limit: 10, Page: 1}
			userStoreMock.On("GetClients", mock.Anything, fq).Return(mockClients, total, nil).Once()

			clients, count, err := userService.GetClients(context.Background(), fq)
			assert.NoError(t, err)
			assert.Equal(t, mockClients, clients)
			assert.Equal(t, int64(total), count)
			userStoreMock.AssertExpectations(t)
		})

		t.Run("failure", func(t *testing.T) {
			fq := pagination.PaginatedFeedQuery{Limit: 10, Page: 1}
			userStoreMock.On("GetClients", mock.Anything, fq).Return(nil, 0, assert.AnError).Once()
			_, _, err := userService.GetClients(context.Background(), fq)
			assert.Error(t, err)
			userStoreMock.AssertExpectations(t)
		})
	})

	t.Run("UpdateClient", func(t *testing.T) {
		userToUpdate := &authdomain.Users{UserID: mockUser.UserID, FirstName: "Updated Client"}
		userStoreMock.On("UpdateUserClient", mock.Anything, userToUpdate).Return(nil).Once()

		err := userService.UpdateClient(context.Background(), userToUpdate)
		assert.NoError(t, err)
		userStoreMock.AssertExpectations(t)
	})

	t.Run("UpdateStaff", func(t *testing.T) {
		userToUpdate := &authdomain.Users{UserID: mockUser.UserID, FirstName: "Updated Staff"}
		roleName := "instructor"
		mockRole := &authdomain.Roles{RoleID: uuid.New(), Name: roleName}

		t.Run("success", func(t *testing.T) {
			roleStoreMock.On("GetByName", mock.Anything, roleName).Return(mockRole, nil).Once()
			userStoreMock.On("UpdateUserStaff", mock.Anything, mock.MatchedBy(func(u *authdomain.Users) bool {
				return u.UserID == userToUpdate.UserID && u.RoleID == mockRole.RoleID
			})).Return(nil).Once()

			err := userService.UpdateStaff(context.Background(), userToUpdate, roleName)
			assert.NoError(t, err)
			roleStoreMock.AssertExpectations(t)
			userStoreMock.AssertExpectations(t)
		})

		t.Run("role not found", func(t *testing.T) {
			roleStoreMock.On("GetByName", mock.Anything, "nonexistent").Return(nil, shared_errors.ErrNotFound).Once()
			err := userService.UpdateStaff(context.Background(), userToUpdate, "nonexistent")
			assert.ErrorIs(t, err, shared_errors.ErrNotFound)
			roleStoreMock.AssertExpectations(t)
		})
	})

	t.Run("BlockUser", func(t *testing.T) {
		justification := "Violation of terms"

		t.Run("success", func(t *testing.T) {
			userStoreMock.On("BlockUser", mock.Anything, mockUser.UserID, justification).Return(nil).Once()
			err := userService.BlockUser(context.Background(), mockUser.UserID, justification)
			assert.NoError(t, err)
			userStoreMock.AssertExpectations(t)
		})

		t.Run("not found", func(t *testing.T) {
			userStoreMock.On("BlockUser", mock.Anything, mockUser.UserID, justification).Return(shared_errors.ErrNotFound).Once()
			err := userService.BlockUser(context.Background(), mockUser.UserID, justification)
			assert.ErrorIs(t, err, shared_errors.ErrNotFound)
			userStoreMock.AssertExpectations(t)
		})
	})

	t.Run("UnblockUser", func(t *testing.T) {
		t.Run("success", func(t *testing.T) {
			userStoreMock.On("UnblockUser", mock.Anything, mockUser.UserID).Return(nil).Once()
			err := userService.UnblockUser(context.Background(), mockUser.UserID)
			assert.NoError(t, err)
			userStoreMock.AssertExpectations(t)
		})

		t.Run("not found", func(t *testing.T) {
			userStoreMock.On("UnblockUser", mock.Anything, mockUser.UserID).Return(shared_errors.ErrNotFound).Once()
			err := userService.UnblockUser(context.Background(), mockUser.UserID)
			assert.ErrorIs(t, err, shared_errors.ErrNotFound)
			userStoreMock.AssertExpectations(t)
		})
	})
}

func TestJWTAuthenticator(t *testing.T) {
	authenticator := authservices.NewJWTAuthenticator("my-super-secret", "my-app", "my-app")

	claims := jwt.MapClaims{
		"sub": "12345",
		"exp": time.Now().Add(time.Hour).Unix(),
		"iat": time.Now().Unix(),
		"nbf": time.Now().Unix(),
		"iss": "my-app",
		"aud": "my-app",
	}

	t.Run("GenerateToken", func(t *testing.T) {
		tokenString, err := authenticator.GenerateToken(claims)
		assert.NoError(t, err)
		assert.NotEmpty(t, tokenString)
	})

	t.Run("ValidateToken", func(t *testing.T) {
		t.Run("valid token", func(t *testing.T) {
			tokenString, _ := authenticator.GenerateToken(claims)
			token, err := authenticator.ValidateToken(tokenString)
			assert.NoError(t, err)
			assert.True(t, token.Valid)
		})

		t.Run("invalid token - bad signature", func(t *testing.T) {
			otherAuthenticator := authservices.NewJWTAuthenticator("different-secret", "my-app", "my-app")
			tokenString, _ := otherAuthenticator.GenerateToken(claims)

			_, err := authenticator.ValidateToken(tokenString)
			assert.Error(t, err)
			assert.ErrorContains(t, err, "signature is invalid")
		})
	})
}
