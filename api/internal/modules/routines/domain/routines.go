package routinedomain

import (
	"time"

	"github.com/google/uuid"
	authdomain "github.com/vitalfit/api/internal/modules/auth/domain"
	instructordomain "github.com/vitalfit/api/internal/modules/instructor/domain"
	"gorm.io/gorm"
)

type MuscleGroup string

const (
	MuscleChest     MuscleGroup = "Chest"
	MuscleBack      MuscleGroup = "Back"
	MuscleLegs      MuscleGroup = "Legs"
	MuscleShoulders MuscleGroup = "Shoulders"
	MuscleArms      MuscleGroup = "Arms"
	MuscleCore      MuscleGroup = "Core"
	MuscleCardio    MuscleGroup = "Cardio"
	MuscleFullBody  MuscleGroup = "FullBody"
	MuscleOther     MuscleGroup = "Other"
)

type RoutineLevel string

const (
	LevelBeginner     RoutineLevel = "Beginner"
	LevelIntermediate RoutineLevel = "Intermediate"
	LevelAdvanced     RoutineLevel = "Advanced"
)

type RoutineStatus string

const (
	StatusActive    RoutineStatus = "Active"
	StatusCompleted RoutineStatus = "Completed"
	StatusArchived  RoutineStatus = "Archived"
)

type Exercise struct {
	ExerciseID  uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"exercise_id"`
	Name        string    `gorm:"type:varchar(100);not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	VideoURL    string    `gorm:"type:varchar(255)" json:"video_url"`

	MuscleGroup MuscleGroup `gorm:"type:muscle_group_enum" json:"muscle_group"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Exercise) TableName() string {
	return "exercises"
}

type Routine struct {
	RoutineID   uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"routine_id"`
	ServiceID   *uuid.UUID `gorm:"type:uuid" json:"service_id,omitempty"`
	Name        string     `gorm:"type:varchar(100);not null" json:"name"`
	Description string     `gorm:"type:text" json:"description"`

	CreatorID *uuid.UUID        `gorm:"type:uuid" json:"creator_id,omitempty"`
	Creator   *authdomain.Users `gorm:"foreignKey:CreatorID;references:UserID" json:"creator,omitempty"`

	Level RoutineLevel `gorm:"type:routine_level_enum;not null" json:"level"`

	RoutineExercises []RoutineExercise `gorm:"foreignKey:RoutineID" json:"exercises,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Routine) TableName() string {
	return "routines"
}

type RoutineExercise struct {
	RoutineExerciseID uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"routine_exercise_id"`

	RoutineID  uuid.UUID `gorm:"type:uuid;not null" json:"routine_id"`
	ExerciseID uuid.UUID `gorm:"type:uuid;not null" json:"exercise_id"`

	Exercise Exercise `gorm:"foreignKey:ExerciseID;references:ExerciseID" json:"exercise_details,omitempty"`

	Sets     int    `gorm:"not null" json:"sets"`
	Reps     string `gorm:"type:varchar(20);not null" json:"reps"`
	RestTime int    `gorm:"default:60" json:"rest_time"`

	Order int `gorm:"not null;column:order" json:"order"`

	Notes string `gorm:"type:text" json:"notes"`
}

func (RoutineExercise) TableName() string {
	return "routine_exercises"
}

type UserRoutine struct {
	UserRoutineID uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"user_routine_id"`

	ClientID     uuid.UUID  `gorm:"type:uuid;not null" json:"client_id"`
	InstructorID *uuid.UUID `gorm:"type:uuid" json:"instructor_id"`
	RoutineID    uuid.UUID  `gorm:"type:uuid;not null" json:"routine_id"`

	Routine Routine `gorm:"foreignKey:RoutineID;references:RoutineID" json:"routine,omitempty"`

	Instructor instructordomain.Instructor `gorm:"foreignKey:InstructorID;references:InstructorID" json:"instructor,omitempty"`
	Client     authdomain.Users            `gorm:"foreignKey:ClientID" json:"client,omitempty"`

	AssignedDate    time.Time     `gorm:"default:now()" json:"assigned_date"`
	DueDate         *time.Time    `json:"due_date,omitempty"`
	Status          RoutineStatus `gorm:"type:routine_status_enum;default:'Active'" json:"status"`
	IsActive        bool          `gorm:"default:true" json:"is_active"`
	CompletionCount int           `gorm:"default:0" json:"completion_count"`
	LastCompletedAt *time.Time    `json:"last_completed_at,omitempty"`
}

func (UserRoutine) TableName() string {
	return "user_routines"
}
