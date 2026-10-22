package main

import (
	"archive/zip"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// Manifest represents the exported claim package
type Manifest struct {
	Version     string              `json:"version"`
	GeneratedAt string              `json:"generatedAt"`
	Claim       json.RawMessage     `json:"claim"`
	Evidences   []EvidenceReference `json:"evidences"`
	Events      []EventRecord       `json:"events"`
	Warnings    []string            `json:"warnings"`
}

type EvidenceReference struct {
	ID        string `json:"id"`
	FileName  string `json:"fileName"`
	SHA256    string `json:"sha256"`
	SizeBytes int64  `json:"sizeBytes"`
}

type EventRecord struct {
	Sequence     int                    `json:"sequence"`
	ClaimID      string                 `json:"claimId"`
	ActorID      string                 `json:"actorId"`
	EventType    string                 `json:"type"`
	Payload      map[string]interface{} `json:"payload"`
	PreviousHash string                 `json:"previousHash"`
	EventHash    string                 `json:"eventHash"`
	Timestamp    string                 `json:"timestamp"`
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: verify-package <path-to-zip>")
		fmt.Println()
		fmt.Println("Verifies the integrity of an exported CO2 Evidence Ledger package.")
		fmt.Println()
		fmt.Println("What this tool CAN verify:")
		fmt.Println("  - Files match their declared SHA-256 hashes")
		fmt.Println("  - Event chain is internally consistent (no gaps or reordering)")
		fmt.Println("  - Event hashes match their canonical payloads")
		fmt.Println()
		fmt.Println("What this tool CANNOT verify:")
		fmt.Println("  - That the chain wasn't reconstructed from scratch")
		fmt.Println("  - That hashes were anchored by a trusted timestamp authority")
		fmt.Println("  - That document contents are truthful")
		os.Exit(1)
	}

	zipPath := os.Args[1]
	result, err := verifyPackage(zipPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(2)
	}

	// Output result
	output, _ := json.MarshalIndent(result, "", "  ")
	fmt.Println(string(output))

	if !result.Valid {
		os.Exit(1)
	}
}

type VerifyResult struct {
	Valid       bool     `json:"valid"`
	ZipPath     string   `json:"zipPath"`
	FilesChecked int     `json:"filesChecked"`
	EventsChecked int    `json:"eventsChecked"`
	Issues      []string `json:"issues,omitempty"`
	Message     string   `json:"message"`
}

func verifyPackage(zipPath string) (*VerifyResult, error) {
	result := &VerifyResult{
		ZipPath: zipPath,
		Valid:   true,
	}

	// Open zip
	reader, err := zip.OpenReader(zipPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open zip: %w", err)
	}
	defer reader.Close()

	// Check for zip slip
	for _, f := range reader.File {
		name := f.Name
		if strings.Contains(name, "..") {
			result.Valid = false
			result.Issues = append(result.Issues, fmt.Sprintf("Zip slip detected: %s", name))
			continue
		}
	}

	// Find manifest.json
	var manifestFile *zip.File
	for _, f := range reader.File {
		if filepath.Base(f.Name) == "manifest.json" {
			manifestFile = f
			break
		}
	}

	if manifestFile == nil {
		result.Valid = false
		result.Issues = append(result.Issues, "manifest.json not found in package")
		result.Message = "INVALID: No manifest found"
		return result, nil
	}

	// Read manifest
	rc, err := manifestFile.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open manifest: %w", err)
	}
	defer rc.Close()

	manifestData, err := io.ReadAll(rc)
	if err != nil {
		return nil, fmt.Errorf("failed to read manifest: %w", err)
	}

	var manifest Manifest
	if err := json.Unmarshal(manifestData, &manifest); err != nil {
		result.Valid = false
		result.Issues = append(result.Issues, fmt.Sprintf("Invalid manifest JSON: %v", err))
		result.Message = "INVALID: Corrupt manifest"
		return result, nil
	}

	// Verify evidence files
	for _, evRef := range manifest.Evidences {
		// Find file in zip
		var found bool
		for _, f := range reader.File {
			if filepath.Base(f.Name) == evRef.FileName {
				found = true
				result.FilesChecked++

				// Compute hash
				frc, err := f.Open()
				if err != nil {
					result.Valid = false
					result.Issues = append(result.Issues, fmt.Sprintf("Cannot read %s: %v", evRef.FileName, err))
					continue
				}

				hasher := sha256.New()
				if _, err := io.Copy(hasher, frc); err != nil {
					frc.Close()
					result.Valid = false
					result.Issues = append(result.Issues, fmt.Sprintf("Cannot hash %s: %v", evRef.FileName, err))
					continue
				}
				frc.Close()

				computedHash := fmt.Sprintf("%x", hasher.Sum(nil))
				if computedHash != evRef.SHA256 {
					result.Valid = false
					result.Issues = append(result.Issues, fmt.Sprintf("Hash mismatch for %s: expected %s, got %s",
						evRef.FileName, evRef.SHA256, computedHash))
				}
				break
			}
		}

		if !found {
			result.Valid = false
			result.Issues = append(result.Issues, fmt.Sprintf("Evidence file missing: %s", evRef.FileName))
		}
	}

	// Verify event chain
	result.EventsChecked = len(manifest.Events)
	for i, evt := range manifest.Events {
		// Check sequence
		if evt.Sequence != i+1 {
			result.Valid = false
			result.Issues = append(result.Issues, fmt.Sprintf("Sequence gap at event %d: expected %d, got %d",
				i, i+1, evt.Sequence))
		}

		// Check previous hash
		var expectedPrev string
		if i > 0 {
			expectedPrev = manifest.Events[i-1].EventHash
		}
		if evt.PreviousHash != expectedPrev {
			result.Valid = false
			result.Issues = append(result.Issues, fmt.Sprintf("Chain broken at event %d: previous hash mismatch",
				evt.Sequence))
		}

		// Verify event hash
		canonicalPayload := map[string]interface{}{
			"sequence":     evt.Sequence,
			"claimId":      evt.ClaimID,
			"actorId":      evt.ActorID,
			"type":         evt.EventType,
			"payload":      evt.Payload,
			"previousHash": evt.PreviousHash,
			"timestamp":    evt.Timestamp,
		}
		canonicalJSON, _ := json.Marshal(canonicalPayload)
		hasher := sha256.New()
		hasher.Write(canonicalJSON)
		expectedHash := fmt.Sprintf("%x", hasher.Sum(nil))

		if evt.EventHash != expectedHash {
			result.Valid = false
			result.Issues = append(result.Issues, fmt.Sprintf("Hash mismatch at event %d: possible payload tampering",
				evt.Sequence))
		}
	}

	// Final message
	if result.Valid {
		result.Message = fmt.Sprintf("VALID: %d files checked, %d events verified. Chain is internally consistent.",
			result.FilesChecked, result.EventsChecked)
	} else {
		result.Message = fmt.Sprintf("INVALID: %d issues found", len(result.Issues))
	}

	return result, nil
}
