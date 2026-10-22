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
	expiry := SessionExpiry()
	now := SessionExpiry() // Just to get current time approximation

	// Expiry should be in the future
	if !expiry.After(now.Add(-time.Second)) {
		t.Error("Session expiry should be in the future")
	}

	// Should be approximately 24 hours from now
	diff := expiry.Sub(now)
	if diff < 23*time.Hour || diff > 25*time.Hour {
		t.Errorf("Session expiry diff = %v, want ~24h", diff)
	}
}
