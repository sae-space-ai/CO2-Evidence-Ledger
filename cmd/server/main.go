package main

import (
	"log"
	"net/http"
	"os"

	"github.com/co2evidence/ledger/internal/db"
	"github.com/co2evidence/ledger/internal/httpapi"
)

func main() {
	// Load environment variables
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Connect to database
	database, err := db.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Run migrations
	if err := database.RunMigrations("./migrations"); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Create API handler
	api := httpapi.NewAPI(database)

	// Start server
	log.Printf("CO2 Evidence Ledger API starting on port %s", port)
	log.Printf("Health check: http://localhost:%s/api/health", port)
	log.Printf("Ready check: http://localhost:%s/api/ready", port)

	if err := http.ListenAndServe(":"+port, api); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
