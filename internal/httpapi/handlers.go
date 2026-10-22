package httpapi

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/co2evidence/ledger/internal/auth"
	"github.com/co2evidence/ledger/internal/db"
	"github.com/co2evidence/ledger/internal/domain"
	"github.com/co2evidence/ledger/internal/ledger"
	"github.com/google/uuid"
)

// API handles all REST endpoints
type API struct {
	DB *db.Database
}

// NewAPI creates a new API handler
func NewAPI(database *db.Database) *API {
	return &API{DB: database}
}

// ServeHTTP routes requests to appropriate handlers
func (api *API) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// CORS headers
	w.Header().Set("Access-Control-Allow-Origin", r.Header.Get("Origin"))
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Allow-Credentials", "true")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Security headers
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Frame-Options", "DENY")
	w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

	path := r.URL.Path

	// Health endpoints (no auth required)
	if path == "/api/health" {
		api.handleHealth(w, r)
		return
	}
	if path == "/api/ready" {
		api.handleReady(w, r)
		return
	}

	// Auth endpoints
	if path == "/api/v1/auth/login" {
		api.handleLogin(w, r)
		return
	}
	if path == "/api/v1/auth/logout" {
		api.handleLogout(w, r)
		return
	}
	if path == "/api/v1/auth/me" {
		api.handleMe(w, r)
		return
	}

	// Protected endpoints require authentication
	user, err := api.authenticateRequest(r)
	if err != nil {
		api.writeError(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	// Route to handlers
	switch {
	case path == "/api/v1/organizations":
		api.handleOrganizations(w, r, user)
	case strings.HasPrefix(path, "/api/v1/projects"):
		api.handleProjects(w, r, user)
	case strings.HasPrefix(path, "/api/v1/activities"):
		api.handleActivities(w, r, user)
	case strings.HasPrefix(path, "/api/v1/evidence"):
		api.handleEvidence(w, r, user)
	case strings.HasPrefix(path, "/api/v1/claims"):
		api.handleClaims(w, r, user)
	default:
		api.writeError(w, http.StatusNotFound, "Endpoint not found")
	}
}

// ============ Health Endpoints ============

func (api *API) handleHealth(w http.ResponseWriter, r *http.Request) {
	api.writeJSON(w, http.StatusOK, map[string]string{
		"status": "ok",
		"time":   time.Now().UTC().Format(time.RFC3339),
	})
}

func (api *API) handleReady(w http.ResponseWriter, r *http.Request) {
	ready := api.DB.IsReady()
	status := http.StatusOK
	if !ready {
		status = http.StatusServiceUnavailable
	}
	api.writeJSON(w, status, map[string]interface{}{
		"ready":    ready,
		"database": "PostgreSQL",
	})
}

// ============ Auth Endpoints ============

func (api *API) handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		api.writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Find user
	var user domain.User
	err := api.DB.QueryRow(`
		SELECT id, organization_id, email, name, role FROM users WHERE email = $1
	`, req.Email).Scan(&user.ID, &user.OrganizationID, &user.Email, &user.Name, &user.Role)

	if err == sql.ErrNoRows {
		api.writeError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}
	if err != nil {
		log.Printf("Database error: %v", err)
		api.writeError(w, http.StatusInternalServerError, "Internal error")
		return
	}

	// Verify password (need to get hash separately)
	var passwordHash string
	err = api.DB.QueryRow("SELECT password_hash FROM users WHERE id = $1", user.ID).Scan(&passwordHash)
	if err != nil {
		api.writeError(w, http.StatusInternalServerError, "Internal error")
		return
	}

	valid, err := auth.VerifyPassword(req.Password, passwordHash)
	if err != nil || !valid {
		api.writeError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Create session
	token, err := auth.GenerateSessionToken()
	if err != nil {
		api.writeError(w, http.StatusInternalServerError, "Failed to create session")
		return
	}

	tokenHash := auth.HashToken(token)
	expiresAt := auth.SessionExpiry()

	_, err = api.DB.Exec(`
		INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)
	`, uuid.New().String(), user.ID, tokenHash, expiresAt)
	if err != nil {
		log.Printf("Failed to create session: %v", err)
		api.writeError(w, http.StatusInternalServerError, "Failed to create session")
		return
	}

	// Set secure cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    token,
		Path:     "/",
		Expires:  expiresAt,
		HttpOnly: true,
		Secure:   r.TLS != nil,
		SameSite: http.SameSiteStrictMode,
	})

	api.writeJSON(w, http.StatusOK, user)
}

func (api *API) handleLogout(w http.ResponseWriter, r *http.Request) {
	// Get session token from cookie
	cookie, err := r.Cookie("session_token")
	if err != nil {
		api.writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
		return
	}

	tokenHash := auth.HashToken(cookie.Value)
	_, _ = api.DB.Exec("UPDATE sessions SET revoked_at = NOW() WHERE token_hash = $1", tokenHash)

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})

	api.writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (api *API) handleMe(w http.ResponseWriter, r *http.Request) {
	user, err := api.authenticateRequest(r)
	if err != nil {
		api.writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}
	api.writeJSON(w, http.StatusOK, user)
}

// ============ Organizations ============

func (api *API) handleOrganizations(w http.ResponseWriter, r *http.Request, user *domain.User) {
	switch r.Method {
	case "GET":
		var org domain.Organization
		err := api.DB.QueryRow(`
			SELECT id, name, created_at, updated_at FROM organizations WHERE id = $1
		`, user.OrganizationID).Scan(&org.ID, &org.Name, &org.CreatedAt, &org.UpdatedAt)
		if err != nil {
			api.writeError(w, http.StatusInternalServerError, "Failed to fetch organization")
			return
		}
		api.writeJSON(w, http.StatusOK, []domain.Organization{org})

	case "POST":
		if user.Role != "owner" {
			api.writeError(w, http.StatusForbidden, "Only owners can create organizations")
			return
		}
		var req struct {
			Name string `json:"name"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			api.writeError(w, http.StatusBadRequest, "Invalid request")
			return
		}

		org := domain.Organization{
			ID:        uuid.New().String(),
			Name:      req.Name,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		_, err := api.DB.Exec(`
			INSERT INTO organizations (id, name, created_at, updated_at) VALUES ($1, $2, $3, $4)
		`, org.ID, org.Name, org.CreatedAt, org.UpdatedAt)
		if err != nil {
			api.writeError(w, http.StatusInternalServerError, "Failed to create organization")
			return
		}

		api.writeJSON(w, http.StatusCreated, org)

	default:
		api.writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// ============ Projects ============

func (api *API) handleProjects(w http.ResponseWriter, r *http.Request, user *domain.User) {
	switch r.Method {
	case "GET":
		rows, err := api.DB.Query(`
			SELECT id, organization_id, name, description, operational_boundary, reporting_year, created_at, updated_at
			FROM projects WHERE organization_id = $1 ORDER BY created_at DESC
		`, user.OrganizationID)
		if err != nil {
			api.writeError(w, http.StatusInternalServerError, "Failed to fetch projects")
			return
		}
		defer rows.Close()

		var projects []domain.Project
		for rows.Next() {
			var p domain.Project
			if err := rows.Scan(&p.ID, &p.OrganizationID, &p.Name, &p.Description,
				&p.OperationalBoundary, &p.ReportingYear, &p.CreatedAt, &p.UpdatedAt); err != nil {
				continue
			}
			projects = append(projects, p)
		}
		api.writeJSON(w, http.StatusOK, projects)

	case "POST":
		var req struct {
			Name               string `json:"name"`
			Description        string `json:"description"`
			OperationalBoundary string `json:"operationalBoundary"`
			ReportingYear      int    `json:"reportingYear"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			api.writeError(w, http.StatusBadRequest, "Invalid request")
			return
		}

		project := domain.Project{
			ID:                  uuid.New().String(),
			OrganizationID:      user.OrganizationID,
			Name:                req.Name,
			Description:         req.Description,
			OperationalBoundary: req.OperationalBoundary,
			ReportingYear:       req.ReportingYear,
			CreatedAt:           time.Now(),
			UpdatedAt:           time.Now(),
		}

		_, err := api.DB.Exec(`
			INSERT INTO projects (id, organization_id, name, description, operational_boundary, reporting_year, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		`, project.ID, project.OrganizationID, project.Name, project.Description,
			project.OperationalBoundary, project.ReportingYear, project.CreatedAt, project.UpdatedAt)
		if err != nil {
			api.writeError(w, http.StatusInternalServerError, "Failed to create project")
			return
		}

		api.writeJSON(w, http.StatusCreated, project)

	default:
		api.writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// ============ Activities ============

func (api *API) handleActivities(w http.ResponseWriter, r *http.Request, user *domain.User) {
	switch r.Method {
	case "GET":
		projectID := r.URL.Query().Get("projectId")
		if projectID == "" {
			api.writeError(w, http.StatusBadRequest, "projectId required")
			return
		}

		rows, err := api.DB.Query(`
			SELECT id, project_id, organization_id, name, category, scope, period_start, period_end,
				quantity, unit, factor_value, factor_source, factor_year, method, notes,
				result_kg_co2e, result_t_co2e, created_at, updated_at
			FROM activities WHERE project_id = $1 AND organization_id = $2
		`, projectID, user.OrganizationID)
		if err != nil {
			api.writeError(w, http.StatusInternalServerError, "Failed to fetch activities")
			return
		}
		defer rows.Close()

		var activities []domain.Activity
		for rows.Next() {
			var a domain.Activity
			var quantity, factorValue, resultKg, resultT sql.NullString
			if err := rows.Scan(&a.ID, &a.ProjectID, &a.OrganizationID, &a.Name, &a.Category,
				&a.Scope, &a.PeriodStart, &a.PeriodEnd, &quantity, &a.Unit, &factorValue,
				&a.FactorSource, &a.FactorYear, &a.Method, &a.Notes, &resultKg, &resultT,
				&a.CreatedAt, &a.UpdatedAt); err != nil {
				continue
			}
			a.Quantity = quantity.String
			a.FactorValue = factorValue.String
			a.ResultKgCO2e = resultKg.String
			a.ResultTCO2e = resultT.String
			activities = append(activities, a)
		}
		api.writeJSON(w, http.StatusOK, activities)

	case "POST":
		var req struct {
			ProjectID    string `json:"projectId"`
			Name         string `json:"name"`
			Category     string `json:"category"`
			PeriodStart  string `json:"periodStart"`
			PeriodEnd    string `json:"periodEnd"`
			Quantity     string `json:"quantity"`
			Unit         string `json:"unit"`
			FactorValue  string `json:"factorValue"`
			FactorSource string `json:"factorSource"`
			FactorYear   int    `json:"factorYear"`
			Method       string `json:"method"`
			Notes        string `json:"notes"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			api.writeError(w, http.StatusBadRequest, "Invalid request")
			return
		}

		// Calculate emissions using exact decimal arithmetic
		q := new(big.Rat)
		f := new(big.Rat)
		if _, ok := q.SetString(req.Quantity); !ok {
			api.writeError(w, http.StatusBadRequest, "Invalid quantity")
			return
		}
		if _, ok := f.SetString(req.FactorValue); !ok {
			api.writeError(w, http.StatusBadRequest, "Invalid factor")
			return
		}

		resultKg := new(big.Rat).Mul(q, f)
		resultT := new(big.Rat).Quo(resultKg, big.NewRat(1000, 1))

		scope := 1
		if req.Category == "electricity" {
			scope = 2
		}

		activity := domain.Activity{
			ID:             uuid.New().String(),
			ProjectID:      req.ProjectID,
			OrganizationID: user.OrganizationID,
			Name:           req.Name,
			Category:       req.Category,
			Scope:          scope,
			PeriodStart:    req.PeriodStart,
			PeriodEnd:      req.PeriodEnd,
			Quantity:       req.Quantity,
			Unit:           req.Unit,
			FactorValue:    req.FactorValue,
			FactorSource:   req.FactorSource,
			FactorYear:     req.FactorYear,
			Method:         req.Method,
			Notes:          req.Notes,
			ResultKgCO2e:   resultKg.FloatString(6),
			ResultTCO2e:    resultT.FloatString(6),
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}

		_, err := api.DB.Exec(`
			INSERT INTO activities (id, project_id, organization_id, name, category, scope,
				period_start, period_end, quantity, unit, factor_value, factor_source, factor_year,
				method, notes, result_kg_co2e, result_t_co2e, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
		`, activity.ID, activity.ProjectID, activity.OrganizationID, activity.Name, activity.Category,
			activity.Scope, activity.PeriodStart, activity.PeriodEnd, activity.Quantity, activity.Unit,
			activity.FactorValue, activity.FactorSource, activity.FactorYear, activity.Method,
			activity.Notes, activity.ResultKgCO2e, activity.ResultTCO2e, activity.CreatedAt, activity.UpdatedAt)
		if err != nil {
			api.writeError(w, http.StatusInternalServerError, "Failed to create activity")
			return
		}

		api.writeJSON(w, http.StatusCreated, activity)

	default:
		api.writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// ============ Evidence ============

func (api *API) handleEvidence(w http.ResponseWriter, r *http.Request, user *domain.User) {
	switch r.Method {
	case "GET":
		rows, err := api.DB.Query(`
			SELECT id, organization_id, uploader_id, file_name, sanitized_file_name, mime_type,
				size_bytes, sha256, uploaded_at
			FROM evidence_documents WHERE organization_id = $1 ORDER BY uploaded_at DESC
		`, user.OrganizationID)
		if err != nil {
			api.writeError(w, http.StatusInternalServerError, "Failed to fetch evidence")
			return
		}
		defer rows.Close()

		var evidences []domain.EvidenceDocument
		for rows.Next() {
			var e domain.EvidenceDocument
			if err := rows.Scan(&e.ID, &e.OrganizationID, &e.UploaderID, &e.FileName,
				&e.SanitizedFileName, &e.MimeType, &e.SizeBytes, &e.SHA256, &e.UploadedAt); err != nil {
				continue
			}
			evidences = append(evidences, e)
		}
		api.writeJSON(w, http.StatusOK, evidences)

	case "POST":
		// Parse multipart form (max 3MB)
		if err := r.ParseMultipartForm(3 << 20); err != nil {
			api.writeError(w, http.StatusRequestEntityTooLarge, "File too large (max 3MB)")
			return
		}

		file, header, err := r.FormFile("file")
		if err != nil {
			api.writeError(w, http.StatusBadRequest, "No file provided")
			return
		}
		defer file.Close()

		// Validate MIME type
		allowedTypes := map[string]bool{
			"application/pdf": true,
			"image/png":       true,
			"image/jpeg":      true,
			"text/csv":        true,
			"text/plain":      true,
		}
		if !allowedTypes[header.Header.Get("Content-Type")] {
			api.writeError(w, http.StatusBadRequest, "File type not allowed")
			return
		}

		// Read file content
		content := make([]byte, header.Size)
		if _, err := file.Read(content); err != nil {
			api.writeError(w, http.StatusInternalServerError, "Failed to read file")
			return
		}

		// Compute SHA-256
		hash := fmt.Sprintf("%x", sha256Sum(content))

		// Check for duplicate
		var existingID string
		err = api.DB.QueryRow(`
			SELECT id FROM evidence_documents WHERE sha256 = $1 AND organization_id = $2
		`, hash, user.OrganizationID).Scan(&existingID)
		if err == nil {
			// Duplicate found
			api.writeJSON(w, http.StatusConflict, map[string]interface{}{
				"duplicate":   true,
				"existingId":  existingID,
				"sha256":      hash,
				"message":     "Exact match detected. Not fraud; may be legitimate reuse.",
			})
			return
		}

		// Sanitize filename
		sanitized := sanitizeFilename(header.Filename)

		// Store evidence
		evidence := domain.EvidenceDocument{
			ID:                uuid.New().String(),
			OrganizationID:    user.OrganizationID,
			UploaderID:        user.ID,
			FileName:          header.Filename,
			SanitizedFileName: sanitized,
			MimeType:          header.Header.Get("Content-Type"),
			SizeBytes:         header.Size,
			SHA256:            hash,
			UploadedAt:        time.Now(),
		}

		_, err = api.DB.Exec(`
			INSERT INTO evidence_documents (id, organization_id, uploader_id, file_name,
				sanitized_file_name, mime_type, size_bytes, sha256, file_data, uploaded_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		`, evidence.ID, evidence.OrganizationID, evidence.UploaderID, evidence.FileName,
			evidence.SanitizedFileName, evidence.MimeType, evidence.SizeBytes, evidence.SHA256,
			content, evidence.UploadedAt)
		if err != nil {
			api.writeError(w, http.StatusInternalServerError, "Failed to store evidence")
			return
		}

		api.writeJSON(w, http.StatusCreated, evidence)

	default:
		api.writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// ============ Claims ============

func (api *API) handleClaims(w http.ResponseWriter, r *http.Request, user *domain.User) {
	path := r.URL.Path
	parts := strings.Split(strings.TrimPrefix(path, "/api/v1/claims"), "/")

	// GET /api/v1/claims - list all claims
	if len(parts) == 1 && parts[0] == "" {
		if r.Method == "GET" {
			rows, err := api.DB.Query(`
				SELECT id, organization_id, project_id, title, description, status,
					total_kg_co2e, total_t_co2e, created_at, updated_at
				FROM claims WHERE organization_id = $1 ORDER BY created_at DESC
			`, user.OrganizationID)
			if err != nil {
				api.writeError(w, http.StatusInternalServerError, "Failed to fetch claims")
				return
			}
			defer rows.Close()

			var claims []domain.Claim
			for rows.Next() {
				var c domain.Claim
				var totalKg, totalT sql.NullString
				if err := rows.Scan(&c.ID, &c.OrganizationID, &c.ProjectID, &c.Title,
					&c.Description, &c.Status, &totalKg, &totalT, &c.CreatedAt, &c.UpdatedAt); err != nil {
					continue
				}
				c.TotalKgCO2e = totalKg.String
				c.TotalTCO2e = totalT.String
				claims = append(claims, c)
			}
			api.writeJSON(w, http.StatusOK, claims)
			return
		}

		if r.Method == "POST" {
			var req struct {
				ProjectID   string `json:"projectId"`
				Title       string `json:"title"`
				Description string `json:"description"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				api.writeError(w, http.StatusBadRequest, "Invalid request")
				return
			}

			claim := domain.Claim{
				ID:             uuid.New().String(),
				OrganizationID: user.OrganizationID,
				ProjectID:      req.ProjectID,
				Title:          req.Title,
				Description:    req.Description,
				Status:         "DRAFT",
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			}

			_, err := api.DB.Exec(`
				INSERT INTO claims (id, organization_id, project_id, title, description, status, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			`, claim.ID, claim.OrganizationID, claim.ProjectID, claim.Title,
				claim.Description, claim.Status, claim.CreatedAt, claim.UpdatedAt)
			if err != nil {
				api.writeError(w, http.StatusInternalServerError, "Failed to create claim")
				return
			}

			// Create initial event
			api.createEvent(claim.ID, user.ID, "CREATED", map[string]interface{}{"title": req.Title})

			api.writeJSON(w, http.StatusCreated, claim)
			return
		}
	}

	// Handle claim-specific endpoints
	if len(parts) >= 2 {
		claimID := parts[1]

		// Verify ownership
		var orgID string
		err := api.DB.QueryRow("SELECT organization_id FROM claims WHERE id = $1", claimID).Scan(&orgID)
		if err != nil || orgID != user.OrganizationID {
			api.writeError(w, http.StatusNotFound, "Claim not found")
			return
		}

		switch {
		case len(parts) == 2:
			// GET/PUT claim details
			api.handleClaimDetail(w, r, claimID, user)
		case parts[2] == "events":
			api.handleClaimEvents(w, r, claimID, user)
		case parts[2] == "evidence" && r.Method == "POST":
			api.handleLinkEvidence(w, r, claimID, user)
		case parts[2] == "activities" && r.Method == "POST":
			api.handleLinkActivity(w, r, claimID, user)
		default:
			api.writeError(w, http.StatusNotFound, "Endpoint not found")
		}
		return
	}

	api.writeError(w, http.StatusNotFound, "Endpoint not found")
}

func (api *API) handleClaimDetail(w http.ResponseWriter, r *http.Request, claimID string, user *domain.User) {
	// Implementation similar to other handlers
	api.writeJSON(w, http.StatusOK, map[string]string{"claimId": claimID})
}

func (api *API) handleClaimEvents(w http.ResponseWriter, r *http.Request, claimID string, user *domain.User) {
	rows, err := api.DB.Query(`
		SELECT id, claim_id, sequence, actor_id, event_type, payload, previous_hash, event_hash, created_at
		FROM claim_events WHERE claim_id = $1 ORDER BY sequence ASC
	`, claimID)
	if err != nil {
		api.writeError(w, http.StatusInternalServerError, "Failed to fetch events")
		return
	}
	defer rows.Close()

	var events []ledger.EventRecord
	for rows.Next() {
		var e ledger.EventRecord
		var payloadJSON []byte
		if err := rows.Scan(&e.ID, &e.ClaimID, &e.Sequence, &e.ActorID, &e.EventType,
			&payloadJSON, &e.PreviousHash, &e.EventHash, &e.Timestamp); err != nil {
			continue
		}
		json.Unmarshal(payloadJSON, &e.Payload)
		events = append(events, e)
	}

	result, _ := ledger.VerifyChain(events)
	api.writeJSON(w, http.StatusOK, result)
}

func (api *API) handleLinkEvidence(w http.ResponseWriter, r *http.Request, claimID string, user *domain.User) {
	var req struct {
		EvidenceID string `json:"evidenceId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.writeError(w, http.StatusBadRequest, "Invalid request")
		return
	}

	_, err := api.DB.Exec(`
		INSERT INTO claim_evidence (claim_id, evidence_id) VALUES ($1, $2)
		ON CONFLICT DO NOTHING
	`, claimID, req.EvidenceID)
	if err != nil {
		api.writeError(w, http.StatusInternalServerError, "Failed to link evidence")
		return
	}

	api.createEvent(claimID, user.ID, "EVIDENCE_LINKED", map[string]interface{}{"evidenceId": req.EvidenceID})
	api.writeJSON(w, http.StatusOK, map[string]string{"status": "linked"})
}

func (api *API) handleLinkActivity(w http.ResponseWriter, r *http.Request, claimID string, user *domain.User) {
	var req struct {
		ActivityID string `json:"activityId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.writeError(w, http.StatusBadRequest, "Invalid request")
		return
	}

	_, err := api.DB.Exec(`
		INSERT INTO claim_activities (claim_id, activity_id) VALUES ($1, $2)
		ON CONFLICT DO NOTHING
	`, claimID, req.ActivityID)
	if err != nil {
		api.writeError(w, http.StatusInternalServerError, "Failed to link activity")
		return
	}

	api.createEvent(claimID, user.ID, "ACTIVITY_ADDED", map[string]interface{}{"activityId": req.ActivityID})
	api.writeJSON(w, http.StatusOK, map[string]string{"status": "linked"})
}

// ============ Helper Functions ============

func (api *API) authenticateRequest(r *http.Request) (*domain.User, error) {
	cookie, err := r.Cookie("session_token")
	if err != nil {
		return nil, fmt.Errorf("no session cookie")
	}

	tokenHash := auth.HashToken(cookie.Value)

	var user domain.User
	err = api.DB.QueryRow(`
		SELECT u.id, u.organization_id, u.email, u.name, u.role
		FROM users u
		JOIN sessions s ON s.user_id = u.id
		WHERE s.token_hash = $1 AND s.expires_at > NOW() AND s.revoked_at IS NULL
	`, tokenHash).Scan(&user.ID, &user.OrganizationID, &user.Email, &user.Name, &user.Role)

	if err != nil {
		return nil, fmt.Errorf("invalid session")
	}

	return &user, nil
}

func (api *API) createEvent(claimID, actorID, eventType string, payload map[string]interface{}) {
	// Get next sequence
	var seq int
	api.DB.QueryRow(`
		SELECT COALESCE(MAX(sequence), 0) + 1 FROM claim_events WHERE claim_id = $1
	`, claimID).Scan(&seq)

	// Get previous hash
	var prevHash string
	api.DB.QueryRow(`
		SELECT event_hash FROM claim_events WHERE claim_id = $1 ORDER BY sequence DESC LIMIT 1
	`, claimID).Scan(&prevHash)

	// Compute event hash
	canonical := ledger.CanonicalPayload{
		Sequence:     seq,
		ClaimID:      claimID,
		ActorID:      actorID,
		EventType:    eventType,
		Payload:      payload,
		PreviousHash: prevHash,
		Timestamp:    time.Now().UTC().Format(time.RFC3339Nano),
	}
	eventHash := ledger.ComputeEventHash(canonical)

	payloadJSON, _ := json.Marshal(payload)

	_, _ = api.DB.Exec(`
		INSERT INTO claim_events (id, claim_id, sequence, actor_id, event_type, payload, previous_hash, event_hash, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
	`, uuid.New().String(), claimID, seq, actorID, eventType, payloadJSON, prevHash, eventHash)
}

func (api *API) writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (api *API) writeError(w http.ResponseWriter, status int, message string) {
	api.writeJSON(w, status, map[string]string{"error": message})
}

func sanitizeFilename(name string) string {
	// Remove path separators and dangerous characters
	name = strings.ReplaceAll(name, "/", "_")
	name = strings.ReplaceAll(name, "\\", "_")
	re := regexp.MustCompile(`[^a-zA-Z0-9._-]`)
	name = re.ReplaceAllString(name, "_")
	if len(name) > 200 {
		name = name[:200]
	}
	return name
}

func sha256Sum(data []byte) [32]byte {
	return sha256.Sum256(data)
}

// Unused import prevention
var _ = strconv.Itoa
