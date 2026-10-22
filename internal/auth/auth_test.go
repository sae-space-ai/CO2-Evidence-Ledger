package auth

import (
	"testing"
	"time"
)

func TestHashAndVerifyPassword(t *testing.T) {
	password := "secure_password_123"

	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	if hash == "" {
		t.Error("Hash should not be empty")
	}

	// Verify correct password
	valid, err := VerifyPassword(password, hash)
	if err != nil {
		t.Fatalf("VerifyPassword failed: %v", err)
	}
	if !valid {
		t.Error("Correct password should verify")
	}

	// Verify wrong password
	valid, err = VerifyPassword("wrong_password", hash)
	if err != nil {
		t.Fatalf("VerifyPassword failed: %v", err)
	}
	if valid {
		t.Error("Wrong password should not verify")
	}
}

func TestHashPasswordDeterministic(t *testing.T) {
	password := "test_password"

	hash1, _ := HashPassword(password)
	hash2, _ := HashPassword(password)

	// Different salts should produce different hashes
	if hash1 == hash2 {
		t.Error("Same password should produce different hashes (different salts)")
	}

	// But both should verify
	valid1, _ := VerifyPassword(password, hash1)
	valid2, _ := VerifyPassword(password, hash2)

	if !valid1 || !valid2 {
		t.Error("Both hashes should verify the password")
	}
}

func TestVerifyPasswordInvalidFormat(t *testing.T) {
	_, err := VerifyPassword("password", "invalid_hash_format")
	if err == nil {
		t.Error("Should return error for invalid hash format")
	}
}

func TestGenerateSessionToken(t *testing.T) {
	token1, err := GenerateSessionToken()
	if err != nil {
		t.Fatalf("GenerateSessionToken failed: %v", err)
	}

	token2, err := GenerateSessionToken()
	if err != nil {
		t.Fatalf("GenerateSessionToken failed: %v", err)
	}

	// Tokens should be unique
	if token1 == token2 {
		t.Error("Tokens should be unique")
	}

	// Token should be 64 hex chars (32 bytes)
	if len(token1) != 64 {
		t.Errorf("Token length = %d, want 64", len(token1))
	}
}

func TestHashToken(t *testing.T) {
	token := "test_token_123"
	hash1 := HashToken(token)
	hash2 := HashToken(token)

	// Same token should produce same hash
	if hash1 != hash2 {
		t.Error("HashToken should be deterministic")
	}

	// Hash should be 64 hex chars (SHA-256)
	if len(hash1) != 64 {
		t.Errorf("Hash length = %d, want 64", len(hash1))
	}

	// Different token should produce different hash
	hash3 := HashToken("different_token")
	if hash1 == hash3 {
		t.Error("Different tokens should produce different hashes")
	}
}

func TestValidatePasswordStrength(t *testing.T) {
	tests := []struct {
		password string
		wantErr  bool
	}{
		{"short", true},
		{"12345678901", true},
		{"123456789012", false},
		{"very_long_secure_password_123", false},
	}

	for _, tt := range tests {
		err := ValidatePasswordStrength(tt.password)
		if (err != nil) != tt.wantErr {
			t.Errorf("ValidatePasswordStrength(%q) error = %v, wantErr %v", tt.password, err, tt.wantErr)
		}
	}
}

func TestSessionExpiry(t *testing.T) {
	before := time.Now()
	expiry := SessionExpiry()
	after := time.Now()

	// Expiry should be approximately 24 hours from now
	expectedMin := before.Add(24 * time.Hour)
	expectedMax := after.Add(24 * time.Hour)

	if expiry.Before(expectedMin) || expiry.After(expectedMax) {
		t.Errorf("Session expiry = %v, want between %v and %v", expiry, expectedMin, expectedMax)
	}
}
