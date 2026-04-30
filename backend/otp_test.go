package main

import (
	"os"
	"testing"
)

func TestGenerateOTP(t *testing.T) {
	otp, err := GenerateOTP()
	if err != nil {
		t.Fatalf("GenerateOTP failed: %v", err)
	}
	if len(otp) != 6 {
		t.Errorf("Expected 6-digit OTP, got %d digits: %s", len(otp), otp)
	}
	// Basic check that it's numeric
	for _, char := range otp {
		if char < '0' || char > '9' {
			t.Errorf("OTP contains non-numeric character: %c", char)
		}
	}
}

func TestHashOTP(t *testing.T) {
	otp := "123456"
	hash1 := HashOTP(otp)
	hash2 := HashOTP(otp)

	if hash1 != hash2 {
		t.Errorf("HashOTP: expected consistent hashes for same input, got %s and %s", hash1, hash2)
	}

	if len(hash1) != 64 {
		t.Errorf("HashOTP: expected 64-character SHA-256 hex string, got length %d", len(hash1))
	}

	diffOTP := "654321"
	hash3 := HashOTP(diffOTP)
	if hash1 == hash3 {
		t.Errorf("HashOTP: expected different hashes for different inputs, both got %s", hash1)
	}
}

func TestSendOTPEmail_ErrorWhenNotConfigured(t *testing.T) {
	// Clear SMTP env vars to trigger error branch
	os.Unsetenv("SMTP_HOST")
	os.Unsetenv("SMTP_PORT")
	os.Unsetenv("SMTP_USER")
	os.Unsetenv("SMTP_PASS")

	err := SendOTPEmail("test@example.com", "123456")
	if err == nil {
		t.Error("SendOTPEmail: expected error when SMTP credentials are missing, got nil")
	}
	if err.Error() != "SMTP credentials not fully configured in environment" {
		t.Errorf("SendOTPEmail: unexpected error message: %v", err)
	}
}
