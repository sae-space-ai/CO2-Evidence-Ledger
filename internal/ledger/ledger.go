package ledger

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"time"
)

// CanonicalPayload represents the data to be hashed for an event
type CanonicalPayload struct {
	Sequence     int                    `json:"sequence"`
	ClaimID      string                 `json:"claimId"`
	ActorID      string                 `json:"actorId"`
	EventType    string                 `json:"type"`
	Payload      map[string]interface{} `json:"payload"`
	PreviousHash string                 `json:"previousHash"`
	Timestamp    string                 `json:"timestamp"`
}

// Canonicalize produces a deterministic JSON representation
// Keys are sorted alphabetically, no extra whitespace
func Canonicalize(v interface{}) string {
	return canonicalizeValue(v)
}

func canonicalizeValue(v interface{}) string {
	if v == nil {
		return "null"
	}

	switch val := v.(type) {
	case bool:
		if val {
			return "true"
		}
		return "false"
	case int:
		return fmt.Sprintf("%d", val)
	case int64:
		return fmt.Sprintf("%d", val)
	case float64:
		return fmt.Sprintf("%g", val)
	case string:
		// Escape string for JSON
		escaped, _ := json.Marshal(val)
		return string(escaped)
	case []interface{}:
		items := make([]string, len(val))
		for i, item := range val {
			items[i] = canonicalizeValue(item)
		}
		return "[" + strings.Join(items, ",") + "]"
	case map[string]interface{}:
		keys := make([]string, 0, len(val))
		for k := range val {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		
		pairs := make([]string, len(keys))
		for i, k := range keys {
			keyJSON, _ := json.Marshal(k)
			pairs[i] = string(keyJSON) + ":" + canonicalizeValue(val[k])
		}
		return "{" + strings.Join(pairs, ",") + "}"
	default:
		// Fallback to json.Marshal for other types
		data, err := json.Marshal(v)
		if err != nil {
			return "null"
		}
		return string(data)
	}
}

// ComputeEventHash calculates SHA-256 of the canonical payload
func ComputeEventHash(payload CanonicalPayload) string {
	canonical := Canonicalize(payload)
	hash := sha256.Sum256([]byte(canonical))
	return fmt.Sprintf("%x", hash)
}

// VerifyChain checks the integrity of a chain of events
func VerifyChain(events []EventRecord) (*VerificationResult, error) {
	if len(events) == 0 {
		return &VerificationResult{
			Valid:       true,
			TotalEvents: 0,
			Message:     "No events to verify",
		}, nil
	}

	// Sort by sequence
	sort.Slice(events, func(i, j int) bool {
		return events[i].Sequence < events[j].Sequence
	})

	for i, evt := range events {
		// Check previous hash
		var expectedPrev string
		if i > 0 {
			expectedPrev = events[i-1].EventHash
		}
		if evt.PreviousHash != expectedPrev {
			return &VerificationResult{
				Valid:       false,
				TotalEvents: len(events),
				BrokenAt:    evt.Sequence,
				Message:     fmt.Sprintf("Chain broken at sequence %d: previous hash mismatch", evt.Sequence),
			}, nil
		}

		// Verify event hash
		payload := CanonicalPayload{
			Sequence:     evt.Sequence,
			ClaimID:      evt.ClaimID,
			ActorID:      evt.ActorID,
			EventType:    evt.EventType,
			Payload:      evt.Payload,
			PreviousHash: evt.PreviousHash,
			Timestamp:    evt.Timestamp.Format(time.RFC3339Nano),
		}
		expectedHash := ComputeEventHash(payload)
		if evt.EventHash != expectedHash {
			return &VerificationResult{
				Valid:       false,
				TotalEvents: len(events),
				BrokenAt:    evt.Sequence,
				Message:     fmt.Sprintf("Hash mismatch at sequence %d: possible payload tampering", evt.Sequence),
			}, nil
		}
	}

	return &VerificationResult{
		Valid:       true,
		TotalEvents: len(events),
		Message:     fmt.Sprintf("Chain verified: %d events intact", len(events)),
	}, nil
}

// EventRecord is a stored event with all fields needed for verification
type EventRecord struct {
	ID           string                 `json:"eventId"`
	ClaimID      string                 `json:"claimId"`
	Sequence     int                    `json:"sequence"`
	ActorID      string                 `json:"actorId"`
	EventType    string                 `json:"type"`
	Payload      map[string]interface{} `json:"payload"`
	PreviousHash string                 `json:"previousHash"`
	EventHash    string                 `json:"eventHash"`
	Timestamp    time.Time              `json:"timestamp"`
}

// VerificationResult contains the outcome of chain verification
type VerificationResult struct {
	Valid       bool   `json:"valid"`
	TotalEvents int    `json:"totalEvents"`
	BrokenAt    int    `json:"brokenAt,omitempty"`
	Message     string `json:"message"`
}
