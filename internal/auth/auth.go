package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"golang.org/x/crypto/argon2"
)

// Argon2id parameters (justified for interactive login)
const (
	memory      = 64 * 1024 // 64 MB
	iterations  = 3
	parallelism = 2
	keyLength   = 32
	saltLength  = 16
)

// HashPassword creates an Argon2id hash of the password
func HashPassword(password string) (string, error) {
	salt := make([]byte, saltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("failed to generate salt: %w", err)
	}

	hash := argon2.IDKey([]byte(password), salt, iterations, memory, parallelism, keyLength)

	// Format: $argon2id$v=19$m=65536,t=3,p=2$<salt>$<hash>
	saltB64 := base64.RawStdEncoding.EncodeToString(salt)
	hashB64 := base64.RawStdEncoding.EncodeToString(hash)

	return fmt.Sprintf("$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s",
		memory, iterations, parallelism, saltB64, hashB64), nil
}

// VerifyPassword checks a password against an Argon2id hash
func VerifyPassword(password, hash string) (bool, error) {
	// Parse hash format
	parts := strings.Split(hash, "$")
	if len(parts) != 6 {
		return false, errors.New("invalid hash format")
	}

	// Parse parameters
	var m, t, p uint32
	_, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &m, &t, &p)
	if err != nil {
		return false, fmt.Errorf("failed to parse hash parameters: %w", err)
	}

	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return false, fmt.Errorf("failed to decode salt: %w", err)
	}

	expectedHash, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return false, fmt.Errorf("failed to decode hash: %w", err)
	}

	// Compute hash with same parameters
	computedHash := argon2.IDKey([]byte(password), salt, t, m, p, uint32(len(expectedHash)))

	// Constant-time comparison
	if subtle.ConstantTimeCompare(computedHash, expectedHash) != 1 {
		return false, nil
	}

	return true, nil
}

// GenerateSessionToken creates a cryptographically random session token
func GenerateSessionToken() (string, error) {
	token := make([]byte, 32)
	if _, err := rand.Read(token); err != nil {
		return "", fmt.Errorf("failed to generate token: %w", err)
	}
	return hex.EncodeToString(token), nil
}

// HashToken creates a SHA-256 hash of a session token for storage
func HashToken(token string) string {
	// In production, use crypto/sha256
	// For now, simplified
	hash := argon2.IDKey([]byte(token), []byte("session-salt"), 1, 32*1024, 2, 32)
	return hex.EncodeToString(hash)
}

// SessionExpiry returns the session expiry time (24 hours)
func SessionExpiry() time.Time {
	return time.Now().Add(24 * time.Hour)
}

// ValidatePasswordStrength checks minimum password requirements
func ValidatePasswordStrength(password string) error {
	if len(password) < 12 {
		return errors.New("password must be at least 12 characters")
	}
	return nil
}
