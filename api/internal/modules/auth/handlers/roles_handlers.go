package authhandlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/pagination"
)

// @Summary		List all roles
// @Description	List all roles in the system
// @Tags			RBAC (Admin)
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			limit	query		int		false	"Number of results per page"
// @Param			page	query		int		false	"Page number"
// @Param			sort	query		string	false	"Sort order (asc/desc)"
// @Param			search	query		string	false	"Search term for role name"
// @Success		200		{object}	object{data=authdomain.Roles}"Success response"
// @Failure		400		{object}	object{error=string}	"Error: Bad Request"
// @Failure		500		{object}	object{error=string}	"Error: Internal server error"
// @Router			/admin/roles [get]
func (r *AuthHandlers) GetRolesHandler(c *gin.Context) {
	fq := pagination.PaginatedFeedQuery{
		Limit:  10,
		Page:   1,
		Search: "",
	}
	fq, err := fq.Parse(c.Request)
	if err != nil {
		r.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	nextURL := fmt.Sprintf("/admin/roles?limit=%d&page=%d&sort=%s", fq.Limit, fq.Page+1, fq.Sort)
	previousPage := fq.Page - 1
	if previousPage <= 0 {
		previousPage = 1
	}
	previousURL := fmt.Sprintf("/admin/roles?limit=%d&page=%d&sort=%s", fq.Limit, previousPage, fq.Sort)

	roles, err := r.services.UserServices.GetRoles(c, fq)
	if err != nil {
		r.services.LogErrors.InternalServerError(c, err)
		return
	}

	total, err := r.services.UserServices.GetRolesFTotal(c, fq)
	if err != nil {
		r.services.LogErrors.InternalServerError(c, err)
		return
	}
	resp := pagination.PaginatedResponseTotal[*authdomain.Roles]{
		Data:     roles,
		Count:    int64(len(roles)),
		Next:     nextURL,
		Previous: previousURL,
		Total:    total,
	}
	c.JSON(200, resp)
}

// @Summary		Create a new custom role
// @Description	Creates a new custom role with a name, description, and an initial set of permission IDs.
// @Tags			RBAC (Admin)
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			payload	body		CreateRolesPayload		true	"Role creation payload"
// @Success		201		{object}	nil						"Role created successfully"
// @Failure		400		{object}	object{error=string}	"Bad Request: Invalid payload or permissions not found"
// @Failure		409		{object}	object{error=string}	"Conflict: A role with this name already exists"
// @Failure		500		{object}	object{error=string}	"Error: Internal server error"
// @Router			/admin/roles [post]
func (r *AuthHandlers) CreateRoleHandler(c *gin.Context) {
	var payload CreateRolesPayload
	ctx := c.Request.Context()
	if err := c.ShouldBindJSON(&payload); err != nil {
		r.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	role, err := payload.createRole()
	if err != nil {
		r.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	if err := r.services.UserServices.CreateRole(ctx, role); err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			r.services.LogErrors.BadRequestResponse(c, err)
			return
		case shared_errors.ErrConflict:
			r.services.LogErrors.ConflictResponse(c, err)
			return
		default:
			r.services.LogErrors.InternalServerError(c, err)
			return
		}
	}
	c.JSON(http.StatusCreated, nil)
}

// @Summary		Get role by ID
// @Description	Retrieves the details of a specific role, including its assigned permissions.
// @Tags			RBAC (Admin)
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string					true	"Role ID (UUID)"
// @Success		200	{object}	authdomain.Roles		"Role details response"
// @Failure		400	{object}	object{error=string}	"Bad Request: Invalid UUID format"
// @Failure		404	{object}	object{error=string}	"Not Found: Role not found"
// @Failure		500	{object}	object{error=string}	"Error: Internal server error"
// @Router			/admin/roles/{id} [get]
func (r *AuthHandlers) GetRoleByIDHandler(c *gin.Context) {
	ctx := c.Request.Context()
	roleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		r.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	role, err := r.services.UserServices.GetRoleByID(ctx, roleID)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			r.services.LogErrors.NotFoundResponse(c)
			return
		default:
			r.services.LogErrors.InternalServerError(c, err)
			return
		}
	}
	c.JSON(200, gin.H{
		"data": role,
	})
}

// @Summary		Update a role
// @Description	Updates a role's name, description, and overwrites its assigned permissions with the new set provided.
// @Tags			RBAC (Admin)
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id		path		string					true	"Role ID (UUID)"
// @Param			payload	body		CreateRolesPayload		true	"Role update payload"
// @Success		204		{object}	nil						"Role updated successfully"
// @Failure		400		{object}	object{error=string}	"Bad Request: Invalid UUID or payload"
// @Failure		500		{object}	object{error=string}	"Error: Internal server error"
// @Router			/admin/roles/{id} [put]
func (r *AuthHandlers) UpdateRoleHandler(c *gin.Context) {
	ctx := c.Request.Context()
	roleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		r.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	var payload CreateRolesPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		r.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	existingRole, err := r.services.UserServices.GetRoleByID(ctx, roleID)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			r.services.LogErrors.NotFoundResponse(c)
			return
		default:
			r.services.LogErrors.InternalServerError(c, err)
			return
		}
	}

	systemRoles := map[string]bool{
		"super_admin":  true,
		"recepcionist": true,
		"branch_admin": true,
		"data_analyst": true,
		"accountant":   true,
		"instructor":   true,
		"client":       true,
	}

	if systemRoles[existingRole.Name] && payload.Name != existingRole.Name {
		r.services.LogErrors.BadRequestResponse(c, fmt.Errorf("cannot modify the name of system role '%s'", existingRole.Name))
		return
	}

	role, err := payload.createRole()
	if err != nil {
		r.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	role.RoleID = roleID

	err = r.services.UserServices.UpdateRole(ctx, role)
	if err != nil {
		r.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusNoContent, nil)

}

// @Summary		Delete a role
// @Description	Deletes a custom role from the system.
// @Tags			RBAC (Admin)
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string					true	"Role ID (UUID)"
// @Success		204	{object}	nil						"Role deleted successfully (No Content)"
// @Failure		400	{object}	object{error=string}	"Bad Request: Invalid UUID format"
// @Failure		404	{object}	object{error=string}	"Not Found: Role not found"
// @Failure		500	{object}	object{error=string}	"Error: Internal server error"
// @Router			/admin/roles/{id} [delete]
func (r *AuthHandlers) DeleteRoleHandler(c *gin.Context) {
	ctx := c.Request.Context()
	roleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		r.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	if err := r.services.UserServices.DeleteRole(ctx, roleID); err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			r.services.LogErrors.NotFoundResponse(c)
			return
		case shared_errors.ErrConflict:
			r.services.LogErrors.ConflictResponse(c, err)
			return
		default:
			r.services.LogErrors.InternalServerError(c, err)
			return
		}

	}
	c.JSON(http.StatusNoContent, nil)
}

// @Summary		List all available permissions
// @Description	Lists all permissions defined in the system (from the seeder) that can be assigned to roles.
// @Tags			RBAC (Admin)
// @Security		ApiKeyAuth
// @Produce		json
// @Success		200	{object}	object{data=[]authdomain.Permission}	"List of all permissions"
// @Failure		500	{object}	object{error=string}					"Error: Internal server error"
// @Router			/admin/permissions [get]
func (r *AuthHandlers) GetPermissionsHandler(c *gin.Context) {
	ctx := c.Request.Context()
	permissions, err := r.services.UserServices.GetPermissions(ctx)
	if err != nil {
		r.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": permissions,
	})
}

// @Summary		Assign permissions to a role
// @Description	Assigns one or more permissions to a specific role. This is additive; it does not remove existing permissions.
// @Tags			RBAC (Admin)
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id		path		string					true	"Role ID (UUID)"
// @Param			payload	body		PermissionsPayload		true	"List of permission IDs to assign"
// @Success		204		{object}	nil						"Permissions assigned successfully"
// @Failure		400		{object}	object{error=string}	"Bad Request: Invalid UUID or payload"
// @Failure		500		{object}	object{error=string}	"Error: Internal server error"
// @Router			/admin/roles/{id}/permissions [post]
func (r *AuthHandlers) AssignRolePermissionHandler(c *gin.Context) {
	ctx := c.Request.Context()
	roleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		r.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	var payload PermissionsPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		r.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	permissions, err := payload.toPermission()
	if err != nil {
		r.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	if err := r.services.UserServices.AssignRolePermission(ctx, roleID, permissions); err != nil {
		r.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

// @Summary		Revoke permissions from a role
// @Description	Revokes one or more permissions from a specific role based on the provided permission IDs.
// @Tags			RBAC (Admin)
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id		path		string					true	"Role ID (UUID)"
// @Param			payload	body		PermissionsPayload		true	"List of permission IDs to revoke"
// @Success		204		{object}	nil						"Permissions revoked successfully"
// @Failure		400		{object}	object{error=string}	"Bad Request: Invalid UUID or payload"
// @Failure		500		{object}	object{error=string}	"Error: Internal server error"
// @Router			/admin/roles/{id}/permissions [delete]
func (r *AuthHandlers) DeleteRolePermissionHandler(c *gin.Context) {
	ctx := c.Request.Context()
	roleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		r.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	var payload PermissionsPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		r.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	permissions, err := payload.toPermission()
	if err != nil {
		r.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	if err := r.services.UserServices.DeleteRolePermission(ctx, roleID, permissions); err != nil {
		r.services.LogErrors.InternalServerError(c, err)
		return
	}
	c.JSON(http.StatusNoContent, nil)
}
