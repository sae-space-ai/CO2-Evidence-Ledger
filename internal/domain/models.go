package domain

import (
	"time"
)

// Organization represents a tenant organization
type Organization struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// User represents an authenticated user
type User struct {
	ID             string    `json:"id"`
	OrganizationID string    `json:"organizationId"`
	Email          string    `json:"email"`
	Name           string    `json:"name"`
	Role           string    `json:"role"` // owner, reviewer, viewer
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// Session represents an active user session
type Session struct {
	ID        string     `json:"id"`
	UserID    string     `json:"userId"`
	TokenHash string     `json:"-"`
	ExpiresAt time.Time  `json:"expiresAt"`
	CreatedAt time.Time  `json:"createdAt"`
	RevokedAt *time.Time `json:"revokedAt,omitempty"`
}

// Project represents an inventory project
type Project struct {
	ID                 string    `json:"id"`
	OrganizationID     string    `json:"organizationId"`
	Name               string    `json:"name"`
	Description        string    `json:"description"`
	OperationalBoundary string   `json:"operationalBoundary"`
	ReportingYear      int       `json:"reportingYear"`
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

// Activity represents an emission activity
type Activity struct {
	ID             string    `json:"id"`
	ProjectID      string    `json:"projectId"`
	OrganizationID string    `json:"organizationId"`
	Name           string    `json:"name"`
	Category       string    `json:"category"` // diesel, gasoline, natural_gas, electricity
	Scope          int       `json:"scope"`    // 1 or 2
	PeriodStart    string    `json:"periodStart"`
	PeriodEnd      string    `json:"periodEnd"`
	Quantity       string    `json:"quantity"` // decimal string
	Unit           string    `json:"unit"`
	FactorValue    string    `json:"factorValue"` // decimal string kgCO2e/unit
	FactorSource   string    `json:"factorSource"`
	FactorYear     int       `json:"factorYear"`
	Method         string    `json:"method"`
	Notes          string    `json:"notes"`
	ResultKgCO2e   string    `json:"resultKgCO2e"`
	ResultTCO2e    string    `json:"resultTCO2e"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// EvidenceDocument represents an uploaded evidence file
type EvidenceDocument struct {
	ID               string    `json:"id"`
	OrganizationID   string    `json:"organizationId"`
	UploaderID       string    `json:"uploaderId"`
	FileName         string    `json:"fileName"`
	SanitizedFileName string   `json:"sanitizedFileName"`
	MimeType         string    `json:"mimeType"`
	SizeBytes        int64     `json:"sizeBytes"`
	SHA256           string    `json:"sha256"`
	UploadedAt       time.Time `json:"uploadedAt"`
}

// Claim represents a declaration/claim
type Claim struct {
	ID             string    `json:"id"`
	OrganizationID string    `json:"organizationId"`
	ProjectID      string    `json:"projectId"`
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	Status         string    `json:"status"` // DRAFT, READY_FOR_REVIEW, REVIEWED_INTERNAL, REJECTED_INTERNAL
	ActivityIDs    []string  `json:"activityIds"`
	EvidenceIDs    []string  `json:"evidenceIds"`
	TotalKgCO2e    string    `json:"totalKgCO2e"`
	TotalTCO2e     string    `json:"totalTCO2e"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// LedgerEvent represents an append-only event in the claim timeline
type LedgerEvent struct {
	ID           string                 `json:"eventId"`
	ClaimID      string                 `json:"claimId"`
	Sequence     int                    `json:"sequence"`
	ActorID      string                 `json:"actorId"`
	ActorName    string                 `json:"actorName"`
	EventType    string                 `json:"type"`
	Payload      map[string]interface{} `json:"payload"`
	PreviousHash string                 `json:"previousHash"`
	EventHash    string                 `json:"eventHash"`
	Timestamp    time.Time              `json:"timestamp"`
}

// ExportManifest represents the exported claim package
type ExportManifest struct {
	Version      string              `json:"version"`
	GeneratedAt  time.Time           `json:"generatedAt"`
	Claim        Claim               `json:"claim"`
	Organization Organization        `json:"organization"`
	Activities   []Activity          `json:"activities"`
	Evidences    []EvidenceReference `json:"evidences"`
	Events       []LedgerEvent       `json:"events"`
	Warnings     []string            `json:"warnings"`
}

// EvidenceReference is a lightweight reference to evidence for export
type EvidenceReference struct {
	ID        string `json:"id"`
	FileName  string `json:"fileName"`
	SHA256    string `json:"sha256"`
	SizeBytes int64  `json:"sizeBytes"`
}
