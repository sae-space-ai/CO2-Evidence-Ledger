package main

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"strings"
	"syscall"

	"github.com/co2evidence/ledger/internal/auth"
	"github.com/co2evidence/ledger/internal/db"
	"github.com/google/uuid"
	"golang.org/x/term"
)

func main() {
	fmt.Println("CO2 Evidence Ledger - Bootstrap Tool")
	fmt.Println("=====================================")
	fmt.Println()

	// Connect to database
	database, err := db.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Run migrations
	fmt.Println("Running migrations...")
	if err := database.RunMigrations("./migrations"); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	fmt.Println("✓ Migrations complete")
	fmt.Println()

	// Check if admin already exists
	var exists bool
	err = database.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE role = 'owner')").Scan(&exists)
	if err != nil {
		log.Fatalf("Failed to check existing users: %v", err)
	}

	if exists {
		fmt.Println("⚠ Admin user already exists. Bootstrap complete.")
		return
	}

	// Create organization
	reader := bufio.NewReader(os.Stdin)
	fmt.Print("Organization name: ")
	orgName, _ := reader.ReadString('\n')
	orgName = strings.TrimSpace(orgName)
	if orgName == "" {
		orgName = "Default Organization"
	}

	orgID := uuid.New().String()
	_, err = database.Exec(`
		INSERT INTO organizations (id, name, created_at, updated_at)
		VALUES ($1, $2, NOW(), NOW())
	`, orgID, orgName)
	if err != nil {
		log.Fatalf("Failed to create organization: %v", err)
	}
	fmt.Printf("✓ Organization created: %s (%s)\n", orgName, orgID)

	// Get admin details
	fmt.Print("Admin email: ")
	email, _ := reader.ReadString('\n')
	email = strings.TrimSpace(email)

	fmt.Print("Admin name: ")
	name, _ := reader.ReadString('\n')
	name = strings.TrimSpace(name)

	fmt.Print("Admin password (min 12 chars): ")
	passwordBytes, err := term.ReadPassword(int(syscall.Stdin))
	if err != nil {
		log.Fatalf("Failed to read password: %v", err)
	}
	password := string(passwordBytes)
	fmt.Println()

	if err := auth.ValidatePasswordStrength(password); err != nil {
		log.Fatalf("Password too weak: %v", err)
	}

	// Hash password
	hash, err := auth.HashPassword(password)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	// Create admin user
	userID := uuid.New().String()
	_, err = database.Exec(`
		INSERT INTO users (id, organization_id, email, name, password_hash, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, 'owner', NOW(), NOW())
	`, userID, orgID, email, name, hash)
	if err != nil {
		log.Fatalf("Failed to create admin user: %v", err)
	}

	fmt.Println()
	fmt.Println("✓ Bootstrap complete!")
	fmt.Printf("  Organization: %s\n", orgName)
	fmt.Printf("  Admin email: %s\n", email)
	fmt.Printf("  Admin role: owner\n")
	fmt.Println()
	fmt.Println("You can now start the server with: go run cmd/server/main.go")
}
