package ledger

import (
	"testing"
	"time"
)

func TestCanonicalize(t *testing.T) {
	tests := []struct {
		name     string
		input    interface{}
		expected string
	}{
		{"null", nil, "null"},
		{"string", "hello", `"hello"`},
		{"number_int", 42, "42"},
		{"bool_true", true, "true"},
		{"bool_false", false, "false"},
		{"empty_object", map[string]interface{}{}, "{}"},
		{"empty_array", []interface{}{}, "[]"},
		{"sorted_keys", map[string]interface{}{"b": 2, "a": 1}, `{"a":1,"b":2}`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := Canonicalize(tt.input)
			if result != tt.expected {
				t.Errorf("Canonicalize(%v) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestComputeEventHash(t *testing.T) {
	payload := CanonicalPayload{
		Sequence:     1,
		ClaimID:      "claim-123",
		ActorID:      "user-456",
		EventType:    "CREATED",
		Payload:      map[string]interface{}{"title": "Test"},
		PreviousHash: "",
		Timestamp:    "2026-10-23T10:00:00Z",
	}

	hash1 := ComputeEventHash(payload)
	hash2 := ComputeEventHash(payload)

	// Same input must produce same hash
	if hash1 != hash2 {
		t.Errorf("Hash not deterministic: %s != %s", hash1, hash2)
	}

	// Hash must be 64 hex chars (SHA-256)
	if len(hash1) != 64 {
		t.Errorf("Hash length = %d, want 64", len(hash1))
	}

	// Different payload must produce different hash
	payload2 := payload
	payload2.Sequence = 2
	hash3 := ComputeEventHash(payload2)
	if hash1 == hash3 {
		t.Error("Different payloads produced same hash")
	}
}

func TestVerifyChain_Empty(t *testing.T) {
	result, err := VerifyChain([]EventRecord{})
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if !result.Valid {
		t.Error("Empty chain should be valid")
	}
	if result.TotalEvents != 0 {
		t.Errorf("TotalEvents = %d, want 0", result.TotalEvents)
	}
}

func TestVerifyChain_ValidChain(t *testing.T) {
	now := time.Now()
	events := []EventRecord{
		{
			ID:        "evt-1",
			ClaimID:   "claim-1",
			Sequence:  1,
			ActorID:   "user-1",
			EventType: "CREATED",
			Payload:   map[string]interface{}{"title": "Test"},
			Timestamp: now,
		},
	}

	// Compute hash for first event
	payload := CanonicalPayload{
		Sequence:     1,
		ClaimID:      "claim-1",
		ActorID:      "user-1",
		EventType:    "CREATED",
		Payload:      map[string]interface{}{"title": "Test"},
		PreviousHash: "",
		Timestamp:    now.Format(time.RFC3339Nano),
	}
	events[0].EventHash = ComputeEventHash(payload)
	events[0].PreviousHash = ""

	// Add second event
	payload2 := CanonicalPayload{
		Sequence:     2,
		ClaimID:      "claim-1",
		ActorID:      "user-1",
		EventType:    "EVIDENCE_LINKED",
		Payload:      map[string]interface{}{"evidenceId": "ev-1"},
		PreviousHash: events[0].EventHash,
		Timestamp:    now.Add(time.Second).Format(time.RFC3339Nano),
	}
	events = append(events, EventRecord{
		ID:           "evt-2",
		ClaimID:      "claim-1",
		Sequence:     2,
		ActorID:      "user-1",
		EventType:    "EVIDENCE_LINKED",
		Payload:      map[string]interface{}{"evidenceId": "ev-1"},
		PreviousHash: events[0].EventHash,
		EventHash:    ComputeEventHash(payload2),
		Timestamp:    now.Add(time.Second),
	})

	result, err := VerifyChain(events)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if !result.Valid {
		t.Errorf("Valid chain marked invalid: %s", result.Message)
	}
	if result.TotalEvents != 2 {
		t.Errorf("TotalEvents = %d, want 2", result.TotalEvents)
	}
}

func TestVerifyChain_BrokenPreviousHash(t *testing.T) {
	now := time.Now()
	events := []EventRecord{
		{
			ID:           "evt-1",
			ClaimID:      "claim-1",
			Sequence:     1,
			ActorID:      "user-1",
			EventType:    "CREATED",
			Payload:      map[string]interface{}{},
			PreviousHash: "",
			EventHash:    "abc123",
			Timestamp:    now,
		},
		{
			ID:           "evt-2",
			ClaimID:      "claim-1",
			Sequence:     2,
			ActorID:      "user-1",
			EventType:    "EVIDENCE_LINKED",
			Payload:      map[string]interface{}{},
			PreviousHash: "wrong_hash", // Should be events[0].EventHash
			EventHash:    "def456",
			Timestamp:    now.Add(time.Second),
		},
	}

	result, err := VerifyChain(events)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if result.Valid {
		t.Error("Broken chain should be invalid")
	}
	if result.BrokenAt != 2 {
		t.Errorf("BrokenAt = %d, want 2", result.BrokenAt)
	}
}

func TestVerifyChain_TamperedPayload(t *testing.T) {
	now := time.Now()

	// Create valid first event
	payload1 := CanonicalPayload{
		Sequence:     1,
		ClaimID:      "claim-1",
		ActorID:      "user-1",
		EventType:    "CREATED",
		Payload:      map[string]interface{}{"title": "Original"},
		PreviousHash: "",
		Timestamp:    now.Format(time.RFC3339Nano),
	}
	hash1 := ComputeEventHash(payload1)

	// Second event references first
	payload2 := CanonicalPayload{
		Sequence:     2,
		ClaimID:      "claim-1",
		ActorID:      "user-1",
		EventType:    "STATUS_CHANGED",
		Payload:      map[string]interface{}{"status": "READY"},
		PreviousHash: hash1,
		Timestamp:    now.Add(time.Second).Format(time.RFC3339Nano),
	}
	hash2 := ComputeEventHash(payload2)

	events := []EventRecord{
		{
			ID:           "evt-1",
			ClaimID:      "claim-1",
			Sequence:     1,
			ActorID:      "user-1",
			EventType:    "CREATED",
			Payload:      map[string]interface{}{"title": "TAMPERED"}, // Changed!
			PreviousHash: "",
			EventHash:    hash1,
			Timestamp:    now,
		},
		{
			ID:           "evt-2",
			ClaimID:      "claim-1",
			Sequence:     2,
			ActorID:      "user-1",
			EventType:    "STATUS_CHANGED",
			Payload:      map[string]interface{}{"status": "READY"},
			PreviousHash: hash1,
			EventHash:    hash2,
			Timestamp:    now.Add(time.Second),
		},
	}

	result, err := VerifyChain(events)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if result.Valid {
		t.Error("Tampered payload should be detected")
	}
	if result.BrokenAt != 1 {
		t.Errorf("BrokenAt = %d, want 1", result.BrokenAt)
	}
}
