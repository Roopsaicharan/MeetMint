package main

import (
	"testing"
)

// ─────────────────────────────────────────────────────────────────────────────
// OTP Generation & Hashing Tests (Sprint 3 — Extended)
// ─────────────────────────────────────────────────────────────────────────────

func TestGenerateOTP_Length(t *testing.T) {
	otp, err := GenerateOTP()
	if err != nil {
		t.Fatalf("GenerateOTP: unexpected error: %v", err)
	}
	if len(otp) != 6 {
		t.Errorf("GenerateOTP: expected 6 digits, got %d chars: %q", len(otp), otp)
	}
}

func TestGenerateOTP_OnlyDigits(t *testing.T) {
	otp, _ := GenerateOTP()
	for _, c := range otp {
		if c < '0' || c > '9' {
			t.Errorf("GenerateOTP: found non-digit char %q in OTP %q", string(c), otp)
		}
	}
}

func TestGenerateOTP_Uniqueness(t *testing.T) {
	otps := map[string]bool{}
	for i := 0; i < 50; i++ {
		otp, _ := GenerateOTP()
		otps[otp] = true
	}
	// With 50 random 6-digit OTPs, we expect at least 40 unique ones
	if len(otps) < 40 {
		t.Errorf("GenerateOTP uniqueness: only %d unique out of 50", len(otps))
	}
}

func TestHashOTP_Deterministic(t *testing.T) {
	h1 := HashOTP("123456")
	h2 := HashOTP("123456")
	if h1 != h2 {
		t.Errorf("HashOTP: same input gave different hashes: %q vs %q", h1, h2)
	}
}

func TestHashOTP_DifferentInputs(t *testing.T) {
	h1 := HashOTP("123456")
	h2 := HashOTP("654321")
	if h1 == h2 {
		t.Error("HashOTP: different inputs produced same hash")
	}
}

func TestHashOTP_Length(t *testing.T) {
	h := HashOTP("123456")
	// SHA-256 produces 64 hex chars
	if len(h) != 64 {
		t.Errorf("HashOTP: expected 64 hex chars, got %d: %q", len(h), h)
	}
}

func TestSendOTPEmail_MissingCredentials(t *testing.T) {
	// Ensure SMTP env vars are empty
	t.Setenv("SMTP_HOST", "")
	t.Setenv("SMTP_PORT", "")
	t.Setenv("SMTP_USER", "")
	t.Setenv("SMTP_PASS", "")

	err := SendOTPEmail("test@example.com", "123456")
	if err == nil {
		t.Error("SendOTPEmail: expected error for missing credentials, got nil")
	}
}
