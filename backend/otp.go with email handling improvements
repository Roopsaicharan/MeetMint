package main

import (
	"crypto/rand"
	"crypto/sha256"
	"fmt"
	"io"
	"net/smtp"
	"os"
)

// GenerateOTP produces a secure 6-digit numeric OTP using crypto/rand.
func GenerateOTP() (string, error) {
	const digits = "0123456789"
	otp := make([]byte, 6)
	if _, err := io.ReadFull(rand.Reader, otp); err != nil {
		return "", err
	}
	for i := range otp {
		otp[i] = digits[int(otp[i])%len(digits)]
	}
	return string(otp), nil
}

// HashOTP returns a hex-encoded SHA-256 hash of the OTP for secure storage.
func HashOTP(otp string) string {
	hash := sha256.Sum256([]byte(otp))
	return fmt.Sprintf("%x", hash)
}

// SendOTPEmail sends the OTP via standard net/smtp using environment variables.
// In a production environment, this would be replaced by a 3rd-party API call.
func SendOTPEmail(to, otp string) error {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")

	if host == "" || port == "" || user == "" || pass == "" {
		return fmt.Errorf("SMTP credentials not fully configured in environment")
	}

	auth := smtp.PlainAuth("", user, pass, host)

	subject := "Subject: Your MeetMint Login Code\n"
	body := fmt.Sprintf("Your OTP code is: %s\nThis code will expire in 5 minutes.", otp)
	msg := []byte(subject + "\n" + body)

	addr := fmt.Sprintf("%s:%s", host, port)
	err := smtp.SendMail(addr, auth, user, []string{to}, msg)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}
