package handler

import (
	"net/http"
	"os"

	"github.com/co2evidence/ledger/internal/db"
	"github.com/co2evidence/ledger/internal/httpapi"
)

// Handler is the Vercel serverless function entry point
// It implements the http.HandlerFunc signature for Vercel Go runtime
var api *httpapi.API

func init() {
	// Initialize database connection on cold start
	database, err := db.Connect()
	if err != nil {
		// Log but don't panic - health endpoint should still work
		return
	}

	// Run migrations
	if err := database.RunMigrations("./migrations"); err != nil {
		return
	}

	api = httpapi.NewAPI(database)
}

// Handler is the entry point for Vercel serverless functions
func Handler(w http.ResponseWriter, r *http.Request) {
	if api == nil {
		// Try to initialize on each request if init failed
		database, err := db.Connect()
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusServiceUnavailable)
			w.Write([]byte(`{"error":"Database not available"}`))
			return
		}
		api = httpapi.NewAPI(database)
	}

	api.ServeHTTP(w, r)
}

// For local development
func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		Handler(w, r)
	})

	http.ListenAndServe(":"+port, nil)
}
