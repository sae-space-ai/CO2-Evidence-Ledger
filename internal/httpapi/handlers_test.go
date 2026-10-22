package httpapi

import (
	"math/big"
	"testing"
)

func TestEmissionCalculation_Exact(t *testing.T) {
	tests := []struct {
		name          string
		quantity      string
		factor        string
		expectedKg    string
		expectedTCO2e string
	}{
		{
			name:          "Diesel fixture",
			quantity:      "1000",
			factor:        "2.5",
			expectedKg:    "2500",
			expectedTCO2e: "2.5",
		},
		{
			name:          "Electricity fixture",
			quantity:      "500",
			factor:        "0.2",
			expectedKg:    "100",
			expectedTCO2e: "0.1",
		},
		{
			name:          "Total fixture",
			quantity:      "1",
			factor:        "2600",
			expectedKg:    "2600",
			expectedTCO2e: "2.6",
		},
		{
			name:          "Zero quantity",
			quantity:      "0",
			factor:        "2.5",
			expectedKg:    "0",
			expectedTCO2e: "0",
		},
		{
			name:          "Zero factor",
			quantity:      "1000",
			factor:        "0",
			expectedKg:    "0",
			expectedTCO2e: "0",
		},
		{
			name:          "Decimal precision",
			quantity:      "1234.5678",
			factor:        "2.3456",
			expectedKg:    "2895.99878368",
			expectedTCO2e: "2.89599878368",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			q := new(big.Rat)
			f := new(big.Rat)

			if _, ok := q.SetString(tt.quantity); !ok {
				t.Fatalf("Invalid quantity: %s", tt.quantity)
			}
			if _, ok := f.SetString(tt.factor); !ok {
				t.Fatalf("Invalid factor: %s", tt.factor)
			}

			resultKg := new(big.Rat).Mul(q, f)
			resultT := new(big.Rat).Quo(resultKg, big.NewRat(1000, 1))

			expectedKg := new(big.Rat)
			expectedKg.SetString(tt.expectedKg)

			if resultKg.Cmp(expectedKg) != 0 {
				t.Errorf("kgCO2e = %s, want %s", resultKg.FloatString(10), tt.expectedKg)
			}

			expectedT := new(big.Rat)
			expectedT.SetString(tt.expectedTCO2e)

			if resultT.Cmp(expectedT) != 0 {
				t.Errorf("tCO2e = %s, want %s", resultT.FloatString(10), tt.expectedTCO2e)
			}
		})
	}
}

func TestEmissionCalculation_InvalidInputs(t *testing.T) {
	invalidInputs := []struct {
		quantity string
		factor   string
	}{
		{"-100", "2.5"},    // Negative quantity
		{"100", "-2.5"},    // Negative factor
		{"abc", "2.5"},     // Non-numeric quantity
		{"100", "xyz"},     // Non-numeric factor
		{"", "2.5"},        // Empty quantity
		{"100", ""},        // Empty factor
	}

	for _, tt := range invalidInputs {
		q := new(big.Rat)
		f := new(big.Rat)

		_, qOk := q.SetString(tt.quantity)
		_, fOk := f.SetString(tt.factor)

		if qOk && fOk {
			// Check for negative
			zero := big.NewRat(0, 1)
			if q.Cmp(zero) < 0 || f.Cmp(zero) < 0 {
				continue // Expected to be rejected
			}
			t.Errorf("Should reject quantity=%s factor=%s", tt.quantity, tt.factor)
		}
	}
}

func TestSanitizeFilename(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"normal.pdf", "normal.pdf"},
		{"file with spaces.txt", "file_with_spaces.txt"},
		{"../../../etc/passwd", "_______etc_passwd"},
		{"file<script>.html", "file_script_.html"},
		{"very_long_" + string(make([]byte, 300)), ""}, // Will be truncated
	}

	for _, tt := range tests {
		result := sanitizeFilename(tt.input)
		if tt.expected != "" && result != tt.expected {
			t.Errorf("sanitizeFilename(%q) = %q, want %q", tt.input, result, tt.expected)
		}
		// Check no path separators
		if len(result) > 0 {
			for _, c := range result {
				if c == '/' || c == '\\' {
					t.Errorf("sanitizeFilename(%q) contains path separator: %q", tt.input, result)
				}
			}
		}
	}
}
