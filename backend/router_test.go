package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

func TestRouter_Home(t *testing.T) {
	resetDB()
	router := SetupRouter()
	
	req := httptest.NewRequest("GET", "/", nil)
	rr := httptest.NewRecorder()
	
	router.ServeHTTP(rr, req)
	
	if rr.Code != http.StatusOK {
		t.Errorf("Home handler returned wrong status code: got %v want %v", rr.Code, http.StatusOK)
	}
	
	var resp map[string]string
	json.NewDecoder(rr.Body).Decode(&resp)
	if resp["status"] != "running" {
		t.Errorf("Expected status 'running', got %q", resp["status"])
	}
}

func TestRouter_SignupFlow(t *testing.T) {
	resetDB()
	router := SetupRouter()
	os.Setenv("SMTP_HOST", "mock") // skip email sending error

	// 1. Post to signup
	reqBody, _ := json.Marshal(SignupRequest{
		Name:     "Test User",
		Email:    "test@example.com",
		Password: "password123",
	})
	req := httptest.NewRequest("POST", "/api/signup", bytes.NewBuffer(reqBody))
	rr := httptest.NewRecorder()
	
	router.ServeHTTP(rr, req)
	
	if rr.Code != http.StatusOK {
		t.Fatalf("Signup failed: %v", rr.Body.String())
	}

	// 2. Verify OTP check (Signup flow)
	pending, _ := GetValidPendingSignup("test@example.com")
	if pending.Email != "test@example.com" {
		t.Errorf("Pending signup not found in DB")
	}
}

func TestRouter_LoginResponse(t *testing.T) {
	resetDB()
	router := SetupRouter()
	os.Setenv("SMTP_HOST", "mock")
	
	// Create user
	UpsertUser("Login Man", "login@example.com", "secret")
	
	reqBody, _ := json.Marshal(LoginRequest{
		Email:    "login@example.com",
		Password: "secret",
	})
	req := httptest.NewRequest("POST", "/api/login", bytes.NewBuffer(reqBody))
	rr := httptest.NewRecorder()
	
	router.ServeHTTP(rr, req)
	
	if rr.Code != http.StatusOK {
		t.Errorf("Login handler failed: %v", rr.Body.String())
	}
}

func TestRouter_GetProjects_Empty(t *testing.T) {
	resetDB()
	router := SetupRouter()
	
	req := httptest.NewRequest("GET", "/api/projects", nil)
	rr := httptest.NewRecorder()
	
	router.ServeHTTP(rr, req)
	
	if rr.Code != http.StatusOK {
		t.Errorf("GetProjects failed: %v", rr.Body.String())
	}
	
	var projects []ProjectRow
	json.NewDecoder(rr.Body).Decode(&projects)
	if len(projects) != 0 {
		t.Errorf("Expected 0 projects, got %v", len(projects))
	}
}

func TestRouter_SummaryFallback(t *testing.T) {
	resetDB()
	router := SetupRouter()
	
	reqBody, _ := json.Marshal(map[string]string{"notes": "Project kick-off notes"})
	req := httptest.NewRequest("POST", "/api/summary", bytes.NewBuffer(reqBody))
	rr := httptest.NewRecorder()
	
	router.ServeHTTP(rr, req)
	
	if rr.Code != http.StatusOK {
		t.Errorf("Summary handler failed: %v", rr.Body.String())
	}
}
