package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"math/rand"

	"github.com/go-redis/redis/v8"
	"github.com/shopspring/decimal"
	"github.com/stretchr/testify/mock"
	appservices "github.com/vitalfit/api/internal/app/services"
	"github.com/vitalfit/api/internal/shared/notifications"
	"go.uber.org/zap"

	"log"
	"os"
	"time"

	"strings"

	"github.com/google/uuid"
	"github.com/vitalfit/api/config"
	accessdomain "github.com/vitalfit/api/internal/modules/access/domain"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	authmocks "github.com/vitalfit/api/internal/modules/auth/mocks"
	billingdomain "github.com/vitalfit/api/internal/modules/billing/domain"
	bookingdomain "github.com/vitalfit/api/internal/modules/booking/domain"
	branchdomain "github.com/vitalfit/api/internal/modules/branches/domain"
	combosdomain "github.com/vitalfit/api/internal/modules/combos/domain"
	instructordomain "github.com/vitalfit/api/internal/modules/instructor/domain"
	inventorydomain "github.com/vitalfit/api/internal/modules/inventory/domain"
	marketingdomain "github.com/vitalfit/api/internal/modules/marketing/domain"
	membershipsdomain "github.com/vitalfit/api/internal/modules/memberships/domain"
	policiesdomain "github.com/vitalfit/api/internal/modules/policies/domain"
	productsdomain "github.com/vitalfit/api/internal/modules/products/domain"
	routinedomain "github.com/vitalfit/api/internal/modules/routines/domain"
	scheduledomain "github.com/vitalfit/api/internal/modules/schedule/domain"
	"github.com/vitalfit/api/internal/store"
	"github.com/vitalfit/api/internal/store/cache"
	env "github.com/vitalfit/api/pkg/Env"
	"github.com/vitalfit/api/pkg/db"
	mailermocks "github.com/vitalfit/api/pkg/mailer/mocks"
	"github.com/vitalfit/api/pkg/pagination"
	"gorm.io/gorm"

	_ "github.com/lib/pq"
)

type SeedStruct struct{}

func NewSeedStruct() *SeedStruct {
	return &SeedStruct{}
}

func (s *SeedStruct) Seed(store store.Storage, db *gorm.DB, services appservices.Services) {
	ctx := context.Background()

	// Essential data, safe to run on a fresh database (production included):
	// super admin (ADMIN_EMAIL / ADMIN_PASSWORD), permissions, role permissions,
	// commercial policies, service categories and exercises.
	if env.GetBool("SEED_ESSENTIAL", true) {
		if env.GetString("ADMIN_EMAIL", "") != "" {
			s.CreateSuperAdmin(store, db, ctx)
		}
		s.SeedPermissions(store, db, ctx)
		s.SeedRolePermissions(store, db, ctx)
		s.SeedPolicies(store, db, ctx)
		s.SeedServiceCategories(store, db, ctx)
		s.SeedExercises(store, db, ctx)
	}

	// Demo data (users, branches, services, classes, invoices, bookings...).
	// Enable with SEED_DEMO=true; meant for local/testing environments.
	if env.GetBool("SEED_DEMO", false) {
		s.SeedUsers(store, db, ctx)
		s.SeedBanners(store, db, ctx)
		s.SeedServices(store, db, ctx)
		s.SeedInstructors(store, db, ctx)
		s.SeedBranches(store, db, ctx)
		s.SeedEquipment(store, db, ctx)
		s.SeedMemberships(store, db, ctx)
		s.SeedPackages(store, db, ctx)
		s.SeedBranchRelations(store, db, ctx)
		s.SeedClasses(store, db, ctx)
		s.SeedInvoicesAndPayments(store, db, ctx, services)
		s.SeedBookingsAndAttendance(store, db, ctx)
		s.SeedStaffAssignment(store, db, ctx, services)
	}
}

func (s *SeedStruct) CreateSuperAdmin(store store.Storage, db *gorm.DB, ctx context.Context) {
	email := env.GetString("ADMIN_EMAIL", "")
	password := env.GetString("ADMIN_PASSWORD", "")
	user := &authdomain.Users{
		FirstName:        "Super",
		LastName:         "Admin",
		Email:            email,
		Phone:            "+581235467890",
		IdentityDocument: "V-1234567891",
		Gender:           "male",
		IsValidated:      true,
	}
	date, err := time.Parse(time.RFC3339, "1990-01-01T00:00:00Z")
	if err != nil {
		log.Println("Error parsing date", err)
		return
	}
	user.BirthDate = date
	role, err := store.Roles.GetByName(ctx, "super_admin")
	if err != nil {
		log.Println("Error getting the role", err)
		return
	}
	user.RoleID = role.RoleID
	user.PasswordHash.Set(password)
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := store.Users.Create(ctx, tx, user); err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		log.Println("Error creating the user", err)
		return
	}

	log.Println("User created successfully")
}

type permissionJSON struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (s *SeedStruct) SeedPermissions(store store.Storage, db *gorm.DB, ctx context.Context) {

	jsonFile, err := os.ReadFile("./internal/migrate/seed/data/permission.json")
	if err != nil {
		log.Fatalf("Fatal error: could not read permissions.json file: %v", err)
		return
	}

	var permissionsFromJSON []permissionJSON
	if err = json.Unmarshal(jsonFile, &permissionsFromJSON); err != nil {
		log.Fatalf("Fatal error: could not decode JSON: %v", err)
		return
	}
	log.Printf("Found %d permissions in permissions.json. Starting seeder...", len(permissionsFromJSON))

	err = db.Transaction(func(tx *gorm.DB) error {

		for _, p := range permissionsFromJSON {

			permissionToCreate := &authdomain.Permission{
				Name:        p.Name,
				Description: p.Description,
			}

			if err := store.Roles.CreatePermission(ctx, tx, permissionToCreate); err != nil {
				log.Printf("Error creating permission '%s': %v", p.Name, err)
				return err //rollback
			}
		}

		// Commit
		return nil
	})

	if err != nil {
		log.Println("Error in permissions seeder, transaction was rolled back:", err)
		return
	}

	log.Println("Permissions seeder completed successfully.")
}

func randomDateInLastSixMonths() time.Time {
	now := time.Now().AddDate(0, 1, 0)
	sixMonthsAgo := now.AddDate(0, -1, 0)

	duration := now.Sub(sixMonthsAgo)
	randomDuration := time.Duration(rand.Int63n(int64(duration)))

	return sixMonthsAgo.Add(randomDuration)
}

func (s *SeedStruct) SeedRolePermissions(store store.Storage, db *gorm.DB, ctx context.Context) {
	jsonFile, err := os.ReadFile("./internal/migrate/seed/data/permission_set.json")
	if err != nil {
		log.Fatalf("Fatal error: could not read permission_set.json file: %v", err)
		return
	}

	var permissionSet map[string][]string
	if err = json.Unmarshal(jsonFile, &permissionSet); err != nil {
		log.Fatalf("Fatal error: could not decode permission_set.json: %v", err)
		return
	}

	log.Printf("Found %d role permission sets in permission_set.json. Starting seeder...", len(permissionSet))

	err = db.Transaction(func(tx *gorm.DB) error {
		for roleName, permissionNames := range permissionSet {
			role, err := store.Roles.GetByName(ctx, roleName)
			if err != nil {
				log.Printf("Error getting role '%s': %v. Skipping...", roleName, err)
				continue
			}

			var permissionIDs []uuid.UUID
			for _, permName := range permissionNames {
				permission, err := store.Roles.GetPermissionByName(ctx, permName)
				if err != nil {
					log.Printf("Error getting permission '%s' for role '%s': %v. Skipping permission...", permName, roleName, err)
					continue
				}
				permissionIDs = append(permissionIDs, permission.PermissionID)
			}

			if len(permissionIDs) > 0 {
				err := store.Roles.AssignRolePermission(ctx, role.RoleID, permissionIDs)
				if err != nil {
					log.Printf("Error assigning permissions to role '%s': %v", roleName, err)
					return err // Rollback
				}
				log.Printf("Successfully assigned %d permissions to role '%s'", len(permissionIDs), roleName)
			}
		}
		return nil // Commit
	})

	if err != nil {
		log.Println("Error in role permissions seeder, transaction was rolled back:", err)
		return
	}

	log.Println("Role permissions seeder completed successfully.")
}

type serviceJSON struct {
	CategoryName  string             `json:"category_name"`
	Description   string             `json:"description"`
	Duration      int64              `json:"duration"`
	IsFeatured    bool               `json:"is_featured"`
	Name          string             `json:"name"`
	Priority      int64              `json:"priority"`
	ServiceImages []serviceImageJSON `json:"service_images"`
}

type serviceImageJSON struct {
	AltText      string `json:"alt_text"`
	DisplayOrder int    `json:"display_order"`
	ImageURL     string `json:"image_url"`
	IsPrimary    bool   `json:"is_primary"`
}

func (s *SeedStruct) SeedServices(store store.Storage, db *gorm.DB, ctx context.Context) {
	jsonFile, err := os.ReadFile("./internal/migrate/seed/data/services.json")
	if err != nil {
		log.Fatalf("Fatal error: could not read services.json file: %v", err)
		return
	}

	var servicesFromJSON []serviceJSON
	if err = json.Unmarshal(jsonFile, &servicesFromJSON); err != nil {
		log.Fatalf("Fatal error: could not decode services.json: %v", err)
		return
	}

	log.Printf("Found %d services in services.json. Starting seeder...", len(servicesFromJSON))

	banners, err := store.Marketing.GetBanners(ctx)
	if err != nil {
		log.Printf("Error getting banners: %v. Services will be created without banners.", err)
	}

	err = db.Transaction(func(tx *gorm.DB) error {
		for _, serviceData := range servicesFromJSON {
			category, err := store.Products.GetServiceCategoryByName(ctx, serviceData.CategoryName)
			if err != nil {
				log.Printf("Error getting category '%s' for service '%s': %v. Skipping...", serviceData.CategoryName, serviceData.Name, err)
				continue
			}

			images := make([]productsdomain.ServiceImage, len(serviceData.ServiceImages))
			for i, imgData := range serviceData.ServiceImages {
				images[i] = productsdomain.ServiceImage{
					ImageURL:     imgData.ImageURL,
					AltText:      imgData.AltText,
					DisplayOrder: imgData.DisplayOrder,
					IsPrimary:    imgData.IsPrimary,
				}
			}

			service := &productsdomain.Service{
				Name:            serviceData.Name,
				CategoryID:      category.CategoryID,
				Description:     serviceData.Description,
				DurationMinutes: serviceData.Duration,
				PriorityScore:   serviceData.Priority,
				IsFeatured:      serviceData.IsFeatured,
				Images:          images,
				CreatedAt:       randomDateInLastSixMonths(),
			}

			var bannerID uuid.UUID
			if len(banners) > 0 {
				bannerID = banners[rand.Intn(len(banners))].BannerID
			}

			if err := store.Products.CreateServiceTX(ctx, tx, service, bannerID); err != nil {
				log.Printf("Error creating service '%s': %v", service.Name, err)
				return err // Rollback
			}
		}
		return nil // Commit
	})

	if err != nil {
		log.Println("Error in services seeder, transaction was rolled back:", err)
		return
	}

	log.Println("Services seeder completed successfully.")
}

type instructorJSON struct {
	FirstName         string `json:"first_name"`
	LastName          string `json:"last_name"`
	Email             string `json:"email"`
	Phone             string `json:"phone"`
	IdentityDocument  string `json:"identity_document"`
	BirthDate         string `json:"birth_date"`
	Gender            string `json:"gender"`
	ProfilePictureURL string `json:"profile_picture_url"`
	Biography         string `json:"biography"`
}

type UserJSON struct {
	FirstName         string `json:"first_name"`
	LastName          string `json:"last_name"`
	Email             string `json:"email"`
	Phone             string `json:"phone"`
	IdentityDocument  string `json:"identity_document"`
	BirthDate         string `json:"birth_date"`
	Gender            string `json:"gender"`
	ProfilePictureURL string `json:"profile_picture_url"`
	RoleName          string `json:"role_name"`
}

func (s *SeedStruct) SeedInstructors(store store.Storage, db *gorm.DB, ctx context.Context) {
	password := env.GetString("ADMIN_PASSWORD", "")
	jsonFile, err := os.ReadFile("./internal/migrate/seed/data/instructor.json")
	if err != nil {
		log.Fatalf("Fatal error: could not read instructors.json file: %v", err)
	}

	var instructorsFromJSON []instructorJSON
	if err = json.Unmarshal(jsonFile, &instructorsFromJSON); err != nil {
		log.Fatalf("Fatal error: could not decode JSON: %v", err)
	}
	log.Printf("Found %d instructors in instructors.json. Starting seeder...", len(instructorsFromJSON))

	err = db.Transaction(func(tx *gorm.DB) error {
		r := rand.New(rand.NewSource(time.Now().UnixNano()))

		specialties, err := store.Products.ListServiceCategories(ctx, tx)
		if err != nil {
			return err
		}

		if len(specialties) == 0 {
			log.Println("No specialties found to assign to instructors.")
			return nil
		}

		for _, i := range instructorsFromJSON {
			user := &authdomain.Users{
				FirstName:         i.FirstName,
				LastName:          i.LastName,
				Email:             i.Email,
				Phone:             i.Phone,
				IdentityDocument:  i.IdentityDocument,
				Gender:            authdomain.GenderEnum(strings.ToLower(i.Gender)),
				ProfilePictureURL: i.ProfilePictureURL,
				IsValidated:       true,
			}
			date, err := time.Parse("2006-01-02", i.BirthDate)
			if err != nil {
				date, err = time.Parse(time.RFC3339, i.BirthDate)
				if err != nil {
					log.Printf("Error parsing date for instructor '%s': %v", i.Email, err)
					return err
				}
			}
			user.BirthDate = date
			user.PasswordHash.Set(password)
			role, err := store.Roles.GetByName(ctx, "instructor")
			if err != nil {
				log.Println("Error getting the role", err)
				return err
			}
			user.RoleID = role.RoleID

			// Asignar especialidades aleatorias
			numSpecialtiesToAssign := r.Intn(len(specialties)) + 1
			r.Shuffle(len(specialties), func(i, j int) {
				specialties[i], specialties[j] = specialties[j], specialties[i]
			})

			assignedSpecialties := make([]*productsdomain.ServiceCategory, 0, numSpecialtiesToAssign)
			for k := 0; k < numSpecialtiesToAssign; k++ {
				assignedSpecialties = append(assignedSpecialties, &specialties[k])
			}

			instructor := &instructordomain.Instructor{
				Biography: i.Biography,
				User:      user,
			}
			if err := store.Instructor.Create(ctx, tx, instructor); err != nil {
				log.Printf("Error creating instructor '%s': %v", i.FirstName, err)
				return err //rollback

			}

			specialtyIDs := make([]uuid.UUID, 0, len(assignedSpecialties))
			for _, s := range assignedSpecialties {
				specialtyIDs = append(specialtyIDs, s.CategoryID)
			}

			if err := store.Instructor.AssignInstructorSpecialtyTx(ctx, tx, instructor.InstructorID, specialtyIDs); err != nil {
				log.Printf("Error assigning specialties to instructor '%s': %v", i.FirstName, err)
				return err //rollback
			}
		}
		// Commit
		return nil
	})

	if err != nil {
		log.Println("Error in instructors seeder, transaction was rolled back:", err)
		return
	}

	log.Println("Instructors seeder completed successfully.")
}

func (s *SeedStruct) SeedUsers(store store.Storage, dbg *gorm.DB, ctx context.Context) {
	password := env.GetString("ADMIN_PASSWORD", "")
	jsonFile, err := os.ReadFile("./internal/migrate/seed/data/user.json")
	if err != nil {
		log.Fatalf("Fatal error: could not read users.json file: %v", err)
		return
	}

	var usersFromJSON []UserJSON
	if err = json.Unmarshal(jsonFile, &usersFromJSON); err != nil {
		log.Fatalf("Fatal error: could not decode JSON: %v", err)
		return
	}
	log.Printf("Found %d users in users.json. Starting seeder...", len(usersFromJSON))

	err = db.WithTX(dbg, func(tx *gorm.DB) error {

		for _, u := range usersFromJSON {
			user := &authdomain.Users{
				FirstName:         u.FirstName,
				LastName:          u.LastName,
				Email:             u.Email,
				Phone:             u.Phone,
				IdentityDocument:  u.IdentityDocument,
				Gender:            authdomain.GenderEnum(strings.ToLower(u.Gender)),
				ProfilePictureURL: u.ProfilePictureURL,
				IsValidated:       true,
			}
			user.CreatedAt = randomDateInLastSixMonths()
			date, err := time.Parse("2006-01-02", u.BirthDate)
			if err != nil {
				date, err = time.Parse(time.RFC3339, u.BirthDate)
				if err != nil {
					log.Printf("Error parsing date for user '%s': %v", u.Email, err)
					return err
				}
			}
			user.BirthDate = date

			user.PasswordHash.Set(password)

			role, err := store.Roles.GetByName(ctx, u.RoleName)
			if err != nil {
				log.Println("Error getting the role", err)
				return err
			}
			user.RoleID = role.RoleID
			if err := store.Users.Create(ctx, tx, user); err != nil {
				log.Printf("Error creating user '%s': %v", u.FirstName, err)
				return err //rollback
			}
		}
		// Commit
		return nil
	})

	if err != nil {
		log.Println("Error in users seeder, transaction was rolled back:", err)
		return
	}
	log.Println("Users seeder completed successfully.")
}

type ServiceCategoryJSON struct {
	Name string `json:"name"`
}

func (s *SeedStruct) SeedServiceCategories(store store.Storage, db *gorm.DB, ctx context.Context) {
	jsonFile, err := os.ReadFile("./internal/migrate/seed/data/service_categories.json")
	if err != nil {
		log.Fatalf("Fatal error: could not read service_categories.json file: %v", err)
		return
	}

	var serviceCategoriesFromJSON []ServiceCategoryJSON
	if err = json.Unmarshal(jsonFile, &serviceCategoriesFromJSON); err != nil {
		log.Fatalf("Fatal error: could not decode JSON: %v", err)
		return
	}
	log.Printf("Found %d service categories in service_categories.json. Starting seeder...", len(serviceCategoriesFromJSON))

	err = db.Transaction(func(tx *gorm.DB) error {

		for _, sc := range serviceCategoriesFromJSON {
			serviceCategory := &productsdomain.ServiceCategory{
				Name: sc.Name,
			}
			err := store.Products.CreateServiceCategory(ctx, tx, serviceCategory)
			if err != nil {
				log.Printf("Error creating service category '%s': %v", sc.Name, err)
				return err //rollback
			}
		}
		// Commit
		return nil
	})

	if err != nil {
		log.Println("Error in service categories seeder, transaction was rolled back:", err)
		return
	}

	log.Println("Service categories seeder completed successfully.")
}

type bannerJSON struct {
	Name     string `json:"name"`
	ImageURL string `json:"image_url"`
	LinkURL  string `json:"link_url"`
	IsActive bool   `json:"is_active"`
}

func (s *SeedStruct) SeedBanners(store store.Storage, db *gorm.DB, ctx context.Context) {
	jsonFile, err := os.ReadFile("./internal/migrate/seed/data/banners.json")
	if err != nil {
		log.Fatalf("Fatal error: could not read banners.json file: %v", err)
		return
	}

	var bannersFromJSON []bannerJSON
	if err = json.Unmarshal(jsonFile, &bannersFromJSON); err != nil {
		log.Fatalf("Fatal error: could not decode JSON: %v", err)
		return
	}
	log.Printf("Found %d banners in banners.json. Starting seeder...", len(bannersFromJSON))

	err = db.Transaction(func(tx *gorm.DB) error {

		for _, b := range bannersFromJSON {
			banner := &marketingdomain.Banner{
				Name:     b.Name,
				ImageURL: b.ImageURL,
				LinkURL:  b.LinkURL,
				IsActive: b.IsActive,
			}
			err := store.Marketing.CreateBannerTX(ctx, tx, banner)
			if err != nil {
				log.Printf("Error creating banner '%s': %v", b.Name, err)
				return err //rollback
			}
		}
		return nil
	})

	if err != nil {
		log.Println("Error in banners seeder, transaction was rolled back:", err)
		return
	}

	log.Println("Banners seeder completed successfully.")

}

type branchJSON struct {
	Address        string               `json:"address"`
	Country        string               `json:"country"`
	Latitude       float64              `json:"latitude"`
	Longitude      float64              `json:"longitude"`
	MaxCapacity    int                  `json:"max_capacity"`
	Name           string               `json:"name"`
	OperatingHours []operatingHoursJSON `json:"operating_hours"`
	Phone          string               `json:"phone"`
	State          string               `json:"state"`
	Status         string               `json:"status"`
	TaxID          string               `json:"tax_id"`
}

type operatingHoursJSON struct {
	DayOfWeek string `json:"day_of_week"`
	OpenTime  string `json:"open_time"`
	CloseTime string `json:"close_time"`
	IsClosed  bool   `json:"is_closed"`
}

func (s *SeedStruct) SeedBranches(store store.Storage, db *gorm.DB, ctx context.Context) {
	jsonFile, err := os.ReadFile("./internal/migrate/seed/data/branches.json")
	if err != nil {
		log.Fatalf("Fatal error: could not read branches.json file: %v", err)
		return
	}

	var branchesFromJSON []branchJSON
	if err = json.Unmarshal(jsonFile, &branchesFromJSON); err != nil {
		log.Fatalf("Fatal error: could not decode JSON: %v", err)
		return
	}
	log.Printf("Found %d branches in branches.json. Starting seeder...", len(branchesFromJSON))

	branchAdminsFeed, err := store.Users.GetBranchAdmins(ctx, pagination.PaginatedFeedQuery{})
	if err != nil {
		log.Printf("Error getting branch admins: %v", err)
		return
	}

	if len(branchAdminsFeed) == 0 {
		log.Println("Warning: No branch admins found. Branches will be created without a manager.")
	}

	err = db.Transaction(func(tx *gorm.DB) error {

		for _, b := range branchesFromJSON {
			branch := &branchdomain.Branch{
				Address:     b.Address,
				MaxCapacity: b.MaxCapacity,
				Name:        b.Name,
				Latitude:    b.Latitude,
				Longitude:   b.Longitude,
				Phone:       b.Phone,
				Status:      branchdomain.BranchStatusEnum(b.Status),
				TaxID:       b.TaxID,
				CreatedAt:   randomDateInLastSixMonths(),
			}

			state, err := store.Locations.FindOrCreateStateByCountry(ctx, b.State, b.Country)
			if err != nil {
				log.Printf("Error creating state '%s': %v", b.State, err)
				return err //rollback
			}
			branch.StateID = state.StateID

			for _, oh := range b.OperatingHours {
				branch.OperatingHours = append(branch.OperatingHours, branchdomain.OperatingHours{
					DayOfWeek: branchdomain.DayOfWeekEnum(oh.DayOfWeek),
					OpenTime:  &oh.OpenTime,
					CloseTime: &oh.CloseTime,
					IsClosed:  oh.IsClosed,
				})
			}

			if len(branchAdminsFeed) > 0 {

				randomIndex := rand.Intn(len(branchAdminsFeed))
				randomAdmin := branchAdminsFeed[randomIndex]

				branch.ManagerID = randomAdmin.UserID
			}

			err = store.Branches.Create(ctx, tx, branch)
			if err != nil {
				log.Printf("Error creating branch '%s': %v", b.Name, err)
				return err //rollback
			}
		}

		return nil
	})

	if err != nil {
		log.Printf("Seeder transaction failed: %v", err)
	}

	log.Println("Branchs seeder completed successfully.")

}

type equipmentJSON struct {
	Brand       string
	Category    string
	Description string
	Model       string
	Name        string
}

func (s *SeedStruct) SeedEquipment(store store.Storage, db *gorm.DB, ctx context.Context) {
	jsonFile, err := os.ReadFile("./internal/migrate/seed/data/equipments.json")
	if err != nil {
		log.Fatalf("Fatal error: could not read equipment.json file: %v", err)
		return
	}

	var equipmentFromJSON []equipmentJSON
	if err = json.Unmarshal(jsonFile, &equipmentFromJSON); err != nil {
		log.Fatalf("Fatal error: could not decode JSON: %v", err)
		return
	}
	log.Printf("Found %d equipment in equipment.json. Starting seeder...", len(equipmentFromJSON))

	err = db.Transaction(func(tx *gorm.DB) error {

		for _, e := range equipmentFromJSON {
			equipment := &inventorydomain.Equipment{
				Brand:       e.Brand,
				Category:    inventorydomain.EquipmentCategoryEnum(e.Category),
				Description: e.Description,
				Model:       e.Model,
				Name:        e.Name,
				CreatedAt:   randomDateInLastSixMonths(),
			}
			err := tx.WithContext(ctx).Create(&equipment).Error
			if err != nil {
				log.Printf("Error creating equipment '%s': %v", e.Name, err)
				return err //rollback
			}
		}
		return nil
	})
	if err != nil {
		log.Println("Error in equipment seeder, transaction was rolled back:", err)
		return
	}
	log.Println("Equipment seeder completed successfully.")

}

type membershipJSON struct {
	Description  string  `json:"description"`
	DurationDays int     `json:"duration_days"`
	IsActive     bool    `json:"is_active"`
	Name         string  `json:"name"`
	Price        float64 `json:"price"`
}

func (s *SeedStruct) SeedMemberships(store store.Storage, db *gorm.DB, ctx context.Context) {
	jsonFile, err := os.ReadFile("./internal/migrate/seed/data/memberships.json")
	if err != nil {
		log.Fatalf("Fatal error: could not read memberships.json file: %v", err)
		return
	}

	var membershipsFromJSON []membershipJSON
	if err = json.Unmarshal(jsonFile, &membershipsFromJSON); err != nil {
		log.Fatalf("Fatal error: could not decode memberships.json: %v", err)
		return
	}

	log.Printf("Found %d memberships in memberships.json. Starting seeder...", len(membershipsFromJSON))

	err = db.Transaction(func(tx *gorm.DB) error {
		for _, m := range membershipsFromJSON {
			membership := &membershipsdomain.MembershipType{
				Name:         m.Name,
				Description:  m.Description,
				DurationDays: m.DurationDays,
				Price:        m.Price,
				IsActive:     m.IsActive,
				CreatedAt:    randomDateInLastSixMonths(),
			}

			if err := tx.Create(membership).Error; err != nil {
				log.Printf("Error creating membership '%s': %v", m.Name, err)
				return err // Rollback
			}
		}
		return nil // Commit
	})

	if err != nil {
		log.Println("Error in memberships seeder, transaction was rolled back:", err)
		return
	}

	log.Println("Memberships seeder completed successfully.")
}

type packageJSON struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	StartAt     string  `json:"startAt"`
	EndAt       string  `json:"endAt"`
}

func (s *SeedStruct) SeedPackages(store store.Storage, db *gorm.DB, ctx context.Context) {
	jsonFile, err := os.ReadFile("./internal/migrate/seed/data/packages.json")
	if err != nil {
		log.Fatalf("Fatal error: could not read packages.json file: %v", err)
		return
	}

	var packagesFromJSON []packageJSON
	if err = json.Unmarshal(jsonFile, &packagesFromJSON); err != nil {
		log.Fatalf("Fatal error: could not decode packages.json: %v", err)
		return
	}

	log.Printf("Found %d packages in packages.json. Starting seeder...", len(packagesFromJSON))

	allServices, err := store.Products.GetAllServices(ctx)
	if err != nil {
		log.Fatalf("Fatal error: could not get services for packages seeder: %v", err)
		return
	}

	if len(allServices) == 0 {
		log.Println("Warning: No services found in the database. Packages will be created without items.")
		return
	}

	err = db.Transaction(func(tx *gorm.DB) error {
		for _, p := range packagesFromJSON {
			startAt, err := time.Parse(time.RFC3339, p.StartAt)
			if err != nil {
				log.Printf("Error parsing StartAt for package '%s': %v. Skipping...", p.Name, err)
				continue
			}
			endAt, err := time.Parse(time.RFC3339, p.EndAt)
			if err != nil {
				log.Printf("Error parsing EndAt for package '%s': %v. Skipping...", p.Name, err)
				continue
			}

			pkg := &combosdomain.Package{
				Name:        p.Name,
				Description: p.Description,
				Price:       p.Price,
				StartAt:     &startAt,
				EndAt:       &endAt,
				CreatedAt:   randomDateInLastSixMonths(),
			}

			numItems := rand.Intn(3) + 2
			rand.Shuffle(len(allServices), func(i, j int) {
				allServices[i], allServices[j] = allServices[j], allServices[i]
			})

			for i := 0; i < numItems && i < len(allServices); i++ {
				sessions := rand.Intn(16) + 5
				pkg.PackageItems = append(pkg.PackageItems, combosdomain.PackageItem{
					ServiceID:        allServices[i].ServiceID,
					SessionsIncluded: sessions,
				})
			}

			if err := tx.Create(pkg).Error; err != nil {
				log.Printf("Error creating package '%s': %v", p.Name, err)
				return err // Rollback
			}
		}
		return nil // Commit
	})

	if err != nil {
		log.Println("Error in packages seeder, transaction was rolled back:", err)
		return
	}

	log.Println("Packages seeder completed successfully.")
}

func (s *SeedStruct) SeedBranchRelations(store store.Storage, db *gorm.DB, ctx context.Context) {
	log.Println("Starting to seed branch relations...")

	allBranches, err := store.Branches.GetAllBranches(ctx)
	if err != nil || len(allBranches) == 0 {
		log.Fatalf("Fatal error: could not get branches or no branches found: %v", err)
		return
	}

	allServices, err := store.Products.GetAllServices(ctx)
	if err != nil || len(allServices) == 0 {
		log.Println("Warning: No services found. Skipping service-branch relations.")
	}

	allInstructors, err := store.Instructor.GetAllInstructors(ctx)
	if err != nil || len(allInstructors) == 0 {
		log.Println("Warning: No instructors found. Skipping instructor-branch relations.")
	}

	allEquipment, err := store.Equipment.GetAllEquipments(ctx)
	if err != nil || len(allEquipment) == 0 {
		log.Println("Warning: No equipment found. Skipping equipment-branch relations.")
	}

	allPaymentMethods, err := store.PaymentMethods.GetPaymentMethods(ctx)
	if err != nil || len(allPaymentMethods) == 0 {
		log.Println("Warning: No payment methods found. Skipping payment-branch relations.")
	}

	for _, branch := range allBranches {
		log.Printf("Processing relations for branch: %s", branch.Name)

		err := db.Transaction(func(tx *gorm.DB) error {
			if len(allServices) > 0 {
				numServices := rand.Intn(len(allServices)/2) + 5
				rand.Shuffle(len(allServices), func(i, j int) { allServices[i], allServices[j] = allServices[j], allServices[i] })

				var branchServices []*productsdomain.ServiceBranchDetail
				for i := 0; i < numServices && i < len(allServices); i++ {
					branchServices = append(branchServices, &productsdomain.ServiceBranchDetail{
						BranchID:          branch.BranchID,
						ServiceID:         allServices[i].ServiceID,
						IsVisible:         true,
						MaxCapacity:       rand.Intn(21) + 10, // 10-30
						PriceForMember:    float64(rand.Intn(31)+10) + rand.Float64(),
						PriceForNonMember: float64(rand.Intn(41)+20) + rand.Float64(),
						CreatedAt:         randomDateInLastSixMonths(),
					})
				}
				if err := store.Products.AssignBranchService(ctx, branchServices); err != nil {
					return fmt.Errorf("error assigning services to branch %s: %w", branch.Name, err)
				}
				log.Printf(" -> Assigned %d services to %s", len(branchServices), branch.Name)
			}

			if len(allInstructors) > 0 {
				numInstructors := rand.Intn(len(allInstructors)/2) + 2
				rand.Shuffle(len(allInstructors), func(i, j int) { allInstructors[i], allInstructors[j] = allInstructors[j], allInstructors[i] })

				var instructorIDs []uuid.UUID
				for i := 0; i < numInstructors && i < len(allInstructors); i++ {
					instructorIDs = append(instructorIDs, allInstructors[i].InstructorID)
				}
				if err := store.Instructor.AssignInstructorsToBranch(ctx, branch.BranchID, instructorIDs); err != nil {
					return fmt.Errorf("error assigning instructors to branch %s: %w", branch.Name, err)
				}
				log.Printf(" -> Assigned %d instructors to %s", len(instructorIDs), branch.Name)
			}

			if len(allEquipment) > 0 {
				numEquipment := rand.Intn(20) + 10
				for i := 0; i < numEquipment; i++ {
					equipment := allEquipment[rand.Intn(len(allEquipment))]
					inventoryItem := &inventorydomain.BranchInventory{
						BranchID:        branch.BranchID,
						EquipmentID:     equipment.EquipmentID,
						SerialNumber:    fmt.Sprintf("SN-%s-%d", equipment.Model, rand.Intn(99999)),
						Status:          inventorydomain.EquipmentAvailable,
						AcquisitionDate: &time.Time{},
						Notes:           "Seeded item",
						CreatedAt:       randomDateInLastSixMonths(),
					}
					if _, err := store.BranchInventory.Create(ctx, inventoryItem); err != nil {
						log.Printf("Could not create inventory item for branch %s: %v", branch.Name, err)
					}
				}
				log.Printf(" -> Assigned %d equipment items to %s", numEquipment, branch.Name)
			}

			if len(allPaymentMethods) > 0 {
				numMethods := rand.Intn(len(allPaymentMethods)) + 1
				rand.Shuffle(len(allPaymentMethods), func(i, j int) {
					allPaymentMethods[i], allPaymentMethods[j] = allPaymentMethods[j], allPaymentMethods[i]
				})

				var branchMethods []*billingdomain.PaymentMethodsBranch
				for i := 0; i < numMethods && i < len(allPaymentMethods); i++ {
					branchMethods = append(branchMethods, &billingdomain.PaymentMethodsBranch{
						BranchID:  branch.BranchID,
						MethodID:  allPaymentMethods[i].MethodID,
						IsActive:  true,
						CreatedAt: randomDateInLastSixMonths(),
					})
				}
				if err := store.PaymentMethods.AddPaymentMethodsToBranch(ctx, branchMethods); err != nil {
					return fmt.Errorf("error assigning payment methods to branch %s: %w", branch.Name, err)
				}
				log.Printf(" -> Assigned %d payment methods to %s", len(branchMethods), branch.Name)
			}

			return nil
		})
		if err != nil {
			log.Printf("Transaction failed for branch %s, rolling back. Error: %v", branch.Name, err)
		}
	}

	log.Println("Branch relations seeder completed successfully.")
}

func (s *SeedStruct) SeedClasses(store store.Storage, db *gorm.DB, ctx context.Context) {
	log.Println("Starting to seed classes...")

	allBranches, err := store.Branches.GetAllBranches(ctx)
	if err != nil || len(allBranches) == 0 {
		log.Fatalf("Fatal error: could not get branches or no branches found for class seeder: %v", err)
		return
	}

	openingHours := []int{6, 7, 8, 9, 10, 11, 16, 17, 18, 19, 20}

	startDate := time.Now().AddDate(0, -6, 0)
	endDate := time.Now().AddDate(0, 2, 0)

	var classesToCreate []scheduledomain.Class

	for _, branch := range allBranches {
		log.Printf("Generating classes for branch: %s", branch.Name)

		branchServices, err := store.Products.GetBranchService(ctx, branch.BranchID)
		if err != nil || len(branchServices) == 0 {
			log.Printf("Warning: No services found for branch %s. Skipping class generation.", branch.Name)
			continue
		}

		branchInstructors, err := store.Instructor.ListBranchInstructors(ctx, branch.BranchID, pagination.PaginatedFeedQuery{})
		if err != nil || len(branchInstructors) == 0 {
			log.Printf("Warning: No instructors found for branch %s. Skipping class generation.", branch.Name)
			continue
		}

		for d := startDate; d.Before(endDate); d = d.AddDate(0, 0, 1) {
			numClassesToday := rand.Intn(4) + 2

			rand.Shuffle(len(openingHours), func(i, j int) {
				openingHours[i], openingHours[j] = openingHours[j], openingHours[i]
			})

			for i := 0; i < numClassesToday; i++ {
				randomServiceDetail := branchServices[rand.Intn(len(branchServices))]
				randomInstructor := branchInstructors[rand.Intn(len(branchInstructors))]
				startHour := openingHours[i%len(openingHours)]
				startMinute := []int{0, 15, 30, 45}[rand.Intn(4)]

				startTime := time.Date(d.Year(), d.Month(), d.Day(), startHour, startMinute, 0, 0, d.Location())

				duration := time.Duration(randomServiceDetail.Service.DurationMinutes) * time.Minute
				endTime := startTime.Add(duration)

				secondsBeforeStart := rand.Intn(startTime.Hour()*60*60 + startTime.Minute()*60)
				createdAt := startTime.Add(-time.Duration(secondsBeforeStart) * time.Second)

				updatedAt := createdAt.Add(time.Duration(rand.Intn(secondsBeforeStart)) * time.Second)

				class := scheduledomain.Class{
					BranchID:     branch.BranchID,
					ServiceID:    randomServiceDetail.ServiceID,
					InstructorID: randomInstructor.InstructorID,
					StartsAt:     startTime,
					EndsAt:       endTime,
					MaxCapacity:  int(randomServiceDetail.MaxCapacity),
					IsVisible:    true,
					Notes:        "Clase generada por seeder",
					CreatedAt:    createdAt,
					UpdatedAt:    updatedAt,
				}
				classesToCreate = append(classesToCreate, class)
			}
		}
	}

	if len(classesToCreate) == 0 {
		log.Println("No classes were generated. Seeder finished.")
		return
	}

	log.Printf("Generated a total of %d classes. Inserting into database...", len(classesToCreate))

	if err := db.CreateInBatches(&classesToCreate, 1000).Error; err != nil {
		log.Fatalf("Fatal error during class batch insert: %v", err)
		return
	}

	log.Println("Classes seeder completed successfully.")
}

func (s *SeedStruct) SeedBookingsAndAttendance(store store.Storage, db *gorm.DB, ctx context.Context) {
	log.Println("Starting to seed bookings and attendance...")

	allBranches, err := store.Branches.GetAllBranches(ctx)
	if err != nil || len(allBranches) == 0 {
		log.Fatalf("Fatal: Could not get branches or no branches found: %v", err)
		return
	}
	allClients, err := store.Users.GetAllClients(ctx)
	if err != nil || len(allClients) == 0 {
		log.Fatalf("Fatal: Could not get clients or no clients found for booking seeder: %v", err)
		return
	}

	var bookingsToCreate []bookingdomain.Booking
	var attendanceToCreate []accessdomain.AttendanceLog
	now := time.Now()

	for _, branch := range allBranches {
		branchID := branch.BranchID
		log.Printf("Processing bookings for branch: %s", branch.Name)

		branchClasses, err := store.Schedule.GetClassesByBranch(ctx, branch.BranchID, nil, nil)
		if err != nil || len(branchClasses) == 0 {
			log.Printf("Warning: No classes found for branch %s. Skipping.", branch.Name)
			continue
		}

		for _, class := range branchClasses {
			if class.Service.Name == "Open Gym" {
				continue
			}

			minBookings := int(float64(class.MaxCapacity) * 0.4)
			maxBookings := class.MaxCapacity
			if minBookings > maxBookings {
				minBookings = maxBookings
			}
			if minBookings == 0 && maxBookings > 0 {
				minBookings = 1
			}

			numBookings := 0
			if maxBookings > minBookings {
				numBookings = rand.Intn(maxBookings-minBookings+1) + minBookings
			} else if maxBookings > 0 {
				numBookings = maxBookings
			}

			rand.Shuffle(len(allClients), func(i, j int) { allClients[i], allClients[j] = allClients[j], allClients[i] })

			for i := 0; i < numBookings && i < len(allClients); i++ {
				client := allClients[i]

				bookingDate := class.StartsAt.Add(-time.Hour * time.Duration(rand.Intn(48)+1)) // Reservado 1-48h antes
				booking := bookingdomain.Booking{
					UserID:    client.UserID,
					ClassID:   class.ClassID,
					Status:    bookingdomain.BookingStatusConfirmed,
					CreatedAt: bookingDate,
					UpdatedAt: bookingDate,
				}
				bookingsToCreate = append(bookingsToCreate, booking)

				if class.StartsAt.Before(now) {
					attended := rand.Intn(100) < 85

					attendance := accessdomain.AttendanceLog{
						UserID:    client.UserID,
						ClassID:   &class.ClassID,
						ServiceID: class.ServiceID,
						BranchID:  &branchID,
					}

					if attended {
						checkInOffset := time.Duration(rand.Intn(30)-15) * time.Minute
						attendance.CheckInTime = class.StartsAt.Add(checkInOffset)
						attendance.Status = accessdomain.AttendanceStatusAttended
					} else {
						attendance.CheckInTime = class.StartsAt
						attendance.Status = accessdomain.AttendanceStatusNoShow
					}
					attendance.CreatedAt = attendance.CheckInTime
					attendanceToCreate = append(attendanceToCreate, attendance)
				}
			}
		}
	}

	log.Printf("Generated %d bookings and %d attendance logs. Inserting into database...", len(bookingsToCreate), len(attendanceToCreate))
	if err := db.CreateInBatches(&bookingsToCreate, 1000).Error; err != nil {
		log.Fatalf("Fatal error during bookings batch insert: %v", err)
	}
	if err := db.CreateInBatches(&attendanceToCreate, 1000).Error; err != nil {
		log.Fatalf("Fatal error during attendance logs batch insert: %v", err)
	}

	log.Println("Bookings and attendance seeder completed successfully.")
}

func (s *SeedStruct) SeedInvoicesAndPayments(store store.Storage, db *gorm.DB, ctx context.Context, services appservices.Services) {
	log.Println("Starting to seed invoices and payments...")

	clients, err := store.Users.GetAllClients(ctx)
	if err != nil || len(clients) == 0 {
		log.Fatalf("Fatal: Could not get clients or no clients found: %v", err)
		return
	}

	allBranches, err := store.Branches.GetAllBranches(ctx)
	if err != nil || len(allBranches) == 0 {
		log.Fatalf("Fatal: Could not get branches or no branches found: %v", err)
		return
	}

	allValidPaymentMethods, err := store.PaymentMethods.GetPaymentMethods(ctx)
	if err != nil {
		log.Printf("Warning: Could not get payment methods: %v", err)
	}
	validPaymentMethodIDs := make(map[uuid.UUID]bool)
	for _, pm := range allValidPaymentMethods {
		validPaymentMethodIDs[pm.MethodID] = true
	}

	membershipTypes, err := store.Membership.GetAllMembershipTypes(ctx)
	if err != nil {
		log.Printf("Warning: Could not get membership types: %v", err)
	}

	packages, err := store.Combos.GetAllPackages(ctx)
	if err != nil {
		log.Printf("Warning: Could not get packages: %v", err)
	}

	log.Printf("Seeding invoices for %d clients...", len(clients))

	for _, client := range clients {
		numInvoices := rand.Intn(5) + 1
		log.Printf(" -> Generating %d invoices for client %s %s", numInvoices, client.FirstName, client.LastName)

		for i := 0; i < numInvoices; i++ {
			branch := allBranches[rand.Intn(len(allBranches))]
			itemType := []string{"membership", "package", "service"}[rand.Intn(3)]

			var itemsToPurchase []billingdomain.InvoiceItem
			var invoice billingdomain.Invoice

			switch itemType {
			case "membership":
				if len(membershipTypes) == 0 {
					continue
				}
				membership := membershipTypes[rand.Intn(len(membershipTypes))]
				itemsToPurchase = append(itemsToPurchase, billingdomain.InvoiceItem{
					MembershipTypeID: uuid.NullUUID{UUID: membership.MembershipTypeID, Valid: true},
					Quantity:         1,
				})

			case "package":
				if len(packages) == 0 {
					continue
				}
				pkg := packages[rand.Intn(len(packages))]
				itemsToPurchase = append(itemsToPurchase, billingdomain.InvoiceItem{
					PackageID: uuid.NullUUID{UUID: pkg.PackageID, Valid: true},
					Quantity:  1,
				})

			case "service":
				branchServices, _ := store.Products.GetBranchService(ctx, branch.BranchID)
				if len(branchServices) == 0 {
					continue
				}
				service := branchServices[rand.Intn(len(branchServices))]
				itemsToPurchase = append(itemsToPurchase, billingdomain.InvoiceItem{
					ServiceID: uuid.NullUUID{UUID: service.ServiceID, Valid: true},
					Quantity:  1,
				})
			}

			if len(itemsToPurchase) == 0 {
				continue
			}

			invoice.UserID = client.UserID
			invoice.BranchID = branch.BranchID
			invoice.Status = billingdomain.InvoiceStatusUnpaid
			if err := services.BillingServices.CreateInvoice(ctx, &invoice, itemsToPurchase); err != nil {
				log.Printf("Error creating invoice for client %s: %v", client.Email, err)
				continue
			}

			issueDate := randomDateInLastSixMonths()
			db.Model(&invoice).Updates(map[string]interface{}{
				"issue_date": issueDate,
				"due_date":   issueDate.AddDate(0, 0, 15),
				"created_at": issueDate,
				"updated_at": issueDate,
			})

			branchPaymentMethods, _ := store.PaymentMethods.GetPaymentMethodsFromBranch(ctx, branch.BranchID)

			var validBranchMethods []*billingdomain.PaymentMethodsBranch
			for _, bpm := range branchPaymentMethods {
				if validPaymentMethodIDs[bpm.MethodID] {
					validBranchMethods = append(validBranchMethods, bpm)
				}
			}

			if len(validBranchMethods) == 0 {
				log.Printf("Warning: No valid payment methods for branch %s. Cannot simulate payment for invoice %s", branch.Name, invoice.InvoiceID)
				continue
			}

			numPayments := rand.Intn(2) + 1
			remainingAmount := invoice.TotalAmount

			for p := 0; p < numPayments && remainingAmount.IsPositive(); p++ {
				paymentMethod := validBranchMethods[rand.Intn(len(validBranchMethods))]
				amountToPay := remainingAmount
				if numPayments > 1 && p < numPayments-1 {
					amountToPay = remainingAmount.Div(decimal.NewFromInt(2))
				}

				payment := &billingdomain.Payment{
					InvoiceID:       invoice.InvoiceID,
					AmountPaid:      amountToPay,
					CurrencyPaid:    "USD",
					PaymentMethodID: paymentMethod.MethodID,
					Status:          billingdomain.PaymentStatusCompleted,
					TransactionID:   sql.NullString{String: fmt.Sprintf("%d", rand.Intn(999999999)), Valid: true},
					ReceiptURL:      sql.NullString{String: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwHvQiRst-0u9tagSYhjZn44xMn1jibvXCIQ&s", Valid: true},
				}

				if err := services.BillingServices.AddPaymentToInvoice(ctx, payment); err != nil {
					log.Printf("Error adding payment to invoice %s: %v", invoice.InvoiceID, err)
					break
				}

				paymentDate := issueDate.Add(time.Hour * time.Duration(rand.Intn(72)))
				db.Model(&payment).Updates(map[string]interface{}{
					"payment_date": paymentDate,
					"created_at":   paymentDate,
					"updated_at":   paymentDate,
				})

				remainingAmount = remainingAmount.Sub(amountToPay)
			}
			log.Printf("    - Created invoice %s with %d payment(s)", invoice.InvoiceID, numPayments)
		}
	}

	log.Println("Invoices and payments seeder completed successfully.")
}
func (s *SeedStruct) SeedStaffAssignment(store store.Storage, db *gorm.DB, ctx context.Context, services appservices.Services) {
	log.Println("Starting seeding staff assignments for ALL eligible users...")

	var users []*authdomain.Users
	err := db.Preload("Role").
		Joins("JOIN roles ON roles.role_id = users.role_id").
		Where("roles.name NOT IN ?", []string{"client", "instructor", "super_admin", "branch_admin"}).
		Find(&users).Error

	if err != nil {
		log.Printf("Error fetching eligible users: %v", err)
		return
	}

	if len(users) == 0 {
		log.Println("No eligible users found.")
		return
	}

	branches, err := store.Branches.GetAllBranches(ctx)
	if err != nil {
		log.Printf("Error fetching branches: %v", err)
		return
	}

	if len(branches) == 0 {
		log.Println("No branches found.")
		return
	}

	log.Printf("Found %d users and %d branches. Starting assignment...", len(users), len(branches))

	successCount := 0

	for _, user := range users {
		numBranches := 1
		if user.Role.Name != "receptionist" {
			maxB := 3
			if len(branches) < maxB {
				maxB = len(branches)
			}
			numBranches = rand.Intn(maxB) + 1
		}

		rand.Shuffle(len(branches), func(i, j int) { branches[i], branches[j] = branches[j], branches[i] })

		assigned := false
		for i := 0; i < numBranches; i++ {
			targetBranch := branches[i]
			log.Printf("Assigning User: %s (Role: %s) to Branch: %s", user.FirstName, user.Role.Name, targetBranch.Name)

			if err := services.Staff.AssignStaffToBranch(ctx, targetBranch.BranchID, []uuid.UUID{user.UserID}); err != nil {
				log.Printf("Failed to assign user %s to branch %s: %v", user.UserID, targetBranch.Name, err)
			} else {
				assigned = true
			}
		}

		if assigned {
			successCount++
		}
	}

	log.Printf("Staff assignment seeding completed. Successfully assigned: %d/%d users.", successCount, len(users))
}

type policyJSON struct {
	PolicyKey   string   `json:"policy_key"`
	DisplayName string   `json:"display_name"`
	Description string   `json:"description"`
	Value       string   `json:"value"`
	DataType    string   `json:"data_type"`
	MinLimit    *float64 `json:"min_limit"`
	MaxLimit    *float64 `json:"max_limit"`
	IsActive    bool     `json:"is_active"`
}

func (s *SeedStruct) SeedPolicies(store store.Storage, db *gorm.DB, ctx context.Context) {
	jsonFile, err := os.ReadFile("./internal/migrate/seed/data/policies.json")
	if err != nil {
		log.Fatalf("Fatal error: could not read policies.json file: %v", err)
		return
	}

	var policiesFromJSON []policyJSON
	if err = json.Unmarshal(jsonFile, &policiesFromJSON); err != nil {
		log.Fatalf("Fatal error: could not decode policies.json: %v", err)
		return
	}

	log.Printf("Found %d policies in policies.json. Starting seeder...", len(policiesFromJSON))

	err = db.Transaction(func(tx *gorm.DB) error {
		for _, p := range policiesFromJSON {
			policy := &policiesdomain.CommercialPolicy{
				PolicyKey:   p.PolicyKey,
				DisplayName: p.DisplayName,
				Description: p.Description,
				Value:       p.Value,
				DataType:    p.DataType,
				MinLimit:    p.MinLimit,
				MaxLimit:    p.MaxLimit,
				IsActive:    p.IsActive,
				CreatedAt:   time.Now(),
			}

			if err := store.Policies.CreatePolicyTx(ctx, tx, policy); err != nil {
				log.Printf("Error creating policy '%s': %v", p.PolicyKey, err)
				return err
			}
		}
		return nil
	})

	if err != nil {
		log.Println("Error in policies seeder, transaction was rolled back:", err)
		return
	}

	log.Println("Policies seeder completed successfully.")
}

type exerciseJSON struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	MuscleGroup string `json:"muscle_group"`
	VideoURL    string `json:"video_url"`
}

func (s *SeedStruct) SeedExercises(store store.Storage, db *gorm.DB, ctx context.Context) {
	jsonFile, err := os.ReadFile("./internal/migrate/seed/data/exercises.json")
	if err != nil {
		log.Fatalf("Fatal error: could not read exercises.json file: %v", err)
		return
	}

	if len(jsonFile) == 0 {
		log.Println("exercises.json is empty, skipping.")
		return
	}

	var exercisesFromJSON []exerciseJSON
	if err = json.Unmarshal(jsonFile, &exercisesFromJSON); err != nil {
		log.Fatalf("Fatal error: could not decode exercises.json: %v", err)
		return
	}

	log.Printf("Found %d exercises in exercises.json. Starting seeder...", len(exercisesFromJSON))

	err = db.Transaction(func(tx *gorm.DB) error {
		for _, ex := range exercisesFromJSON {
			exercise := &routinedomain.Exercise{
				Name:        ex.Name,
				Description: ex.Description,
				MuscleGroup: routinedomain.MuscleGroup(ex.MuscleGroup),
				VideoURL:    ex.VideoURL,
				CreatedAt:   randomDateInLastSixMonths(),
			}

			if err := tx.Create(exercise).Error; err != nil {
				log.Printf("Error creating exercise '%s': %v", ex.Name, err)
				return err
			}
		}
		return nil
	})

	if err != nil {
		log.Println("Error in exercises seeder, transaction was rolled back:", err)
		return
	}

	log.Println("Exercises seeder completed successfully.")
}

func main() {
	cfg := config.LoadConfig()

	addr := env.GetString("DB_ADDR", "")
	conn, err := db.New(addr, 3, 3, "15m")
	if err != nil {
		log.Fatal(err)
	}
	var rdb *redis.Client
	if cfg.RedisCfg.Enabled {
		rdb = cache.NewRedisClient(cfg.RedisCfg.Addr, cfg.RedisCfg.Username, cfg.RedisCfg.Pw, cfg.RedisCfg.Db)
		log.Print("redis cache connection established")

		defer rdb.Close()
	}
	appStore := store.NewStorage(conn)

	logger, _ := zap.NewProduction()
	sugaredLogger := logger.Sugar()
	testAuth := &authmocks.TestAuthenticator{}
	mailer := &mailermocks.MockMailer{}
	cache := cache.NewRedisStorage(rdb)

	mailer.On("Send", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(200, nil)
	pushNoti := notifications.NewMockPushService()

	service := appservices.NewServices(appStore, sugaredLogger, *cfg, testAuth, mailer, cache, *pushNoti, nil, nil)
	s := NewSeedStruct()
	s.Seed(appStore, conn, service)

}
