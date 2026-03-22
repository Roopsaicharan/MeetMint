package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/rs/cors"
)

//Data Structs        
type SummaryResponse struct {
	Summary     string       `json:"summary"`
	Decisions   []string     `json:"decisions"`
	ActionItems []ActionItem `json:"action_items"`
}

type ActionItem struct {
	Title string `json:"title"`
	Owner string `json:"owner"`
	Due   string `json:"due"`
}

type AskResponse struct {
	Answer   string `json:"answer"`
	Citation string `json:"citation"`
}

type LoginRequest struct {
	Email string `json:"email"`
}

type VerifyOTPRequest struct {
	Email string `json:"email"`
	OTP   string `json:"otp"`
}

type AuthResponse struct {
	Message string `json:"message"`
	User    struct {
		Email string `json:"email"`
	} `json:"user,omitempty"`
}

type SignupRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func main() {
	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "MeetMint Backend is running")
	})

	// Mock Signup Endpoint
	mux.HandleFunc("/api/signup", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req SignupRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		resp := AuthResponse{
			Message: "Registration successful! (Mock)",
		}
		resp.User.Email = req.Email

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	// Mock Login Endpoint
	mux.HandleFunc("/api/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		resp := AuthResponse{
			Message: "OTP sent to your email! (Mock: use 123456)",
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	// Mock Verify OTP Endpoint
	mux.HandleFunc("/api/verify-otp", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req VerifyOTPRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		// Mock verification logic
		resp := AuthResponse{
			Message: "Login successful",
		}
		resp.User.Email = req.Email

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	// Mock GenAI Summary Endpoint
	mux.HandleFunc("/api/summary", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Simulate processing delay
		time.Sleep(500 * time.Millisecond)

		resp := SummaryResponse{
			Summary: "The MeetMint team finalized the Sprint 1 requirements and successfully implemented the Glassmorphism theme across the dashboard.",
			Decisions: []string{
				"Frontend will use Glassmorphism for all new modules",
				"Backend Go server to handle dynamic status updates",
			},
			ActionItems: []ActionItem{
				{Title: "Implement Glass UI components", Owner: "Jayanth", Due: "Friday"},
				{Title: "Refactor Dashboard for horizontal layout", Owner: "Ashmitha", Due: "Saturday"},
				{Title: "Setup Go API for task tracking", Owner: "ROOP", Due: "Thursday"},
				{Title: "Integrate CORS and RAG logic", Owner: "NARASIMHA", Due: "Friday"},
			},
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	// Mock RAG Endpoint
	mux.HandleFunc("/api/ask", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Simulate processing delay
		time.Sleep(300 * time.Millisecond)

		resp := AskResponse{
			Answer:   "The frontend UI task was assigned to Jayanth and Ashmitha.",
			Citation: "Meeting Notes - line 2",
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	// Mock Video Upload & Note Generation Endpoint
	mux.HandleFunc("/api/upload-video", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Parse multipart form (max 50MB)
		err := r.ParseMultipartForm(50 << 20)
		if err != nil {
			http.Error(w, "Unable to parse form", http.StatusBadRequest)
			return
		}

		// Retrieve the file
		file, handler, err := r.FormFile("video")
		if err != nil {
			http.Error(w, "Error retrieving file", http.StatusBadRequest)
			return
		}
		defer file.Close()

		fmt.Printf("Received uploaded file: %+v\n", handler.Filename)
		fmt.Printf("File size: %+v\n", handler.Size)
		fmt.Printf("MIME Header: %+v\n", handler.Header)

		// Simulate video processing/transcription delay
		time.Sleep(1500 * time.Millisecond)

		// Mocked notes response
		mockNotes := "Meeting Date: Feb 15, 2026\n\nAttendees: Jayanth, Ashmitha, ROOP, NARASIMHA\n\nDiscussion Points:\n1. Sprint 1 Prototype:\n   - Jayanth and Ashmitha will focus on the Frontend glass theme and horizontal dashboard.\n   - ROOP and NARASIMHA are responsible for the Go backend and AI integration.\n\n2. Status Tracking:\n   - The team decided to implement a real-time status update system (TODO to DONE).\n\nAction Items:\n- Jayanth: Implement Glass UI components (Due: Fri)\n- Ashmitha: Refactor Dashboard for horizontal layout (Due: Sat)\n- ROOP: Setup Go API for task tracking (Due: Thu)\n- NARASIMHA: Integrate CORS and RAG logic (Due: Fri)"

		resp := map[string]string{
			"notes": mockNotes,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	// CORS Setup for secure communication betwwen frontend and backend.
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"}, // Allow Vite default port
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type"},
		AllowCredentials: true,
	})

	handler := c.Handler(mux)

	PORT := 5000
	fmt.Printf("Backend running on http://localhost:%d\n", PORT)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", PORT), handler))
}
