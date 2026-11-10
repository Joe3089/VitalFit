package inventoryhandlers

import (
	"encoding/csv"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	inventorydomain "github.com/vitalfit/api/internal/modules/inventory/domain"
	shared_errors "github.com/vitalfit/api/internal/shared/errors"
	"github.com/vitalfit/api/pkg/pagination"
)

//
// EQUIPMENT CATALOG HANDLERS (Super Admin)
//

// @Summary		Create equipment type
// @Description	Adds a new equipment type to the global catalog (Super Admin only).
// @Tags			Equipment
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			equipment	body		CreateEquipmentPayload	true	"Equipment data"
// @Success		201			{object}	object{message=string}
// @Failure		400			{object}	object{error=string}
// @Failure		500			{object}	object{error=string}
// @Router			/equipment-types [post]
func (h *InventoryHandlers) CreateEquipmentHandler(c *gin.Context) {
	var payload CreateEquipmentPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	equipment, err := payload.ToEquipment()
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	if err := h.services.EquipmentServices.CreateEquipment(c, equipment); err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "equipment type created"})
}

// @Summary		Get equipment types
// @Description	Lists all available equipment types in the global catalog with pagination and filtering.
// @Tags			Equipment
// @Security		ApiKeyAuth
// @Produce		json
// @Param			limit		query		int											false	"Number of results per page"	default(10)
// @Param			page		query		int											false	"Page number for pagination"	default(1)
// @Param			sort		query		string										false	"Sort order (asc/desc)"			enums(asc, desc)	default(desc)
// @Param			search		query		string										false	"Search term for equipment name"
// @Param			category	query		string										false	"Filter by equipment category"	enums(Cardio, Strength, FreeWeight, Functional, Accessory)
// @Success		200			{object}	object{data=[]inventorydomain.Equipment}	"A paginated list of equipment types"
// @Failure		400			{object}	object{error=string}						"Error: Bad Request (e.g., invalid query parameters)"
// @Failure		500			{object}	object{error=string}						"Error: Internal Server Error"
// @Router			/equipment-types [get]
func (h *InventoryHandlers) GetEquipmentsHandler(c *gin.Context) {
	ctx := c.Request.Context()
	fq := pagination.PaginatedFeedQuery{
		Limit:    10,
		Page:     1,
		Sort:     "desc",
		Search:   "",
		Category: "",
	}

	fq, err := fq.Parse(c.Request)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	nextURL := fmt.Sprintf("/equipment-types?limit=%d&page=%d&sort=%s", fq.Limit, fq.Page+1, fq.Sort)
	previousPage := fq.Page - 1
	if previousPage <= 0 {
		previousPage = 1
	}
	previousURL := fmt.Sprintf("/equipment-types?limit=%d&page=%d&sort=%s", fq.Limit, previousPage, fq.Sort)

	equipments, err := h.services.EquipmentServices.GetEquipments(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	total, err := h.services.EquipmentServices.GetTotalCount(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}
	resp := pagination.PaginatedResponseTotal[*inventorydomain.Equipment]{
		Data:     equipments.Equipments,
		Count:    int64(len(equipments.Equipments)),
		Next:     nextURL,
		Previous: previousURL,
		Total:    total,
	}

	c.JSON(http.StatusOK, resp)
}

// @Summary		Export Equipment Types (CSV)
// @Description	Exports all equipment types in the global catalog as a CSV file.
// @Tags			Equipment
// @Security		ApiKeyAuth
// @Produce		text/csv
// @Success		200	{file}		file	"equipment_catalog.csv"
// @Failure		500	{object}	object{error=string}
// @Router			/equipment-types/export [get]
func (h *InventoryHandlers) ExportEquipmentsHandler(c *gin.Context) {
	ctx := c.Request.Context()
	fq := pagination.PaginatedFeedQuery{
		Limit: 1000000,
		Page:  1,
		Sort:  "desc",
	}

	equipments, err := h.services.EquipmentServices.GetEquipments(ctx, fq)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.Header("Content-Disposition", "attachment; filename=equipment_catalog.csv")
	c.Header("Content-Type", "text/csv")

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	writer.Write([]string{"ID", "Name", "Category", "Brand", "Model", "Description"})

	for _, e := range equipments.Equipments {
		writer.Write([]string{
			e.EquipmentID.String(),
			e.Name,
			string(e.Category),
			e.Brand,
			e.Model,
			e.Description,
		})
	}
}

// @Summary		Get equipment type by ID
// @Description	Retrieves a single equipment type from the global catalog by its UUID.
// @Tags			Equipment
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string	true	"Equipment UUID"
// @Success		200	{object}	object{data=EquipmentListResponse}
// @Failure		400	{object}	object{error=string}	"Error: Bad Request (e.g., invalid UUID)"
// @Failure		404	{object}	object{error=string}	"Error: Not Found"
// @Failure		500	{object}	object{error=string}	"Error: Internal Server Error"
// @Router			/equipment-types/{id} [get]
func (h *InventoryHandlers) GetEquipmentByID(c *gin.Context) {
	idStr := c.Param("id")
	equipmentID, err := uuid.Parse(idStr)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	equipment, err := h.services.EquipmentServices.GetEquipmentByID(c, equipmentID)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	resp := EquipmentListResponse{
		EquipmentID: equipment.EquipmentID,
		Name:        equipment.Name,
		Category:    string(equipment.Category),
		Description: equipment.Description,
		Brand:       equipment.Brand,
		Model:       equipment.Model,
	}

	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// @Summary		Get branch inventory item by ID
// @Description	Retrieves a single inventory item from a branch by its UUID.
// @Tags			Branch Inventory
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id			path		string	true	"Branch UUID"
// @Param			inventoryId	path		string	true	"Inventory Item UUID"
// @Success		200			{object}	object{data=BranchInventoryResponse}
// @Failure		400			{object}	object{error=string}	"Error: Bad Request (e.g., invalid UUID)"
// @Failure		404			{object}	object{error=string}	"Error: Not Found"
// @Failure		500			{object}	object{error=string}	"Error: Internal Server Error"
// @Router			/branches/{id}/equipment/{inventoryId} [get]
func (h *InventoryHandlers) GetInventoryByID(c *gin.Context) {
	idStr := c.Param("inventoryId")
	inventoryID, err := uuid.Parse(idStr)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	equipment, err := h.services.InventoryServices.GetInventoryItemByID(c, inventoryID)
	if err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	var acquisitionDate, lastMaintenanceDate string
	if equipment.AcquisitionDate != nil {
		acquisitionDate = equipment.AcquisitionDate.Format("2006-01-02")
	}
	if equipment.LastMaintenanceDate != nil {
		lastMaintenanceDate = equipment.LastMaintenanceDate.Format("2006-01-02")
	}

	var equipmentName string
	if equipment.Equipment != nil {
		equipmentName = equipment.Equipment.Name
	}

	resp := BranchInventoryResponse{
		InventoryID:         equipment.InventoryID,
		EquipmentID:         equipment.EquipmentID,
		SerialNumber:        equipment.SerialNumber,
		Name:                equipmentName,
		Status:              string(equipment.Status),
		AcquisitionDate:     acquisitionDate,
		LastMaintenanceDate: lastMaintenanceDate,
		Notes:               equipment.Notes,
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// @Summary		Update equipment type
// @Description	Updates an existing equipment type in the global catalog.
// @Tags			Equipment
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id			path		string					true	"Equipment UUID"
// @Param			equipment	body		UpdateEquipmentPayload	true	"Equipment update payload"
// @Success		200			{object}	object{message=string}
// @Failure		400			{object}	object{error=string}
// @Failure		404			{object}	object{error=string}
// @Failure		500			{object}	object{error=string}
// @Router			/equipment-types/{id} [put]
func (h *InventoryHandlers) UpdateEquipmentHandler(c *gin.Context) {
	idStr := c.Param("id")
	equipmentID, err := uuid.Parse(idStr)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	var payload UpdateEquipmentPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	equipment, err := payload.ToEquipment()
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	equipment.EquipmentID = equipmentID

	if err := h.services.EquipmentServices.UpdateEquipment(c, equipment); err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "equipment updated successfully"})
}

// @Summary		Delete equipment type
// @Description	Deletes an equipment type from the global catalog.
// @Tags			Equipment
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string	true	"Equipment UUID"
// @Success		204	{object}	nil
// @Failure		400	{object}	object{error=string}
// @Failure		404	{object}	object{error=string}
// @Failure		500	{object}	object{error=string}
// @Router			/equipment-types/{id} [delete]
func (h *InventoryHandlers) DeleteEquipmentHandler(c *gin.Context) {
	idStr := c.Param("id")
	equipmentID, err := uuid.Parse(idStr)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	if err := h.services.EquipmentServices.DeleteEquipment(c, equipmentID); err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

//
// BRANCH INVENTORY HANDLERS (Branch Admin)
//

// @Summary		Add item to branch inventory
// @Description	Adds a new equipment instance to a specific branch's inventory.
// @Tags			Branch Inventory
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id		path		string						true	"Branch UUID"
// @Param			item	body		CreateInventoryItemPayload	true	"Inventory item data"
// @Success		201		{object}	object{message=string}
// @Failure		400		{object}	object{error=string}
// @Failure		500		{object}	object{error=string}
// @Router			/branches/{id}/equipment [post]
func (h *InventoryHandlers) AddInventoryItemHandler(c *gin.Context) {
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	var payload CreateInventoryItemPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	item, err := payload.ToBranchInventory(branchID)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	if err := h.services.InventoryServices.AddInventoryItem(c, item); err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "inventory item added"})
}

// @Summary		List branch inventory
// @Description	Lists all equipment items for a given branch.
// @Tags			Branch Inventory
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id	path		string	true	"Branch UUID"
// @Success		200	{object}	object{data=[]inventorydomain.BranchInventory}
// @Failure		500	{object}	object{error=string}
// @Router			/branches/{id}/equipment [get]
func (h *InventoryHandlers) ListBranchInventoryHandler(c *gin.Context) {
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	inventory, err := h.services.InventoryServices.ListBranchInventory(c, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	resp := make([]BranchInventoryResponse, 0, len(inventory))
	for _, item := range inventory {
		var acquisitionDate, lastMaintenanceDate string
		if item.AcquisitionDate != nil {
			acquisitionDate = item.AcquisitionDate.Format("2006-01-02")
		}
		if item.LastMaintenanceDate != nil {
			lastMaintenanceDate = item.LastMaintenanceDate.Format("2006-01-02")
		}

		var equipmentName string
		if item.Equipment != nil {
			equipmentName = item.Equipment.Name
		}

		resp = append(resp, BranchInventoryResponse{
			InventoryID:         item.InventoryID,
			EquipmentID:         item.EquipmentID,
			Name:                equipmentName,
			SerialNumber:        item.SerialNumber,
			Status:              string(item.Status),
			AcquisitionDate:     acquisitionDate,
			LastMaintenanceDate: lastMaintenanceDate,
			Notes:               item.Notes,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// @Summary		Export Branch Inventory (CSV)
// @Description	Exports all equipment items for a given branch as a CSV file.
// @Tags			Branch Inventory
// @Security		ApiKeyAuth
// @Produce		text/csv
// @Param			id	path		string	true	"Branch UUID"
// @Success		200	{file}		file	"branch_inventory.csv"
// @Failure		400	{object}	object{error=string}
// @Failure		500	{object}	object{error=string}
// @Router			/branches/{id}/equipment/export [get]
func (h *InventoryHandlers) ExportBranchInventoryHandler(c *gin.Context) {
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	inventory, err := h.services.InventoryServices.ListBranchInventory(c, branchID)
	if err != nil {
		h.services.LogErrors.InternalServerError(c, err)
		return
	}

	c.Header("Content-Disposition", "attachment; filename=branch_inventory.csv")
	c.Header("Content-Type", "text/csv")

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	writer.Write([]string{"Inventory ID", "Equipment Name", "Serial Number", "Status", "Acquisition Date", "Last Maintenance", "Notes"})

	for _, item := range inventory {
		acqDate := ""
		if item.AcquisitionDate != nil {
			acqDate = item.AcquisitionDate.Format("2006-01-02")
		}
		lastMaint := ""
		if item.LastMaintenanceDate != nil {
			lastMaint = item.LastMaintenanceDate.Format("2006-01-02")
		}
		eqName := ""
		if item.Equipment != nil {
			eqName = item.Equipment.Name
		}

		writer.Write([]string{
			item.InventoryID.String(),
			eqName,
			item.SerialNumber,
			string(item.Status),
			acqDate,
			lastMaint,
			item.Notes,
		})
	}
}

// @Summary		Update branch inventory item
// @Description	Updates an inventory item's status or details.
// @Tags			Branch Inventory
// @Security		ApiKeyAuth
// @Accept			json
// @Produce		json
// @Param			id			path		string						true	"Branch UUID"
// @Param			inventoryId	path		string						true	"Inventory UUID"
// @Param			payload		body		UpdateInventoryItemPayload	true	"Update payload"
// @Success		200			{object}	object{message=string}
// @Failure		400			{object}	object{error=string}
// @Failure		404			{object}	object{error=string}
// @Failure		500			{object}	object{error=string}
// @Router			/branches/{id}/equipment/{inventoryId} [patch]
func (h *InventoryHandlers) UpdateInventoryItemHandler(c *gin.Context) {
	inventoryID, err := uuid.Parse(c.Param("inventoryId"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	var payload UpdateInventoryItemPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	item, err := payload.ToBranchInventoryUpdate(inventoryID)
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	item.BranchID = branchID
	if err := h.services.InventoryServices.UpdateInventoryItem(c, item); err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "inventory item updated"})
}

// @Summary		Delete branch inventory item
// @Description	Deletes an equipment item from a branch's inventory.
// @Tags			Branch Inventory
// @Security		ApiKeyAuth
// @Produce		json
// @Param			id			path		string	true	"Branch UUID"
// @Param			inventoryId	path		string	true	"Inventory UUID"
// @Success		204			{object}	nil
// @Failure		400			{object}	object{error=string}
// @Failure		404			{object}	object{error=string}
// @Failure		500			{object}	object{error=string}
// @Router			/branches/{id}/equipment/{inventoryId} [delete]
func (h *InventoryHandlers) DeleteInventoryItemHandler(c *gin.Context) {
	inventoryID, err := uuid.Parse(c.Param("inventoryId"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		h.services.LogErrors.BadRequestResponse(c, err)
		return
	}

	if err := h.services.InventoryServices.DeleteInventoryItem(c, inventoryID, branchID); err != nil {
		switch err {
		case shared_errors.ErrNotFound:
			h.services.LogErrors.NotFoundResponse(c)
		default:
			h.services.LogErrors.InternalServerError(c, err)
		}
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
