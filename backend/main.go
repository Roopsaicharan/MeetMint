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

	mux := SetupRouter()

	// CORS Setup
	c := cors.New(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:5173",
			"http://127.0.0.1:5173",
			"https://meet-mint.vercel.app",
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	handler := c.Handler(mux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	log.Printf("Starting backend on port %s...", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// SetupRouter creates and returns the http.ServeMux with all routes.
func SetupRouter() *http.ServeMux {
	mux := http.NewServeMux()

	// 1. Core Endpoints
	mux.HandleFunc("/", handleHome)

	// 2. Authentication Endpoints
	mux.HandleFunc("/api/signup", handleSignup)
	mux.HandleFunc("/api/login", handleLogin)
	mux.HandleFunc("/api/verify-otp", handleVerifyOTP)
	mux.HandleFunc("/api/forgot-password", handleForgotPassword)
	mux.HandleFunc("/api/reset-password", handleResetPassword)

	// 3. Project & Meeting Endpoints
	mux.HandleFunc("/api/summary", handleSummary)
	mux.HandleFunc("/api/ask", handleAsk)
	mux.HandleFunc("/api/upload-video", handleUploadVideo)
	mux.HandleFunc("/api/projects", handleGetProjects)
	mux.HandleFunc("/api/project-details", handleProjectDetails)
	mux.HandleFunc("/api/projects/delete", handleDeleteProject)
	mux.HandleFunc("/api/projects/members/add", handleAddMember)
	mux.HandleFunc("/api/projects/invite", handleInviteMember)

	// 4. Task Endpoints
	mux.HandleFunc("/api/tasks/update", handleUpdateTaskStatus)

	// 5. User Endpoints
	mux.HandleFunc("/api/users/search", handleSearchUsers)

	// Register job status endpoints (from job_endpoints.go)
	RegisterJobEndpoints(mux)

	return mux
}

// ---- HANDLERS ----

func handleHome(w http.ResponseWriter, r *http.Request) {
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
}

func handleSignup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"message": "Method not allowed"})
		return
	}

	var req SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	otp, err := GenerateOTP()
	if err != nil {
		http.Error(w, "Failed to generate OTP", http.StatusInternalServerError)
		return
	}

	otpHash := HashOTP(otp)
	expiry := time.Now().Add(5 * time.Minute)
	if err := UpsertPendingSignup(req.Name, req.Email, req.Password, otpHash, expiry); err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	_ = SendOTPEmail(req.Email, otp) // Fire and forget for prototype

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AuthResponse{Message: "OTP sent successfully!"})
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("handleLogin: Failed to decode body: %v", err)
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	log.Printf("Login attempt for %s", req.Email)
	_, name, storedStaticPass, err := GetUserByEmail(req.Email)
	if err != nil || storedStaticPass != req.Password {
		log.Printf("Login failed for %s: user not found or password mismatch", req.Email)
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	otp, _ := GenerateOTP()
	expiry := time.Now().Add(5 * time.Minute)
	UpsertOTP(req.Email, otp, expiry)
	_ = SendOTPEmail(req.Email, otp)

	log.Printf("Login OTP sent to %s: %s", req.Email, otp) // Log OTP for debugging
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "OTP sent!",
		"name":    name,
	})
}

func handleVerifyOTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req VerifyOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("VerifyOTP: Failed to decode body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("VerifyOTP called for %s with OTP %s", req.Email, req.OTP)

	// 1. Check signup flow
	pending, err := GetValidPendingSignup(req.Email)
	if err == nil {
		storedHash := HashOTP(req.OTP)
		log.Printf("Checking signup OTP: provided %s (hash %s), stored %s", req.OTP, storedHash, pending.OTPHash)
		if pending.OTPHash == storedHash {
			userID, _ := UpsertUser(pending.Name, pending.Email, pending.Password)
			DeletePendingSignup(req.Email)
			log.Printf("Signup verified for %s", req.Email)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Signup verified!",
				"user": map[string]string{
					"id": userID,
				},
			})
			return
		}
	}

	// 2. Check login flow
	storedOTP, err := GetValidOTP(req.Email)
	if err == nil {
		log.Printf("Checking login OTP: provided %s, stored %s", req.OTP, storedOTP)
		if storedOTP == req.OTP {
			id, _, _, _ := GetUserByEmail(req.Email)
			DeleteOTP(req.Email)
			log.Printf("Login verified for %s", req.Email)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Login verified!",
				"user": map[string]string{
					"id": id,
				},
			})
			return
		}
	} else {
		log.Printf("No valid login OTP found for %s: %v", req.Email, err)
	}

	log.Printf("Verification failed for %s: invalid or expired OTP", req.Email)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	json.NewEncoder(w).Encode(map[string]string{"message": "Invalid or expired OTP"})
}

func handleSummary(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Notes string `json:"notes"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	aiClient := &http.Client{Timeout: 10 * time.Second}
	aiReqBody, _ := json.Marshal(map[string]string{"notes": body.Notes})
	aiResp, err := aiClient.Post("http://localhost:5001/summarize", "application/json", bytes.NewBuffer(aiReqBody))

	var resp SummaryResponse
	if err == nil && aiResp.StatusCode == 200 {
		json.NewDecoder(aiResp.Body).Decode(&resp)
		aiResp.Body.Close()
	} else {
		resp = SummaryResponse{Summary: "Meeting summary fallback.", ActionItems: []ActionItem{}}
	}

	projectID := r.URL.Query().Get("project_id")
	var pID *string
	if projectID != "" {
		pID = &projectID
	}
	meetingID, _ := InsertMeeting(pID, body.Notes, resp.Summary)

	// Persist tasks
	for i, item := range resp.ActionItems {
		var ownerID *string
		DB.QueryRow("SELECT id FROM users WHERE name LIKE '%'||?||'%' LIMIT 1", item.Owner).Scan(&ownerID)
		taskID, _ := InsertTask(&meetingID, pID, item.Title, "", ownerID, nil, nil)
		resp.ActionItems[i].ID = taskID
		if ownerID != nil {
			resp.ActionItems[i].OwnerID = *ownerID
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func handleAsk(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AskResponse{
		Answer:   "This is an AI response based on meeting transcripts.",
		Citation: "Internal RAG context",
	})
}

func handleUploadVideo(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(50 << 20)
	file, header, _ := r.FormFile("video")
	userID := r.FormValue("user_id")
	projectName := r.FormValue("project_name")
	if projectName == "" {
		projectName = header.Filename
	}

	var uID *string
	if userID != "" {
		uID = &userID
	}

	projectID, _ := InsertProject(projectName, uID, "")
	if userID != "" {
		InsertProjectMember(projectID, userID, "admin")
	}

	CreateProcessingJob(projectID)

	log.Printf("Project created: %s. Starting background processing...", projectID)

	// Save to temp and process async
	temp, _ := os.CreateTemp("", "upload-*.mp4")
	io.Copy(temp, file)
	path := temp.Name()
	temp.Close()
	file.Close()

	go func(pID, fName, tmp string) {
		defer os.Remove(tmp)
		f, err := os.Open(tmp)
		if err != nil {
			errStr := fmt.Sprintf("failed to open temp file: %v", err)
			log.Println("❌ ERROR:", errStr)
			UpdateProcessingJob(pID, 0, 1, "error", &errStr)
			return
		}
		defer f.Close()

		log.Printf("📥 Starting processing for project %s (File: %s)", pID, fName)
		UpdateProcessingJob(pID, 10, 2, "processing", nil)

		transcript, err := TranscribeLocally(f, fName)
		if err != nil {
			errStr := fmt.Sprintf("transcription failed: %v", err)
			log.Println("❌ ERROR:", errStr)
			UpdateProcessingJob(pID, 0, 3, "error", &errStr)
			return
		}

		UpdateProcessingJob(pID, 80, 5, "processing", nil)
		InsertMeeting(&pID, transcript, "")
		UpdateProcessingJob(pID, 100, 6, "done", nil)
		log.Printf("✅ Processing complete for project %s", pID)
	}(projectID, header.Filename, path)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"id": projectID})
}

func handleGetProjects(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	var projects []ProjectRow
	if userID != "" {
		projects, _ = GetProjectsByUser(userID)
	} else {
		projects, _ = GetAllProjects()
	}
	if projects == nil {
		projects = []ProjectRow{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(projects)
}

func handleProjectDetails(w http.ResponseWriter, r *http.Request) {
	pid := r.URL.Query().Get("project_id")
	meetings, _ := GetMeetingsByProject(pid)
	tasks, _ := GetTasksByProject(pid)
	members, _ := GetProjectMembersByProject(pid)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"meetings": meetings,
		"tasks":    tasks,
		"members":  members,
	})
}

func handleUpdateTaskStatus(w http.ResponseWriter, r *http.Request) {
	var req UpdateTaskRequest
	json.NewDecoder(r.Body).Decode(&req)
	isOwner, _ := checkTaskOwnership(req.UserID, req.TaskID)
	if !isOwner {
		w.WriteHeader(http.StatusForbidden)
		return
	}
	DB.Exec("UPDATE tasks SET status = ? WHERE id = ?", req.Status, req.TaskID)
	w.WriteHeader(http.StatusOK)
}

func handleForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	otp, _ := GenerateOTP()
	expiry := time.Now().Add(10 * time.Minute)
	UpsertPasswordReset(req.Email, HashOTP(otp), expiry)
	_ = SendOTPEmail(req.Email, otp)
	log.Printf("Password reset OTP sent to %s: %s", req.Email, otp)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Reset code sent to your email."})
}

func handleResetPassword(w http.ResponseWriter, r *http.Request) {
	var req ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	stored, err := GetValidPasswordReset(req.Email)
	if err == nil && stored == HashOTP(req.OTP) {
		UpdateUserPassword(req.Email, req.NewPassword)
		DeletePasswordReset(req.Email)
		log.Printf("Password reset successful for %s", req.Email)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "Password reset successful!"})
		return
	}
	log.Printf("Password reset failed for %s: invalid or expired OTP", req.Email)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	json.NewEncoder(w).Encode(map[string]string{"message": "Invalid or expired reset code."})
}

func handleSearchUsers(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	users, _ := SearchUsers(q)
	json.NewEncoder(w).Encode(SearchUsersResponse{Users: users})
}

func handleAddMember(w http.ResponseWriter, r *http.Request) {
	var req AddMemberRequest
	json.NewDecoder(r.Body).Decode(&req)
	InsertProjectMember(req.ProjectID, req.UserID, req.Role)
	w.WriteHeader(http.StatusOK)
}

func handleInviteMember(w http.ResponseWriter, r *http.Request) {
	var req InviteMemberRequest
	json.NewDecoder(r.Body).Decode(&req)
	uid, _, _, err := GetUserByEmail(req.Email)
	if err == nil {
		InsertProjectMember(req.ProjectID, uid, "member")
	}
	w.WriteHeader(http.StatusOK)
}

func handleDeleteProject(w http.ResponseWriter, r *http.Request) {
	var req struct{ ProjectID string `json:"project_id"` }
	json.NewDecoder(r.Body).Decode(&req)
	DeleteProject(req.ProjectID)
	w.WriteHeader(http.StatusOK)
}

