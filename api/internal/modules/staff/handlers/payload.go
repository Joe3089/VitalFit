package staffhandlers

import (
	"github.com/google/uuid"
)

type AssignStaffToBranchPayload struct {
	StaffIDs []string `json:"staff_ids" binding:"required"`
}

func (p *AssignStaffToBranchPayload) toUUIDs() ([]uuid.UUID, error) {
	ids := make([]uuid.UUID, len(p.StaffIDs))
	for i, id := range p.StaffIDs {
		parsedID, err := uuid.Parse(id)
		if err != nil {
			return nil, err
		}
		ids[i] = parsedID
	}
	return ids, nil
}

type BranchStaffResponse struct {
	UserID    uuid.UUID `json:"user_id"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Role      string    `json:"role"`
}

type BranchResponse struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}
