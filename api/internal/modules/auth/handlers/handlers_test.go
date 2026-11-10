package authhandlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vitalfit/api/config"
	"github.com/vitalfit/api/internal/app"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	authmocks "github.com/vitalfit/api/internal/modules/auth/mocks"
	authservices "github.com/vitalfit/api/internal/modules/auth/services"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	mailermocks "github.com/vitalfit/api/pkg/mailer/mocks"
)

func newTestUser(email, password string) *authdomain.Users {
	user := &authdomain.Users{
		UserID:    uuid.New(),
		Email:     email,
		FirstName: "Test",
		LastName:  "User",
	}
	err := user.PasswordHash.Set(password)
	if err != nil {
		panic(err)
	}
	return user
}

func newLoginPayload(email, password, context string) *bytes.Buffer {
	payload := map[string]string{
		"email":    email,
		"password": password,
		"context":  context,
	}
	body, _ := json.Marshal(payload)
	return bytes.NewBuffer(body)
}

func TestWhoAmI(t *testing.T) {
	gin.SetMode(gin.TestMode)

	testApp := app.NewTestApplication(t, config.LoadConfig())
	mux := testApp.Mount()

	mockUser := &authdomain.Users{
		UserID:    uuid.New(),
		Email:     "testuser@example.com",
		FirstName: "Test",
		LastName:  "User",
	}

	sessionStoreMock := testApp.Store.Session.(*authmocks.SessionStoreMock)
	sessionStoreMock.On("Create", mock.Anything, mock.Anything).Return(nil)

	testToken, _, err := testApp.Services.AuthServices.GenerateToken(context.Background(), mockUser, "test-agent", "127.0.0.1", "")
	if err != nil {
		t.Fatal(err)
	}

	t.Run("should not allow unauthenticated requests", func(t *testing.T) {
		req, err := http.NewRequest(http.MethodGet, "/v1/user/whoami", nil)
		if err != nil {
			t.Fatal(err)
		}
		rr := app.ExecuteRequest(req, mux)
		app.CheckResponseCode(t, http.StatusUnauthorized, rr.Code)
	})

	t.Run("should allow authenticated requests", func(t *testing.T) {

		userStoreMock, ok := testApp.Store.Users.(*authmocks.UserStoreMock)
		if !ok {
			t.Fatalf("Failed to cast store.Users to *authmocks.UserStoreMock")
		}

		userStoreMock.On("GetByID", mock.Anything, mockUser.UserID).Return(mockUser, nil).Once()

		req, err := http.NewRequest(http.MethodGet, "/v1/user/whoami", nil)
		if err != nil {
			t.Fatal(err)
		}

		req.Header.Set("Authorization", "Bearer "+testToken)

		rr := app.ExecuteRequest(req, mux)

		app.CheckResponseCode(t, http.StatusOK, rr.Code)

		userStoreMock.AssertExpectations(t)
	})
}

func TestLoginHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)

	testApp := app.NewTestApplication(t, config.LoadConfig())
	mux := testApp.Mount()

	userStoreMock, ok := testApp.Store.Users.(*authmocks.UserStoreMock)
	if !ok {
		t.Fatalf("Failed to cast store.Users to *authmocks.UserStoreMock")
	}

	testPassword := "password123"
	mockUser := newTestUser("login@example.com", testPassword)
	mockUser.IsValidated = true

	sessionStoreMock := testApp.Store.Session.(*authmocks.SessionStoreMock)
	sessionStoreMock.On("Create", mock.Anything, mock.Anything).Return(nil)

	t.Run("should fail with invalid credentials (wrong password)", func(t *testing.T) {
		userStoreMock.On("GetByEmail", mock.Anything, mockUser.Email).Return(mockUser, nil).Once()

		body := newLoginPayload(mockUser.Email, "wrongpassword", "web")
		req, _ := http.NewRequest(http.MethodPost, "/v1/auth/login", body)
		req.Header.Set("Content-Type", "application/json")

		rr := app.ExecuteRequest(req, mux)

		app.CheckResponseCode(t, http.StatusUnauthorized, rr.Code)
		userStoreMock.AssertExpectations(t)
	})

	t.Run("should succeed with valid credentials", func(t *testing.T) {
		userStoreMock.On("GetByEmail", mock.Anything, mockUser.Email).Return(mockUser, nil).Once()

		body := newLoginPayload(mockUser.Email, testPassword, "web")
		req, _ := http.NewRequest(http.MethodPost, "/v1/auth/login", body)
		req.Header.Set("Content-Type", "application/json")

		rr := app.ExecuteRequest(req, mux)

		app.CheckResponseCode(t, http.StatusOK, rr.Code)

		var responseBody map[string]string
		if err := json.Unmarshal(rr.Body.Bytes(), &responseBody); err != nil {
			t.Fatalf("Failed to parse response body: %v", err)
		}
		if _, exists := responseBody["token"]; !exists {
			t.Errorf("Expected response to contain a token, but it didn't")
		}

		userStoreMock.AssertExpectations(t)
	})

	t.Run("should fail if user is not activated", func(t *testing.T) {
		inactiveUser := newTestUser("inactive@example.com", testPassword)

		userStoreMock.On("GetByEmail", mock.Anything, inactiveUser.Email).Return(inactiveUser, nil).Once()

		body := newLoginPayload(inactiveUser.Email, testPassword, "web")
		req, _ := http.NewRequest(http.MethodPost, "/v1/auth/login", body)
		req.Header.Set("Content-Type", "application/json")

		rr := app.ExecuteRequest(req, mux)

		app.CheckResponseCode(t, http.StatusUnauthorized, rr.Code)
		userStoreMock.AssertExpectations(t)
	})

	t.Run("should fail when a client tries to log in to the dashboard", func(t *testing.T) {
		clientUser := newTestUser("client-login@example.com", testPassword)
		clientUser.IsValidated = true
		clientUser.Role = authdomain.Roles{Name: "client"}

		userStoreMock.On("GetByEmail", mock.Anything, clientUser.Email).Return(clientUser, nil).Once()

		body := newLoginPayload(clientUser.Email, testPassword, "dashboard")
		req, _ := http.NewRequest(http.MethodPost, "/v1/auth/login", body)
		req.Header.Set("Content-Type", "application/json")

		rr := app.ExecuteRequest(req, mux)

		app.CheckResponseCode(t, http.StatusForbidden, rr.Code)
		userStoreMock.AssertExpectations(t)

	})
}

func TestRegisterUserClientHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)

	testApp := app.NewTestApplication(t, config.LoadConfig())
	mux := testApp.Mount()

	userStoreMock := testApp.Store.Users.(*authmocks.UserStoreMock)
	roleStoreMock := testApp.Store.Roles.(*authmocks.RoleStoreMock)
	mailerMock := testApp.Services.AuthServices.(*authservices.AuthService).Mailer.(*mailermocks.MockMailer)

	t.Run("should register a new client successfully", func(t *testing.T) {

		mockRole := &authdomain.Roles{RoleID: uuid.New(), Name: "client"}
		roleStoreMock.On("GetByName", mock.Anything, "client").Return(mockRole, nil).Once()

		userStoreMock.On("CreateAndInvitate", mock.Anything, mock.AnythingOfType("*authdomain.Users"), mock.AnythingOfType("string"), mock.AnythingOfType("time.Duration")).Return(nil).Once()

		mailerMock.On("Send",
			mock.AnythingOfType("string"),
			mock.AnythingOfType("string"),
			mock.AnythingOfType("string"),
			mock.Anything,
			mock.AnythingOfType("bool"),
		).Return(http.StatusOK, nil).Once()

		payload := map[string]string{
			"first_name":        "New",
			"last_name":         "User",
			"email":             "newuser@example.com",
			"phone":             "123456789",
			"identity_document": "1234567890",
			"password":          "Password123!",
			"birth_date":        "2000-01-01",
			"gender":            "male",
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodPost, "/v1/auth/register", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		rr := app.ExecuteRequest(req, mux)

		app.CheckResponseCode(t, http.StatusCreated, rr.Code)

		userStoreMock.AssertExpectations(t)
		roleStoreMock.AssertExpectations(t)
		mailerMock.AssertExpectations(t)
	})

	t.Run("should fail with invalid payload", func(t *testing.T) {
		payload := map[string]string{"first_name": "Missing"}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodPost, "/v1/auth/register", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		rr := app.ExecuteRequest(req, mux)

		app.CheckResponseCode(t, http.StatusBadRequest, rr.Code)
	})

	t.Run("should fail with weak password", func(t *testing.T) {
		payload := map[string]string{
			"first_name":        "Weak",
			"last_name":         "Password",
			"email":             "weakpass@example.com",
			"phone":             "123456789",
			"identity_document": "1234567890",
			"password":          "password",
			"birth_date":        "2000-01-01",
			"gender":            "male",
		}
		body, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/v1/auth/register", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		rr := app.ExecuteRequest(req, mux)
		app.CheckResponseCode(t, http.StatusBadRequest, rr.Code)
	})
}

func TestActivateUserHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)
	testApp := app.NewTestApplication(t, config.LoadConfig())
	mux := testApp.Mount()
	userStoreMock := testApp.Store.Users.(*authmocks.UserStoreMock)

	t.Run("should activate user with a valid code", func(t *testing.T) {
		activationCode := "valid-code"
		userStoreMock.On("Activate", mock.Anything, activationCode).Return(nil).Once()

		payload := map[string]string{"code": activationCode}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodPut, "/v1/auth/activate", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		rr := app.ExecuteRequest(req, mux)

		app.CheckResponseCode(t, http.StatusNoContent, rr.Code)
		userStoreMock.AssertExpectations(t)
	})
}

func TestActivateStaffHanlder(t *testing.T) {
	gin.SetMode(gin.TestMode)
	testApp := app.NewTestApplication(t, config.LoadConfig())
	mux := testApp.Mount()
	userStoreMock := testApp.Store.Users.(*authmocks.UserStoreMock)

	t.Run("should activate staff user with a valid token and password", func(t *testing.T) {
		activationToken := "valid-staff-token"
		password := "NewPassword123!"
		userStoreMock.On("ActivateUserStaff", mock.Anything, activationToken, password).Return(nil).Once()

		payload := map[string]string{"password": password, "confirm_password": password}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodPut, "/v1/auth/activate/"+activationToken, bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		rr := app.ExecuteRequest(req, mux)

		app.CheckResponseCode(t, http.StatusNoContent, rr.Code)
		userStoreMock.AssertExpectations(t)
	})
}

func TestRegisterUserStaffHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)

	testApp := app.NewTestApplication(t, config.LoadConfig())
	mux := testApp.Mount()

	userStoreMock := testApp.Store.Users.(*authmocks.UserStoreMock)
	roleStoreMock := testApp.Store.Roles.(*authmocks.RoleStoreMock)
	mailerMock := testApp.Services.AuthServices.(*authservices.AuthService).Mailer.(*mailermocks.MockMailer)

	sessionStoreMock := testApp.Store.Session.(*authmocks.SessionStoreMock)
	sessionStoreMock.On("Create", mock.Anything, mock.Anything).Return(nil)

	adminUser := &authdomain.Users{
		UserID: uuid.New(),
		Email:  "admin@example.com",
		Role:   authdomain.Roles{RoleID: uuid.New(), Name: "super_admin"},
	}
	adminToken, _, _ := testApp.Services.AuthServices.GenerateToken(context.Background(), adminUser, "test-agent", "127.0.0.1", "")

	authorizedUser := &authdomain.Users{
		UserID: uuid.New(),
		Email:  "authorized@example.com",
		Role:   authdomain.Roles{RoleID: uuid.New(), Name: "branch_admin"},
	}
	authorizedToken, _, _ := testApp.Services.AuthServices.GenerateToken(context.Background(), authorizedUser, "test-agent", "127.0.0.1", "")

	// User without specific permission
	unauthorizedUser := &authdomain.Users{
		UserID: uuid.New(),
		Email:  "unauthorized@example.com",
		Role:   authdomain.Roles{RoleID: uuid.New(), Name: "instructor"},
	}
	unauthorizedToken, _, _ := testApp.Services.AuthServices.GenerateToken(context.Background(), unauthorizedUser, "test-agent", "127.0.0.1", "")

	t.Run("should fail when unauthenticated", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodPost, "/v1/auth/register-staff", nil)
		req.Header.Set("Content-Type", "application/json")
		rr := app.ExecuteRequest(req, mux)
		app.CheckResponseCode(t, http.StatusUnauthorized, rr.Code)
	})

	// t.Run("should fail when trying to register a client", func(t *testing.T) {
	// 	// The handler has a guard to prevent this. It shouldn't reach the services.
	// 	userStoreMock.On("GetByID", mock.Anything, adminUser.UserID).Return(adminUser, nil).Once()
	// 	// The middleware will check for 'users:create' permission. Since the user is super_admin, it will pass.
	// 	// No need to mock RoleHasPermission for super_admin

	// 	payload := map[string]string{
	// 		"first_name": "Client", "last_name": "User", "email": "shouldfail@example.com",
	// 		"phone": "111", "identity_document": "111", "password": "Password123!",
	// 		"birth_date": "2000-01-01", "gender": "male",
	// 		"role_name": "client", // Trying to register a client
	// 	}
	// 	body, _ := json.Marshal(payload)
	// 	req, _ := http.NewRequest(http.MethodPost, "/v1/auth/register-staff", bytes.NewBuffer(body))
	// 	req.Header.Set("Content-Type", "application/json")
	// 	req.Header.Set("Authorization", "Bearer "+adminToken)

	// 	rr := app.ExecuteRequest(req, mux)
	// 	app.CheckResponseCode(t, http.StatusBadRequest, rr.Code)

	// 	userStoreMock.AssertExpectations(t)
	// })

	t.Run("should fail when user does not have users:create permission", func(t *testing.T) {
		// Middleware checks
		userStoreMock.On("GetByID", mock.Anything, unauthorizedUser.UserID).Return(unauthorizedUser, nil).Once()
		roleStoreMock.On("RoleHasPermission", mock.Anything, unauthorizedUser.Role.RoleID, "users:create").Return(false, nil).Once()

		payload := map[string]string{"role_name": "instructor"}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodPost, "/v1/auth/register-staff", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+unauthorizedToken)

		rr := app.ExecuteRequest(req, mux)
		app.CheckResponseCode(t, http.StatusForbidden, rr.Code)

		userStoreMock.AssertExpectations(t)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("should succeed when user has users:create permission", func(t *testing.T) {
		// Middleware checks
		userStoreMock.On("GetByID", mock.Anything, authorizedUser.UserID).Return(authorizedUser, nil).Once()
		roleStoreMock.On("RoleHasPermission", mock.Anything, authorizedUser.Role.RoleID, "users:create").Return(true, nil).Once()

		// Service logic
		mockRole := &authdomain.Roles{RoleID: uuid.New(), Name: "instructor"}
		roleStoreMock.On("GetByName", mock.Anything, "instructor").Return(mockRole, nil).Once()
		userStoreMock.On("CreateAndInvitate", mock.Anything, mock.AnythingOfType("*authdomain.Users"), mock.AnythingOfType("string"), mock.AnythingOfType("time.Duration")).Return(nil).Once()
		mailerMock.On("Send", mock.AnythingOfType("string"), mock.AnythingOfType("string"), mock.AnythingOfType("string"), mock.Anything, mock.AnythingOfType("bool")).Return(http.StatusOK, nil).Once()

		payload := map[string]string{
			"first_name": "New", "last_name": "Instructor", "email": "new.instructor.perm@example.com",
			"phone": "987654321", "identity_document": "doc-instructor-perm", "password": "StaffPassword123!",
			"birth_date": "1995-01-01", "gender": "female", "role_name": "instructor",
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodPost, "/v1/auth/register-staff", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+authorizedToken)

		rr := app.ExecuteRequest(req, mux)
		app.CheckResponseCode(t, http.StatusCreated, rr.Code)
	})

	t.Run("should fail when branch_admin tries to register super_admin", func(t *testing.T) {
		// Middleware checks
		userStoreMock.On("GetByID", mock.Anything, authorizedUser.UserID).Return(authorizedUser, nil).Once()
		roleStoreMock.On("RoleHasPermission", mock.Anything, authorizedUser.Role.RoleID, "users:create").Return(true, nil).Once()

		payload := map[string]string{
			"first_name": "New", "last_name": "Admin", "email": "new.admin@example.com",
			"phone": "987654321", "identity_document": "doc-admin", "password": "StaffPassword123!",
			"birth_date": "1995-01-01", "gender": "female", "role_name": "super_admin",
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodPost, "/v1/auth/register-staff", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+authorizedToken)

		rr := app.ExecuteRequest(req, mux)
		app.CheckResponseCode(t, http.StatusForbidden, rr.Code)
	})

	staffRoles := []string{"instructor", "accountant", "recepcionist", "branch_admin", "super_admin"}

	for _, role := range staffRoles {
		t.Run("should succeed registering a "+role, func(t *testing.T) {
			// Middleware check
			userStoreMock.On("GetByID", mock.Anything, adminUser.UserID).Return(adminUser, nil).Once()
			// Service logic
			mockRole := &authdomain.Roles{RoleID: uuid.New(), Name: role}
			roleStoreMock.On("GetByName", mock.Anything, role).Return(mockRole, nil).Once()
			userStoreMock.On("CreateAndInvitate", mock.Anything, mock.AnythingOfType("*authdomain.Users"), mock.AnythingOfType("string"), mock.AnythingOfType("time.Duration")).Return(nil).Once()
			mailerMock.On("Send", mock.AnythingOfType("string"), mock.AnythingOfType("string"), mock.AnythingOfType("string"), mock.Anything, mock.AnythingOfType("bool")).Return(http.StatusOK, nil).Once()

			email := "new" + role + "@example.com"
			identityDoc := "doc-" + role

			payload := map[string]string{
				"first_name":        "New",
				"last_name":         role,
				"email":             email,
				"phone":             "987654321",
				"identity_document": identityDoc,
				"password":          "StaffPassword123!",
				"birth_date":        "1995-01-01",
				"gender":            "female",
				"role_name":         role,
			}
			body, _ := json.Marshal(payload)

			req, _ := http.NewRequest(http.MethodPost, "/v1/auth/register-staff", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer "+adminToken)

			rr := app.ExecuteRequest(req, mux)
			app.CheckResponseCode(t, http.StatusCreated, rr.Code)

			userStoreMock.AssertExpectations(t)
			roleStoreMock.AssertExpectations(t)
			mailerMock.AssertExpectations(t)
		})
	}
}

func TestAdminRoleRoutes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	testApp := app.NewTestApplication(t, config.LoadConfig())
	mux := testApp.Mount()

	userStoreMock := testApp.Store.Users.(*authmocks.UserStoreMock)
	roleStoreMock := testApp.Store.Roles.(*authmocks.RoleStoreMock)

	sessionStoreMock := testApp.Store.Session.(*authmocks.SessionStoreMock)
	sessionStoreMock.On("Create", mock.Anything, mock.Anything).Return(nil)

	// User with all role-management permissions
	adminUser := &authdomain.Users{
		UserID: uuid.New(),
		Email:  "roleadmin@example.com",
		Role:   authdomain.Roles{RoleID: uuid.New(), Name: "role_administrator"},
	}
	adminToken, _, _ := testApp.Services.AuthServices.GenerateToken(context.Background(), adminUser, "test-agent", "127.0.0.1", "")

	// User without permissions
	basicUser := &authdomain.Users{
		UserID: uuid.New(),
		Email:  "basic@example.com",
		Role:   authdomain.Roles{RoleID: uuid.New(), Name: "client"},
	}
	basicToken, _, _ := testApp.Services.AuthServices.GenerateToken(context.Background(), basicUser, "test-agent", "127.0.0.1", "")

	// Common setup for middleware checks
	setupAdminMiddleware := func() {
		userStoreMock.On("GetByID", mock.Anything, adminUser.UserID).Return(adminUser, nil).Once()
	}
	setupBasicMiddleware := func() {
		userStoreMock.On("GetByID", mock.Anything, basicUser.UserID).Return(basicUser, nil).Once()
	}

	t.Run("GetPermissions", func(t *testing.T) {
		t.Run("should succeed with permissions:list", func(t *testing.T) {
			setupAdminMiddleware()
			roleStoreMock.On("RoleHasPermission", mock.Anything, adminUser.Role.RoleID, "permissions:list").Return(true, nil).Once()
			mockPerms := []*authdomain.Permission{{Name: "perm1"}, {Name: "perm2"}}
			roleStoreMock.On("GetPermissions", mock.Anything).Return(mockPerms, nil).Once()

			req, _ := http.NewRequest(http.MethodGet, "/v1/admin/permissions", nil)
			req.Header.Set("Authorization", "Bearer "+adminToken)
			rr := app.ExecuteRequest(req, mux)

			assert.Equal(t, http.StatusOK, rr.Code)
			roleStoreMock.AssertExpectations(t)
		})

		t.Run("should fail without permissions:list", func(t *testing.T) {
			setupBasicMiddleware()
			roleStoreMock.On("RoleHasPermission", mock.Anything, basicUser.Role.RoleID, "permissions:list").Return(false, nil).Once()

			req, _ := http.NewRequest(http.MethodGet, "/v1/admin/permissions", nil)
			req.Header.Set("Authorization", "Bearer "+basicToken)
			rr := app.ExecuteRequest(req, mux)

			assert.Equal(t, http.StatusForbidden, rr.Code)
			roleStoreMock.AssertExpectations(t)
		})
	})

	t.Run("GetRoles", func(t *testing.T) {
		setupAdminMiddleware()
		roleStoreMock.On("RoleHasPermission", mock.Anything, adminUser.Role.RoleID, "roles:list").Return(true, nil).Once()
		roleStoreMock.On("GetRoles", mock.Anything, mock.AnythingOfType("pagination.PaginatedFeedQuery")).Return([]*authdomain.Roles{}, nil).Once()
		roleStoreMock.On("GetRolesFTotal", mock.Anything, mock.AnythingOfType("pagination.PaginatedFeedQuery")).Return(0, nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/v1/admin/roles", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rr := app.ExecuteRequest(req, mux)

		assert.Equal(t, http.StatusOK, rr.Code)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("CreateRole", func(t *testing.T) {
		setupAdminMiddleware()
		roleStoreMock.On("RoleHasPermission", mock.Anything, adminUser.Role.RoleID, "roles:create").Return(true, nil).Once()
		roleStoreMock.On("Create", mock.Anything, mock.AnythingOfType("*authdomain.Roles")).Return(nil).Once()

		permID := uuid.New().String()
		payload := map[string]interface{}{
			"name":        "new-test-role",
			"description": "A test role",
			"permissions": []string{permID},
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodPost, "/v1/admin/roles", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rr := app.ExecuteRequest(req, mux)

		assert.Equal(t, http.StatusCreated, rr.Code)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("UpdateRole", func(t *testing.T) {
		roleID := uuid.New()
		setupAdminMiddleware()
		roleStoreMock.On("RoleHasPermission", mock.Anything, adminUser.Role.RoleID, "roles:update").Return(true, nil).Once()
		mockExistingRole := &authdomain.Roles{RoleID: roleID, Name: "custom-role"}
		roleStoreMock.On("GetRoleByID", mock.Anything, roleID).Return(mockExistingRole, nil).Once()
		roleStoreMock.On("Update", mock.Anything, mock.AnythingOfType("*authdomain.Roles")).Return(nil).Once()

		payload := map[string]interface{}{
			"name":        "updated-test-role",
			"description": "An updated test role",
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodPut, "/v1/admin/roles/"+roleID.String(), bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rr := app.ExecuteRequest(req, mux)

		assert.Equal(t, http.StatusNoContent, rr.Code)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("UpdateRole_SystemRole_NameChange", func(t *testing.T) {
		roleID := uuid.New()
		setupAdminMiddleware()
		roleStoreMock.On("RoleHasPermission", mock.Anything, adminUser.Role.RoleID, "roles:update").Return(true, nil).Once()

		systemRole := &authdomain.Roles{RoleID: roleID, Name: "super_admin"}
		roleStoreMock.On("GetRoleByID", mock.Anything, roleID).Return(systemRole, nil).Once()

		payload := map[string]interface{}{
			"name":        "new-admin-name",
			"description": "Trying to change system role name",
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodPut, "/v1/admin/roles/"+roleID.String(), bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rr := app.ExecuteRequest(req, mux)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("DeleteRole", func(t *testing.T) {
		roleID := uuid.New()
		setupAdminMiddleware()
		roleStoreMock.On("RoleHasPermission", mock.Anything, adminUser.Role.RoleID, "roles:delete").Return(true, nil).Once()
		roleStoreMock.On("Delete", mock.Anything, roleID).Return(nil).Once()

		req, _ := http.NewRequest(http.MethodDelete, "/v1/admin/roles/"+roleID.String(), nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rr := app.ExecuteRequest(req, mux)

		// Delete should return 204 No Content
		assert.Equal(t, http.StatusNoContent, rr.Code)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("AssignRolePermission", func(t *testing.T) {
		roleID := uuid.New()
		permID := uuid.New()
		setupAdminMiddleware()
		roleStoreMock.On("RoleHasPermission", mock.Anything, adminUser.Role.RoleID, "roles:assign_permissions").Return(true, nil).Once()
		roleStoreMock.On("AssignRolePermission", mock.Anything, roleID, []uuid.UUID{permID}).Return(nil).Once()

		payload := map[string]interface{}{
			"permissions": []string{permID.String()},
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodPost, "/v1/admin/roles/"+roleID.String()+"/permissions", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rr := app.ExecuteRequest(req, mux)

		assert.Equal(t, http.StatusNoContent, rr.Code)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("DeleteRolePermission", func(t *testing.T) {
		roleID := uuid.New()
		permID := uuid.New()
		setupAdminMiddleware()
		roleStoreMock.On("RoleHasPermission", mock.Anything, adminUser.Role.RoleID, "roles:assign_permissions").Return(true, nil).Once()
		roleStoreMock.On("DeleteRolePermission", mock.Anything, roleID, []uuid.UUID{permID}).Return(nil).Once()

		payload := map[string]interface{}{
			"permissions": []string{permID.String()},
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodDelete, "/v1/admin/roles/"+roleID.String()+"/permissions", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rr := app.ExecuteRequest(req, mux)

		assert.Equal(t, http.StatusNoContent, rr.Code)
		roleStoreMock.AssertExpectations(t)
	})

}

func TestUserListHandlers(t *testing.T) {
	gin.SetMode(gin.TestMode)
	testApp := app.NewTestApplication(t, config.LoadConfig())
	mux := testApp.Mount()

	userStoreMock := testApp.Store.Users.(*authmocks.UserStoreMock)
	roleStoreMock := testApp.Store.Roles.(*authmocks.RoleStoreMock)

	sessionStoreMock := testApp.Store.Session.(*authmocks.SessionStoreMock)
	sessionStoreMock.On("Create", mock.Anything, mock.Anything).Return(nil)

	adminUser := &authdomain.Users{
		UserID: uuid.New(),
		Email:  "listadmin@example.com",
		Role:   authdomain.Roles{RoleID: uuid.New(), Name: "admin"},
	}
	adminToken, _, _ := testApp.Services.AuthServices.GenerateToken(context.Background(), adminUser, "test-agent", "127.0.0.1", "")

	setupMiddleware := func() {
		userStoreMock.On("GetByID", mock.Anything, adminUser.UserID).Return(adminUser, nil).Once()
		roleStoreMock.On("RoleHasPermission", mock.Anything, adminUser.Role.RoleID, "users:list").Return(true, nil).Once()
	}

	mockUsers := []*authdomain.Users{
		{UserID: uuid.New(), FirstName: "User", LastName: "One", Email: "user1@example.com", Role: authdomain.Roles{Name: "instructor"}},
	}

	t.Run("GetUsersHandler", func(t *testing.T) {
		setupMiddleware()
		userStoreMock.On("GetUsers", mock.Anything, mock.AnythingOfType("pagination.PaginatedFeedQuery")).Return(mockUsers, nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/v1/user/users", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rr := app.ExecuteRequest(req, mux)

		assert.Equal(t, http.StatusOK, rr.Code)
		userStoreMock.AssertExpectations(t)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("GetClientsHandler", func(t *testing.T) {
		setupMiddleware()
		userStoreMock.On("GetClients", mock.Anything, mock.AnythingOfType("pagination.PaginatedFeedQuery")).Return(mockUsers, len(mockUsers), nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/v1/user/clients", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rr := app.ExecuteRequest(req, mux)

		assert.Equal(t, http.StatusOK, rr.Code)
		userStoreMock.AssertExpectations(t)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("GetBranchAdminsHandler", func(t *testing.T) {
		setupMiddleware()
		userStoreMock.On("GetBranchAdmins", mock.Anything, mock.AnythingOfType("pagination.PaginatedFeedQuery")).Return(mockUsers, nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/v1/user/branch-admins", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rr := app.ExecuteRequest(req, mux)

		assert.Equal(t, http.StatusOK, rr.Code)
		userStoreMock.AssertExpectations(t)
		roleStoreMock.AssertExpectations(t)
	})
}

func TestUserDetailAndUpdateHandlers(t *testing.T) {
	gin.SetMode(gin.TestMode)
	testApp := app.NewTestApplication(t, config.LoadConfig())
	mux := testApp.Mount()

	userStoreMock := testApp.Store.Users.(*authmocks.UserStoreMock)
	roleStoreMock := testApp.Store.Roles.(*authmocks.RoleStoreMock)

	sessionStoreMock := testApp.Store.Session.(*authmocks.SessionStoreMock)
	sessionStoreMock.On("Create", mock.Anything, mock.Anything).Return(nil)

	adminRoleID := uuid.New()
	adminUser := &authdomain.Users{
		UserID: uuid.New(),
		Email:  "detailadmin@example.com",
		RoleID: adminRoleID,
		Role:   authdomain.Roles{RoleID: adminRoleID, Name: "admin"},
	}
	adminToken, _, _ := testApp.Services.AuthServices.GenerateToken(context.Background(), adminUser, "test-agent", "127.0.0.1", "")

	targetUserID := uuid.New()
	mockUser := &authdomain.Users{UserID: targetUserID, FirstName: "Target", LastName: "User", Email: "target@example.com"}

	t.Run("GetUserByIDHandler", func(t *testing.T) {
		userStoreMock.On("GetByID", mock.Anything, adminUser.UserID).Return(adminUser, nil).Once()
		roleStoreMock.On("RoleHasPermission", mock.Anything, adminRoleID, "users:get").Return(true, nil).Once()
		userStoreMock.On("GetByID", mock.Anything, targetUserID).Return(mockUser, nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/v1/user/"+targetUserID.String(), nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rr := app.ExecuteRequest(req, mux)

		assert.Equal(t, http.StatusOK, rr.Code)
		userStoreMock.AssertExpectations(t)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("UpdateUserStaffHandler", func(t *testing.T) {
		userStoreMock.On("GetByID", mock.Anything, adminUser.UserID).Return(adminUser, nil).Once()
		roleStoreMock.On("RoleHasPermission", mock.Anything, adminRoleID, "users:update").Return(true, nil).Once()

		roleName := "instructor"
		mockRole := &authdomain.Roles{RoleID: uuid.New(), Name: roleName}
		roleStoreMock.On("GetByName", mock.Anything, roleName).Return(mockRole, nil).Once()

		userStoreMock.On("UpdateUserStaff", mock.Anything, mock.MatchedBy(func(u *authdomain.Users) bool {
			return u.UserID == targetUserID && u.RoleID == mockRole.RoleID
		})).Return(nil).Once()

		payload := map[string]interface{}{
			"first_name": "Updated", "last_name": "Staff", "email": "updated.staff@example.com",
			"phone": "123", "identity_document": "123", "birth_date": "1990-01-01", "gender": "male",
			"role_name": roleName,
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodPut, "/v1/user/"+targetUserID.String()+"/staff", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rr := app.ExecuteRequest(req, mux)

		assert.Equal(t, http.StatusNoContent, rr.Code)
		userStoreMock.AssertExpectations(t)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("UpdateUserClientHandler", func(t *testing.T) {
		userStoreMock.On("GetByID", mock.Anything, adminUser.UserID).Return(adminUser, nil).Once()
		roleStoreMock.On("RoleHasPermission", mock.Anything, adminRoleID, "users:update").Return(true, nil).Once()
		userStoreMock.On("UpdateUserClient", mock.Anything, mock.MatchedBy(func(u *authdomain.Users) bool {
			return u.UserID == targetUserID
		})).Return(nil).Once()

		payload := map[string]interface{}{
			"first_name": "Updated", "last_name": "Client", "email": "updated.client@example.com",
			"phone": "456", "identity_document": "456", "birth_date": "1991-01-01", "gender": "male",
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodPut, "/v1/user/"+targetUserID.String()+"/client", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rr := app.ExecuteRequest(req, mux)

		assert.Equal(t, http.StatusNoContent, rr.Code)
		userStoreMock.AssertExpectations(t)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("BlockUserHandler", func(t *testing.T) {
		userStoreMock.On("GetByID", mock.Anything, adminUser.UserID).Return(adminUser, nil).Once()
		roleStoreMock.On("RoleHasPermission", mock.Anything, adminRoleID, "users:update").Return(true, nil).Once()

		justification := "Violation of terms"
		userStoreMock.On("BlockUser", mock.Anything, targetUserID, justification).Return(nil).Once()

		payload := map[string]string{
			"block_justification": justification,
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodPut, "/v1/user/"+targetUserID.String()+"/block", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rr := app.ExecuteRequest(req, mux)

		assert.Equal(t, http.StatusNoContent, rr.Code)
		userStoreMock.AssertExpectations(t)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("BlockUserHandler_NotFound", func(t *testing.T) {
		userStoreMock.On("GetByID", mock.Anything, adminUser.UserID).Return(adminUser, nil).Once()
		roleStoreMock.On("RoleHasPermission", mock.Anything, adminRoleID, "users:update").Return(true, nil).Once()

		justification := "Violation of terms"
		userStoreMock.On("BlockUser", mock.Anything, targetUserID, justification).Return(shared_errors.ErrNotFound).Once()

		payload := map[string]string{"block_justification": justification}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodPut, "/v1/user/"+targetUserID.String()+"/block", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rr := app.ExecuteRequest(req, mux)

		assert.Equal(t, http.StatusNotFound, rr.Code)
		userStoreMock.AssertExpectations(t)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("UnblockUserHandler", func(t *testing.T) {
		userStoreMock.On("GetByID", mock.Anything, adminUser.UserID).Return(adminUser, nil).Once()
		roleStoreMock.On("RoleHasPermission", mock.Anything, adminRoleID, "users:update").Return(true, nil).Once()

		userStoreMock.On("UnblockUser", mock.Anything, targetUserID).Return(nil).Once()

		req, _ := http.NewRequest(http.MethodPut, "/v1/user/"+targetUserID.String()+"/unblock", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rr := app.ExecuteRequest(req, mux)

		assert.Equal(t, http.StatusNoContent, rr.Code)
		userStoreMock.AssertExpectations(t)
		roleStoreMock.AssertExpectations(t)
	})

	t.Run("UnblockUserHandler_NotFound", func(t *testing.T) {
		userStoreMock.On("GetByID", mock.Anything, adminUser.UserID).Return(adminUser, nil).Once()
		roleStoreMock.On("RoleHasPermission", mock.Anything, adminRoleID, "users:update").Return(true, nil).Once()

		userStoreMock.On("UnblockUser", mock.Anything, targetUserID).Return(shared_errors.ErrNotFound).Once()

		req, _ := http.NewRequest(http.MethodPut, "/v1/user/"+targetUserID.String()+"/unblock", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rr := app.ExecuteRequest(req, mux)

		assert.Equal(t, http.StatusNotFound, rr.Code)
		userStoreMock.AssertExpectations(t)
		roleStoreMock.AssertExpectations(t)
	})
}

func TestResetPasswordHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)

	testApp := app.NewTestApplication(t, config.LoadConfig())
	mux := testApp.Mount()

	userStoreMock := testApp.Store.Users.(*authmocks.UserStoreMock)

	t.Run("should fail with mismatched passwords", func(t *testing.T) {
		payload := map[string]string{
			"token":            "valid-token",
			"password":         "NewPassword123!",
			"confirm_password": "mismatchedpassword",
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodPost, "/v1/auth/password/reset", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		rr := app.ExecuteRequest(req, mux)
		app.CheckResponseCode(t, http.StatusBadRequest, rr.Code)
	})

	t.Run("should fail if token is invalid", func(t *testing.T) {
		userStoreMock.On("ResetUserPassword", mock.Anything, "invalid-token", mock.AnythingOfType("*authdomain.Users")).Return(shared_errors.ErrNotFound).Once()

		payload := map[string]string{
			"token":            "invalid-token",
			"password":         "NewPassword123!",
			"confirm_password": "NewPassword123!",
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodPost, "/v1/auth/password/reset", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		rr := app.ExecuteRequest(req, mux)
		app.CheckResponseCode(t, http.StatusBadRequest, rr.Code)
		userStoreMock.AssertExpectations(t)
	})

	t.Run("should succeed with a valid token and matching passwords", func(t *testing.T) {
		userStoreMock.On("ResetUserPassword", mock.Anything, "valid-token", mock.AnythingOfType("*authdomain.Users")).Return(nil).Once()

		payload := map[string]string{
			"token":            "valid-token",
			"password":         "NewPassword123!",
			"confirm_password": "NewPassword123!",
		}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodPost, "/v1/auth/password/reset", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		rr := app.ExecuteRequest(req, mux)
		app.CheckResponseCode(t, http.StatusOK, rr.Code)
		userStoreMock.AssertExpectations(t)
	})
}

func TestForgotPasswordHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)

	testApp := app.NewTestApplication(t, config.LoadConfig())
	mux := testApp.Mount()

	userStoreMock := testApp.Store.Users.(*authmocks.UserStoreMock)
	mailerMock := testApp.Services.AuthServices.(*authservices.AuthService).Mailer.(*mailermocks.MockMailer)
	mockUser := newTestUser("forgot@example.com", "password123")

	t.Run("should fail if user does not exist", func(t *testing.T) {
		nonExistentEmail := "notfound@example.com"
		userStoreMock.On("GetByEmail", mock.Anything, nonExistentEmail).Return(nil, shared_errors.ErrNotFound).Once()

		payload := map[string]string{"email": nonExistentEmail}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodPost, "/v1/auth/password/forgot", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		rr := app.ExecuteRequest(req, mux)

		app.CheckResponseCode(t, http.StatusNotFound, rr.Code)
		userStoreMock.AssertExpectations(t)
	})

	t.Run("should succeed if user exists", func(t *testing.T) {
		// Mock the sequence of calls for a successful request
		userStoreMock.On("GetByEmail", mock.Anything, mockUser.Email).Return(mockUser, nil).Times(2)
		userStoreMock.On("CreatePasswordResetToken", mock.Anything, mockUser.UserID, mock.AnythingOfType("string"), mock.AnythingOfType("time.Duration")).Return(nil).Once()
		mailerMock.On("Send", mock.AnythingOfType("string"), mock.AnythingOfType("string"), mock.AnythingOfType("string"), mock.Anything, mock.AnythingOfType("bool")).Return(http.StatusOK, nil).Once()

		payload := map[string]string{"email": mockUser.Email}
		body, _ := json.Marshal(payload)

		req, _ := http.NewRequest(http.MethodPost, "/v1/auth/password/forgot", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		rr := app.ExecuteRequest(req, mux)

		app.CheckResponseCode(t, http.StatusOK, rr.Code)
		userStoreMock.AssertExpectations(t)
		mailerMock.AssertExpectations(t)
	})
}

func TestExportHandlers(t *testing.T) {
	gin.SetMode(gin.TestMode)
	testApp := app.NewTestApplication(t, config.LoadConfig())
	mux := testApp.Mount()

	userStoreMock := testApp.Store.Users.(*authmocks.UserStoreMock)
	roleStoreMock := testApp.Store.Roles.(*authmocks.RoleStoreMock)
	sessionStoreMock := testApp.Store.Session.(*authmocks.SessionStoreMock)
	sessionStoreMock.On("Create", mock.Anything, mock.Anything).Return(nil)

	adminUser := &authdomain.Users{
		UserID: uuid.New(),
		Email:  "admin@example.com",
		Role:   authdomain.Roles{RoleID: uuid.New(), Name: "admin"},
	}
	adminToken, _, _ := testApp.Services.AuthServices.GenerateToken(context.Background(), adminUser, "test-agent", "127.0.0.1", "")

	setupMiddleware := func() {
		userStoreMock.On("GetByID", mock.Anything, adminUser.UserID).Return(adminUser, nil).Once()
		roleStoreMock.On("RoleHasPermission", mock.Anything, adminUser.Role.RoleID, "users:list").Return(true, nil).Once()
	}

	t.Run("ExportClientsHandler", func(t *testing.T) {
		setupMiddleware()
		mockClients := []*authdomain.Users{{UserID: uuid.New(), FirstName: "Client", LastName: "One", Email: "c1@test.com"}}
		userStoreMock.On("GetAllClients", mock.Anything).Return(mockClients, nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/v1/user/export/clients", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rr := app.ExecuteRequest(req, mux)

		assert.Equal(t, http.StatusOK, rr.Code)
		assert.Equal(t, "text/csv", rr.Header().Get("Content-Type"))
		userStoreMock.AssertExpectations(t)
	})

	t.Run("ExportUsersHandler", func(t *testing.T) {
		setupMiddleware()
		mockStaff := []*authdomain.Users{{UserID: uuid.New(), FirstName: "Staff", LastName: "One", Email: "s1@test.com", Role: authdomain.Roles{Name: "instructor"}}}
		userStoreMock.On("GetAllStaffUsers", mock.Anything).Return(mockStaff, nil).Once()

		req, _ := http.NewRequest(http.MethodGet, "/v1/user/export/users", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		rr := app.ExecuteRequest(req, mux)

		assert.Equal(t, http.StatusOK, rr.Code)
		assert.Equal(t, "text/csv", rr.Header().Get("Content-Type"))
		userStoreMock.AssertExpectations(t)
	})
}
