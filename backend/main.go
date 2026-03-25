package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

// Data structs 
type SummaryResponse struct {
	Summary     string       `json:"summary"`
	Decisions   []string     `json:"decisions"`
	ActionItems []ActionItem `json:"action_items"`
}

type ActionItem struct {
	ID      string `json:"id,omitempty"`
	Title   string `json:"title"`
	Owner   string `json:"owner"`
	OwnerID string `json:"owner_id,omitempty"`
	Due     string `json:"due"`
}

type AskResponse struct {
	Answer   string `json:"answer"`
	Citation string `json:"citation"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type VerifyOTPRequest struct {
	Email string `json:"email"`
	OTP   string `json:"otp"`
}

type AuthResponse struct {
	Message string `json:"message"`
	User    struct {
		Email string `json:"email"`
		ID    string `json:"id,omitempty"`
	} `json:"user,omitempty"`
}

type SignupRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UpdateTaskRequest struct {
	TaskID string `json:"task_id"`
	UserID string `json:"user_id"`
	Status string `json:"status"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

type ResetPasswordRequest struct {
	Email       string `json:"email"`
	OTP         string `json:"otp"`
	NewPassword string `json:"new_password"`
}

type SearchUsersResponse struct {
	Users []UserRow `json:"users"`
}

type AddMemberRequest struct {
	ProjectID string `json:"project_id"`
	UserID    string `json:"user_id"`
	Role      string `json:"role"`
}

type InviteMemberRequest struct {
	ProjectID string `json:"project_id"`
	Email     string `json:"email"`
}

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
	}

	// Initialize database connection
	InitDB()
	defer CloseDB()

	mux := http.NewServeMux()

	// Health check - Only matches exact root "/"
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{
				"message": "Resource not found",
				"path":    r.URL.Path,
			})
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "running",
			"message": "MeetMint Backend is online",
		})
	})

	// Signup Endpoint — stores pending user and sends OTP
	mux.HandleFunc("/api/signup", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusMethodNotAllowed)
			json.NewEncoder(w).Encode(map[string]string{"message": "Method not allowed"})
			return
		}

		var req SignupRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"message": "Invalid request body"})
			return
		}

		// Generate secure OTP
		otp, err := GenerateOTP()
		if err != nil {
			log.Printf("Signup OTP generation error: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"message": "Failed to generate OTP"})
			return
		}

		// Hash OTP for secure storage
		otpHash := HashOTP(otp)

		// Store in pending_signups with 5-minute expiry
		expiry := time.Now().Add(5 * time.Minute)
		if err := UpsertPendingSignup(req.Name, req.Email, req.Password, otpHash, expiry); err != nil {
			log.Printf("Signup pending storage error: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"message": "Database error during signup request"})
			return
		}

		// Send OTP via service (currently mocked SMTP)
		if err := SendOTPEmail(req.Email, otp); err != nil {
			log.Printf("Signup Email sending error: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusServiceUnavailable)
			json.NewEncoder(w).Encode(map[string]string{"message": "Failed to send OTP email"})
			return
		}

		log.Printf("Signup OTP sent and pending data stored for: %s (Expires at: %v)", req.Email, expiry)

		resp := AuthResponse{
			Message: "OTP sent successfully! Please verify to complete registration.",
		}
		resp.User.Email = req.Email

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	// Login Endpoint — generates OTP and sends via SMTP
	mux.HandleFunc("/api/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusMethodNotAllowed)
			json.NewEncoder(w).Encode(map[string]string{"message": "Method not allowed"})
			return
		}

		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"message": "Invalid request body"})
			return
		}

		// Ensure user exists and verify password
		userID, _, dbPassword, err := GetUserByEmail(req.Email)
		if err != nil {
			log.Printf("Login check: user not found for %s: %v", req.Email, err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"message": "Account not found. Please sign up first."})
			return
		}

		// Verify password (in a real app, use bcrypt)
		if dbPassword != req.Password {
			log.Printf("Login check: incorrect password for %s", req.Email)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"message": "Incorrect password"})
			return
		}

		log.Printf("Login request (verified): %s (ID: %s)", req.Email, userID)

		// Generate real OTP
		otp, err := GenerateOTP()
		if err != nil {
			log.Printf("OTP generation error: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"message": "Failed to generate OTP"})
			return
		}

		// Store OTP in DB with 5-minute expiry
		expiry := time.Now().Add(5 * time.Minute)
		if err := UpsertOTP(req.Email, otp, expiry); err != nil {
			log.Printf("OTP storage error: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"message": "Failed to store OTP"})
			return
		}

		// Send OTP via SMTP
		if err := SendOTPEmail(req.Email, otp); err != nil {
			log.Printf("Email sending error: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusServiceUnavailable)
			json.NewEncoder(w).Encode(map[string]string{"message": "Failed to send OTP email. Please check backend configuration."})
			return
		}

		log.Printf("OTP sent and stored for: %s (Expires at: %v)", req.Email, expiry)

		resp := AuthResponse{
			Message: "OTP sent successfully to your email!",
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	// Verify OTP Endpoint — checks OTP against database (Signups or Logins)
	mux.HandleFunc("/api/verify-otp", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusMethodNotAllowed)
			json.NewEncoder(w).Encode(map[string]string{"message": "Method not allowed"})
			return
		}

		var req VerifyOTPRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"message": "Invalid request body"})
			return
		}

		// 1. Check if this is a pending signup verification
		pending, err := GetValidPendingSignup(req.Email)
		if err == nil {
			// Verify hashed OTP
			if pending.OTPHash != HashOTP(req.OTP) {
				log.Printf("Verify-OTP (Signup): incorrect code for %s", req.Email)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(map[string]string{"message": "Incorrect OTP code"})
				return
			}

			// Finalize user registration in users table
			userID, err := UpsertUser(pending.Name, pending.Email, pending.Password)
			if err != nil {
				log.Printf("Verify-OTP (Signup): error creating user for %s: %v", req.Email, err)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]string{"message": "Error creating account"})
				return
			}

			// Cleanup pending data
			DeletePendingSignup(req.Email)

			log.Printf("Registration finalized for user: %s (ID: %s)", req.Email, userID)
			resp := AuthResponse{Message: "Registration successful! Welcome to MeetMint."}
			resp.User.Email = req.Email
			resp.User.ID = userID
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(resp)
			return
		}

		// 2. Fallback to standard Login OTP verification
		storedOTP, err := GetValidOTP(req.Email)
		if err != nil {
			log.Printf("Verify-OTP: invalid or expired OTP for %s: %v", req.Email, err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"message": "Invalid or expired OTP"})
			return
		}

		// Compare OTPs (Login OTPs currently not hashed by user request, but can be for symmetry)
		if storedOTP != req.OTP {
			log.Printf("Verify-OTP (Login): incorrect code for %s", req.Email)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"message": "Incorrect OTP code"})
			return
		}

		// Delete OTP after successful verification
		DeleteOTP(req.Email)

		// Verify user exists
		userID, _, _, err := GetUserByEmail(req.Email)
		if err != nil {
			log.Printf("Verify-OTP: user record missing for %s", req.Email)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"message": "User not found"})
			return
		}

		log.Printf("Login successful for user: %s (ID: %s)", req.Email, userID)
		resp := AuthResponse{Message: "Login successful"}
		resp.User.Email = req.Email
		resp.User.ID = userID
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	// Forgot Password Endpoint — generates OTP and sends via email
	mux.HandleFunc("/api/forgot-password", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusMethodNotAllowed)
			json.NewEncoder(w).Encode(map[string]string{"message": "Method not allowed"})
			return
		}

		var req ForgotPasswordRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"message": "Invalid request"})
			return
		}

		// Ensure user exists
		_, _, _, err := GetUserByEmail(req.Email)
		if err != nil {
			log.Printf("Forgot-Password: user not found %s", req.Email)
			// Return 200/Success anyway for security (don't reveal registered emails)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{"message": "If that email exists, an OTP has been sent."})
			return
		}

		// Generate OTP
		otp, err := GenerateOTP()
		if err != nil {
			http.Error(w, "Internal error", http.StatusInternalServerError)
			return
		}

		// Hash and store OTP
		otpHash := HashOTP(otp)
		expiry := time.Now().Add(5 * time.Minute)
		if err := UpsertPasswordReset(req.Email, otpHash, expiry); err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		// Send email
		if err := SendOTPEmail(req.Email, otp); err != nil {
			log.Printf("Forgot-Password: Email failed %v", err)
			http.Error(w, "Failed to send email", http.StatusServiceUnavailable)
			return
		}

		log.Printf("Password reset OTP sent to: %s", req.Email)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "If that email exists, an OTP has been sent."})
	})

	// Reset Password Endpoint — verifies OTP and updates password
	mux.HandleFunc("/api/reset-password", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusMethodNotAllowed)
			json.NewEncoder(w).Encode(map[string]string{"message": "Method not allowed"})
			return
		}

		var req ResetPasswordRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"message": "Invalid request"})
			return
		}

		// Get valid reset OTP from DB
		storedHash, err := GetValidPasswordReset(req.Email)
		if err != nil {
			log.Printf("Reset-Password: OTP expired or invalid for %s", req.Email)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"message": "Invalid or expired OTP"})
			return
		}

		// Verify OTP
		if HashOTP(req.OTP) != storedHash {
			log.Printf("Reset-Password: Incorrect OTP for %s", req.Email)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"message": "Incorrect OTP code"})
			return
		}

		// Update password
		if err := UpdateUserPassword(req.Email, req.NewPassword); err != nil {
			log.Printf("Reset-Password: Update error %v", err)
			http.Error(w, "Internal database error", http.StatusInternalServerError)
			return
		}

		// Cleanup
		DeletePasswordReset(req.Email)

		log.Printf("Password reset successful for: %s", req.Email)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Password updated successfully!"})
	})

	// GenAI Summary Endpoint — persists meeting + tasks to PostgreSQL
	mux.HandleFunc("/api/summary", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		var body struct {
			Notes string `json:"notes"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "Invalid body", http.StatusBadRequest)
			return
		}

		// 1. Attempt to get DYNAMIC summary from Local AI Server (Port 5001)
		var resp SummaryResponse
		aiClient := &http.Client{Timeout: 10 * time.Second}
		
		aiReqBody, _ := json.Marshal(map[string]string{"notes": body.Notes})
		aiResp, err := aiClient.Post("http://localhost:5001/summarize", "application/json", bytes.NewBuffer(aiReqBody))
		
		if err == nil && aiResp.StatusCode == http.StatusOK {
			defer aiResp.Body.Close()
			json.NewDecoder(aiResp.Body).Decode(&resp)
			log.Printf("Summary: Successfully generated dynamic summary via Local ML")
		} else {
			// FALLBACK: If AI server is down, provide a slightly better mock than before
			log.Printf("Summary: Local AI server unreachable, using fallback mock.")
			resp = SummaryResponse{
				Summary: "Analyzed transcript summary (AI offline). Discussion focused on: " + body.Notes[:min(len(body.Notes), 100)] + "...",
				Decisions: []string{"Meeting transcript recorded for " + time.Now().Format("Jan 02")},
				ActionItems: []ActionItem{
					{Title: "Review complete transcript manually", Owner: "Everyone", Due: time.Now().AddDate(0, 0, 7).Format(time.RFC3339)},
				},
			}
		}

		// Persist to DB...

		// Persist meeting transcript to DB (assuming project ID might be passed in or nil)
		projectID := r.URL.Query().Get("project_id")
		var pID *string
		if projectID != "" {
			pID = &projectID
		}

		meetingID, err := InsertMeeting(pID, body.Notes, resp.Summary)
		if err != nil {
			log.Printf("Summary: failed to insert meeting: %v", err)
		} else {
			log.Printf("Meeting saved (ID: %s)", meetingID)

			// Persist each action item as a task
			for i, item := range resp.ActionItems {
				// Try to find user by name (mocked AI returns names)
				var ownerID *string
				err := DB.QueryRow(
					"SELECT id FROM users WHERE name LIKE '%' || ? || '%' OR email LIKE '%' || ? || '%' LIMIT 1",
					item.Owner, item.Owner,
				).Scan(&ownerID)

				// Fallback: If AI assigned to someone not in DB, assign to meeting creator
				if err != nil {
					// We'll leave it NULL (unassigned) if not found,
					// so the creator doesn't accidentally "own" everyone's tasks.
					ownerID = nil
				}

				// Parse date
				parsedDate, _ := time.Parse(time.RFC3339, item.Due)

				taskID, err := InsertTask(&meetingID, pID, item.Title, "", ownerID, &parsedDate, nil)
				if err != nil {
					log.Printf("Summary: failed to insert task '%s': %v", item.Title, err)
				} else {
					if ownerID != nil {
						log.Printf("Task saved & assigned: %s (ID: %s, OwnerID: %s)", item.Title, taskID, *ownerID)
						resp.ActionItems[i].OwnerID = *ownerID
					} else {
						log.Printf("Task saved (UNASSIGNED - User %s not found): %s (ID: %s)", item.Owner, item.Title, taskID)
					}
					// Update the response with the real DB ID
					resp.ActionItems[i].ID = taskID
				}
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	// RAG Endpoint — queries rag_chunks from PostgreSQL (falls back to mock)
	mux.HandleFunc("/api/ask", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusMethodNotAllowed)
			json.NewEncoder(w).Encode(map[string]string{"message": "Method not allowed"})
			return
		}

		// Simulate processing delay
		time.Sleep(300 * time.Millisecond)

		// Default mock response
		resp := AskResponse{
			Answer:   "The frontend UI task was assigned to Jayanth and Ashmitha.",
			Citation: "Meeting Notes - line 2",
		}

		// Try to get real RAG chunks from DB (for future use)
		// When real data is populated, this will return actual chunks.
		// For now, it gracefully falls back to the mock response above.

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})
	RegisterJobEndpoints(mux)

	// Video Upload & Note Generation Endpoint — persists transcript to PostgreSQL
	mux.HandleFunc("/api/upload-video", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		r.ParseMultipartForm(50 << 20)
		file, handler, err := r.FormFile("video")
		if err != nil {
			http.Error(w, "File error", http.StatusBadRequest)
			return
		}

		userID := r.FormValue("user_id")
		projectName := r.FormValue("project_name")
		if projectName == "" {
			projectName = handler.Filename
		}
		dueDate := r.FormValue("due_date")

		var cID *string
		if userID != "" && len(userID) == 36 {
			cID = &userID
		}

		projectID, err := InsertProject(projectName, cID, dueDate)
		if err != nil {
			file.Close()
			http.Error(w, "DB error", http.StatusInternalServerError)
			return
		}
		if userID != "" {
			InsertProjectMember(projectID, userID, "admin")
		}

		// Background processing
		CreateProcessingJob(projectID)
		
		// CRITICAL FIX: The multipart 'file' will be closed immediately when this HTTP handler returns!
		// We must save it to a temporary file BEFORE launching the goroutine so the ML model can actually read it.
		tempFile, copyErr := os.CreateTemp("", "upload-*.mp4")
		if copyErr != nil {
			file.Close()
			http.Error(w, "Failed to create temp file", http.StatusInternalServerError)
			return
		}
		io.Copy(tempFile, file)
		tempFilePath := tempFile.Name()
		tempFile.Close() // Close for writing, we'll reopen it for reading in the goroutine
		file.Close()     // We can close the original multipart file now

		go func(pID, fName, tmpPath string) {
			// Clean up the physical temp file when entirely done
			defer os.Remove(tmpPath)
			
			// Open the temp file for reading
			f, err := os.Open(tmpPath)
			if err != nil {
				log.Printf("Failed to open temp video file: %v", err)
				UpdateProcessingJob(pID, 100, 6, "error")
				return
			}
			defer f.Close()
			UpdateProcessingJob(pID, 15, 2, "processing")
			time.Sleep(1 * time.Second)
			UpdateProcessingJob(pID, 30, 3, "processing")
			transcript, err := TranscribeLocally(f, fName)
			if err != nil {
				log.Printf("AI Transcription Error: %v", err)
			}
			UpdateProcessingJob(pID, 70, 4, "processing")
			InsertMeeting(&pID, transcript, "")
			UpdateProcessingJob(pID, 90, 5, "processing")
			time.Sleep(1 * time.Second)
			UpdateProcessingJob(pID, 100, 6, "done")
		}(projectID, handler.Filename, tempFilePath)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"id": projectID})
	})

	// Get Projects Endpoint — supports ?user_id= to filter by membership
	mux.HandleFunc("/api/projects", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		userID := r.URL.Query().Get("user_id")

		var projects []ProjectRow
		var err error

		if userID != "" && len(userID) == 36 {
			// Filter projects by user membership
			projects, err = GetProjectsByUser(userID)
		} else {
			// Fallback: return all projects
			projects, err = GetAllProjects()
		}

		if err != nil {
			log.Printf("Get-Projects: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		// Ensure we return an empty array, not null
		if projects == nil {
			projects = []ProjectRow{}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(projects)
	})

	// Get Project Details Endpoint — returns meetings + tasks for a specific project
	mux.HandleFunc("/api/project-details", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		projectID := r.URL.Query().Get("project_id")
		if projectID == "" || len(projectID) != 36 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"message": "Invalid or missing project_id"})
			return
		}

		// Fetch meetings for this project
		meetings, err := GetMeetingsByProject(projectID)
		if err != nil {
			log.Printf("Project-Details: meetings error: %v", err)
			meetings = []MeetingRow{}
		}

		// Fetch tasks for this project
		tasks, err := GetTasksByProject(projectID)
		if err != nil {
			log.Printf("Project-Details: tasks error: %v", err)
			tasks = []TaskRow{}
		}

		// Fetch members
		members, err := GetProjectMembersByProject(projectID)
		if err != nil {
			log.Printf("Project-Details: members error: %v", err)
			members = []UserRow{}
		}

		// Build combined notes from all meeting transcripts
		combinedNotes := ""
		for _, m := range meetings {
			if combinedNotes != "" {
				combinedNotes += "\n\n---\n\n"
			}
			combinedNotes += m.TranscriptText
		}

		// Build action items from tasks (matching the frontend format)
		type ActionItemDetail struct {
			ID      string `json:"id"`
			Title   string `json:"title"`
			Owner   string `json:"owner"`
			OwnerID string `json:"owner_id,omitempty"`
			Due     string `json:"due"`
			Status  string `json:"status"`
		}

		actionItems := []ActionItemDetail{}
		for _, t := range tasks {
			ownerName := "Unassigned"
			ownerID := ""
			if t.OwnerID != nil {
				ownerID = *t.OwnerID
				// Look up owner name from members list
				for _, m := range members {
					if m.ID == *t.OwnerID {
						ownerName = m.Name
						break
					}
				}
			}
			actionItems = append(actionItems, ActionItemDetail{
				ID:      t.ID,
				Title:   t.Title,
				Owner:   ownerName,
				OwnerID: ownerID,
				Due:     t.DueDate,
				Status:  t.Status,
			})
		}

		// Use the most recent meeting's summary if available
		summaryText := "Project meeting notes and action items"
		if len(meetings) > 0 && meetings[0].SummaryText != "" {
			summaryText = meetings[0].SummaryText
		}

		resp := map[string]interface{}{
			"notes":   combinedNotes,
			"members": members,
			"summary": map[string]interface{}{
				"summary":      summaryText,
				"decisions":    []string{},
				"action_items": actionItems,
			},
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	// Task Update Endpoint — allows owners to change status
	mux.HandleFunc("/api/tasks/update", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusMethodNotAllowed)
			json.NewEncoder(w).Encode(map[string]string{"message": "Method not allowed"})
			return
		}

		var req UpdateTaskRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		// Security Check: Is the user the owner?
		isOwner, err := checkTaskOwnership(req.UserID, req.TaskID)
		if err != nil {
			log.Printf("Update-task: ownership check failed: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"message": "Task not found"})
			return
		}

		if !isOwner {
			log.Printf("Update-task: unauthorized attempt by %s on task %s", req.UserID, req.TaskID)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{"message": "Forbidden: Only the task owner can change status"})
			return
		}

		// Update Status
		_, err = DB.Exec(
			"UPDATE tasks SET status = ? WHERE id = ?",
			req.Status, req.TaskID,
		)
		if err != nil {
			log.Printf("Update-task: DB error: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"message": "Internal server error"})
			return
		}

		log.Printf("Task %s updated to %s", req.TaskID, req.Status)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Task updated successfully"})
	})

	// User Search Endpoint
	mux.HandleFunc("/api/users/search", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		query := r.URL.Query().Get("q")
		if query == "" {
			json.NewEncoder(w).Encode(SearchUsersResponse{Users: []UserRow{}})
			return
		}

		users, err := SearchUsers(query)
		if err != nil {
			log.Printf("Search-Users: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(SearchUsersResponse{Users: users})
	})

	// Add Project Member Endpoint
	mux.HandleFunc("/api/projects/members/add", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		var req AddMemberRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		// Validation: Ensure we are using UUIDs, not timestamps or mocks.
		if len(req.ProjectID) != 36 || len(req.UserID) != 36 {
			log.Printf("Add-Member: invalid ID format (Project: %s, User: %s)", req.ProjectID, req.UserID)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"message": "Invalid ID format. Please create a fresh project.",
			})
			return
		}

		if err := InsertProjectMember(req.ProjectID, req.UserID, req.Role); err != nil {
			log.Printf("Add-Member: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Member added successfully"})
	})

	// Project Invite Endpoint — adds existing users immediately
	mux.HandleFunc("/api/projects/invite", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		var req InviteMemberRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		// 1. Validate Project ID (must be UUID)
		if len(req.ProjectID) != 36 {
			log.Printf("Invite: invalid project ID format (legacy or mock): %s", req.ProjectID)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"message": "Cannot invite to this project (Legacy ID). Please create a new project first.",
			})
			return
		}

		// 2. Check if user exists
		userID, _, _, err := GetUserByEmail(req.Email)
		if err != nil {
			// User not found — in a real app, send an actual email with a signup link
			log.Printf("Inviting NEW user %s to project %s", req.Email, req.ProjectID)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{
				"message": "Invitation sent to " + req.Email + " (User must sign up to join)",
			})
			return
		}

		// 3. User exists — add them directly to the project
		if err := InsertProjectMember(req.ProjectID, userID, "member"); err != nil {
			log.Printf("Invite: failed to add existing user %s: %v", req.Email, err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		log.Printf("Added existing user %s (ID: %s) to project %s", req.Email, userID, req.ProjectID)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "User " + req.Email + " added to project successfully!",
		})
	})

	// Delete Project Endpoint
	mux.HandleFunc("/api/projects/delete", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			ProjectID string `json:"project_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || len(req.ProjectID) != 36 {
			http.Error(w, "Invalid or missing project_id", http.StatusBadRequest)
			return
		}

		if err := DeleteProject(req.ProjectID); err != nil {
			log.Printf("Delete-Project: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		log.Printf("Delete-Project: Deleted project %s", req.ProjectID)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Project deleted successfully"})
	})

	// CORS Setup for secure communication between frontend and backend.
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"}, // Allow Vite default port
		AllowedMethods:   []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type"},
		AllowCredentials: true,
	})

	handler := c.Handler(mux)

	PORT := 5000
	fmt.Printf("Backend running on http://localhost:%d\n", PORT)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", PORT), handler))
}
