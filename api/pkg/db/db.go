package db

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	ormlogger "gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

var (
	QueryTimeoutDuration = time.Second * 5
)

func NewPGDB(addr string, maxOpenConnsm int, maxIdleConns int, maxIdleTime string) (*sql.DB, error) {
	db, err := sql.Open("postgres", addr)
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(maxOpenConnsm)
	db.SetMaxIdleConns(maxIdleConns)
	duration, err := time.ParseDuration(maxIdleTime)
	if err != nil {
		return nil, err
	}
	db.SetConnMaxIdleTime(duration)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	if err = db.PingContext(ctx); err != nil {
		return nil, err
	}

	return db, nil

}

func New(addr string, maxOpenConns int, maxIdleConns int, maxIdleTime string) (*gorm.DB, error) {

	db, err := gorm.Open(postgres.Open(addr), &gorm.Config{
		Logger: ormlogger.Default.LogMode(ormlogger.Info),
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
	})
	if err != nil {

		return nil, fmt.Errorf("connection failed with the GORM data base: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("couln't get the generic database object: %w", err)
	}

	sqlDB.SetMaxOpenConns(maxOpenConns)
	sqlDB.SetMaxIdleConns(maxIdleConns)

	duration, err := time.ParseDuration(maxIdleTime)
	if err != nil {
		return nil, fmt.Errorf("error parsing MaxIdleTime '%s': %w", maxIdleTime, err)
	}
	sqlDB.SetConnMaxIdleTime(duration)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	if err = sqlDB.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("ping to the database failed: %w", err)
	}

	return db, nil
}

func WithTX(db *gorm.DB, fn func(tx *gorm.DB) error) error {
	return db.Transaction(fn)
}
