package db

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
)

// Database wraps sql.DB with application-specific methods
type Database struct {
	*sql.DB
}

// Connect establishes connection to PostgreSQL
func Connect() (*Database, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL environment variable not set")
	}

	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Test connection
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	return &Database{db}, nil
}

// RunMigrations executes SQL migrations
func (d *Database) RunMigrations(migrationsDir string) error {
	// Check if migration 1 already applied
	var exists bool
	err := d.QueryRow("SELECT EXISTS(SELECT 1 FROM migration_history WHERE version = 1)").Scan(&exists)
	if err != nil {
		// Table might not exist yet, create it
		_, err = d.Exec(`CREATE TABLE IF NOT EXISTS migration_history (
			version INTEGER PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			description TEXT
		)`)
		if err != nil {
			return fmt.Errorf("failed to create migration_history: %w", err)
		}
	} else if exists {
		return nil // Already applied
	}

	// Read and execute migration file
	migrationSQL, err := os.ReadFile(migrationsDir + "/001_initial_schema.sql")
	if err != nil {
		return fmt.Errorf("failed to read migration file: %w", err)
	}

	_, err = d.Exec(string(migrationSQL))
	if err != nil {
		return fmt.Errorf("failed to execute migration: %w", err)
	}

	return nil
}

// IsReady checks if database is accessible
func (d *Database) IsReady() bool {
	return d.Ping() == nil
}
