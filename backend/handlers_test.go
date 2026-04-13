package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"
)

// ─────────────────────────────────────────────────────────────────────────────
// Handler / API Endpoint Tests (Sprint 3)
// ─────────────────────────────────────────────────────────────────────────────

func TestHandler_Home_ReturnsRunning(t *testing.T) {
	resetDB()
	router := SetupRouter()
	req := httptest.NewRequest("GET", "/", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Home: expected 200, got %d", rr.Code)
	}
	var resp map[string]string
	json.NewDecoder(rr.Body).Decode(&resp)
	if resp["status"] != "running" {
		t.Errorf("Home: expected status 'running', got %q", resp["status"])
	}
	if resp["message"] != "MeetMint Backend is online" {
		t.Errorf("Home: unexpected message: %q", resp["message"])
	}
}

func TestHandler_Home_404ForUnknownPath(t *testing.T) {
	resetDB()
	router := SetupRouter()
	req := httptest.NewRequest("GET", "/nonexistent-path", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Errorf("Home 404: expected 404, got %d", rr.Code)
	}
}

func TestHandler_Signup_MethodNotAllowed(t *testing.T) {
	resetDB()
	router := SetupRouter()
	req := httptest.NewRequest("GET", "/api/signup", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Errorf("Signup GET: expected 405, got %d", rr.Code)
	}
}

func TestHandler_Signup_Success(t *testing.T) {
	resetDB()
	router := SetupRouter()
	os.Setenv("SMTP_HOST", "mock")

	body, _ := json.Marshal(SignupRequest{
		Name: "Sprint3 User", Email: "sprint3@test.com", Password: "pass123",
	})
	req := httptest.NewRequest("POST", "/api/signup", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Signup: expected 200, got %d — %s", rr.Code, rr.Body.String())
	}
	// Verify pending signup was stored
	pending, err := GetValidPendingSignup("sprint3@test.com")
	if err != nil {
		t.Fatalf("Signup: pending not stored: %v", err)
	}
	if pending.Name != "Sprint3 User" {
		t.Errorf("Signup: expected name 'Sprint3 User', got %q", pending.Name)
	}
}

func TestHandler_Login_InvalidCredentials(t *testing.T) {
	resetDB()
	router := SetupRouter()
	UpsertUser("Test", "test@test.com", "correct_password")

	body, _ := json.Marshal(LoginRequest{Email: "test@test.com", Password: "wrong_password"})
	req := httptest.NewRequest("POST", "/api/login", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("Login bad pw: expected 401, got %d", rr.Code)
	}
}

func TestHandler_Login_Success(t *testing.T) {
	resetDB()
	router := SetupRouter()
	os.Setenv("SMTP_HOST", "mock")
	UpsertUser("Valid User", "valid@test.com", "mypassword")

	body, _ := json.Marshal(LoginRequest{Email: "valid@test.com", Password: "mypassword"})
	req := httptest.NewRequest("POST", "/api/login", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Login success: expected 200, got %d — %s", rr.Code, rr.Body.String())
	}
}

func TestHandler_Login_UserNotFound(t *testing.T) {
	resetDB()
	router := SetupRouter()
	body, _ := json.Marshal(LoginRequest{Email: "nobody@test.com", Password: "pw"})
	req := httptest.NewRequest("POST", "/api/login", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("Login not found: expected 401, got %d", rr.Code)
	}
}

func TestHandler_VerifyOTP_InvalidBody(t *testing.T) {
	resetDB()
	router := SetupRouter()
	req := httptest.NewRequest("POST", "/api/verify-otp", bytes.NewBufferString("not json"))
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("VerifyOTP bad body: expected 400, got %d", rr.Code)
	}
}

func TestHandler_VerifyOTP_ExpiredOTP(t *testing.T) {
	resetDB()
	router := SetupRouter()
	// Insert an expired OTP
	UpsertOTP("expired@test.com", "123456", time.Now().Add(-10*time.Minute))

	body, _ := json.Marshal(VerifyOTPRequest{Email: "expired@test.com", OTP: "123456"})
	req := httptest.NewRequest("POST", "/api/verify-otp", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("VerifyOTP expired: expected 401, got %d", rr.Code)
	}
}

func TestHandler_GetProjects_Empty(t *testing.T) {
	resetDB()
	router := SetupRouter()
	req := httptest.NewRequest("GET", "/api/projects", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("GetProjects: expected 200, got %d", rr.Code)
	}
	var projects []ProjectRow
	json.NewDecoder(rr.Body).Decode(&projects)
	if len(projects) != 0 {
		t.Errorf("GetProjects: expected 0, got %d", len(projects))
	}
}

func TestHandler_GetProjects_ByUser(t *testing.T) {
	resetDB()
	router := SetupRouter()
	uid, _ := UpsertUser("UserX", "userx@test.com", "pw")
	pid, _ := InsertProject("UserX Proj", nil, "")
	InsertProjectMember(pid, uid, "admin")

	req := httptest.NewRequest("GET", "/api/projects?user_id="+uid, nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("GetProjects by user: expected 200, got %d", rr.Code)
	}
	var projects []ProjectRow
	json.NewDecoder(rr.Body).Decode(&projects)
	if len(projects) != 1 {
		t.Errorf("GetProjects by user: expected 1, got %d", len(projects))
	}
}

func TestHandler_ProjectDetails(t *testing.T) {
	resetDB()
	router := SetupRouter()
	pid, _ := InsertProject("Detail Proj", nil, "")
	InsertMeeting(&pid, "transcript text", "summary text")

	req := httptest.NewRequest("GET", "/api/project-details?project_id="+pid, nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("ProjectDetails: expected 200, got %d", rr.Code)
	}
	var resp map[string]interface{}
	json.NewDecoder(rr.Body).Decode(&resp)
	meetings := resp["meetings"].([]interface{})
	if len(meetings) != 1 {
		t.Errorf("ProjectDetails: expected 1 meeting, got %d", len(meetings))
	}
}

func TestHandler_DeleteProject(t *testing.T) {
	resetDB()
	router := SetupRouter()
	pid, _ := InsertProject("To Delete", nil, "")

	body, _ := json.Marshal(map[string]string{"project_id": pid})
	req := httptest.NewRequest("POST", "/api/projects/delete", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("DeleteProject: expected 200, got %d", rr.Code)
	}
	projects, _ := GetAllProjects()
	if len(projects) != 0 {
		t.Errorf("DeleteProject: project not removed, %d remaining", len(projects))
	}
}

func TestHandler_CreateTask(t *testing.T) {
	resetDB()
	router := SetupRouter()
	pid, _ := InsertProject("Task Proj", nil, "")

	body, _ := json.Marshal(map[string]interface{}{
		"project_id":  pid,
		"title":       "New Sprint 3 Task",
		"description": "Important task",
	})
	req := httptest.NewRequest("POST", "/api/tasks/create", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("CreateTask: expected 200, got %d — %s", rr.Code, rr.Body.String())
	}
	var resp map[string]string
	json.NewDecoder(rr.Body).Decode(&resp)
	if len(resp["id"]) != 36 {
		t.Errorf("CreateTask: expected UUID, got %q", resp["id"])
	}
}

func TestHandler_DeleteTask(t *testing.T) {
	resetDB()
	router := SetupRouter()
	pid, _ := InsertProject("P", nil, "")
	mid, _ := InsertMeeting(&pid, "t", "s")
	tid, _ := InsertTask(&mid, &pid, "Delete Me", "", nil, "", nil, nil)

	body, _ := json.Marshal(map[string]string{"task_id": tid})
	req := httptest.NewRequest("POST", "/api/tasks/delete", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("DeleteTask: expected 200, got %d", rr.Code)
	}
	tasks, _ := GetTasksByProject(pid)
	if len(tasks) != 0 {
		t.Errorf("DeleteTask: task not removed")
	}
}

func TestHandler_SearchUsers(t *testing.T) {
	resetDB()
	router := SetupRouter()
	UpsertUser("Alice Sprint3", "alice3@test.com", "pw")
	UpsertUser("Bob Sprint3", "bob3@test.com", "pw")

	req := httptest.NewRequest("GET", "/api/users/search?q=alice", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("SearchUsers: expected 200, got %d", rr.Code)
	}
	var resp SearchUsersResponse
	json.NewDecoder(rr.Body).Decode(&resp)
	if len(resp.Users) != 1 {
		t.Errorf("SearchUsers: expected 1 result, got %d", len(resp.Users))
	}
}

func TestHandler_AddMember(t *testing.T) {
	resetDB()
	router := SetupRouter()
	uid, _ := UpsertUser("Member", "member@test.com", "pw")
	pid, _ := InsertProject("Team Proj", nil, "")

	body, _ := json.Marshal(AddMemberRequest{ProjectID: pid, UserID: uid, Role: "member"})
	req := httptest.NewRequest("POST", "/api/projects/members/add", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("AddMember: expected 200, got %d", rr.Code)
	}
	members, _ := GetProjectMembersByProject(pid)
	if len(members) != 1 {
		t.Errorf("AddMember: expected 1 member, got %d", len(members))
	}
}

func TestHandler_RemoveMember(t *testing.T) {
	resetDB()
	router := SetupRouter()
	uid, _ := UpsertUser("Remove Me", "remove@test.com", "pw")
	pid, _ := InsertProject("Proj", nil, "")
	InsertProjectMember(pid, uid, "member")

	body, _ := json.Marshal(map[string]string{"project_id": pid, "user_id": uid})
	req := httptest.NewRequest("POST", "/api/projects/members/remove", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("RemoveMember: expected 200, got %d", rr.Code)
	}
	members, _ := GetProjectMembersByProject(pid)
	if len(members) != 0 {
		t.Errorf("RemoveMember: member not removed, %d remaining", len(members))
	}
}

func TestHandler_InviteMember(t *testing.T) {
	resetDB()
	router := SetupRouter()
	UpsertUser("Invitee", "invitee@test.com", "pw")
	pid, _ := InsertProject("Invite Proj", nil, "")

	body, _ := json.Marshal(InviteMemberRequest{ProjectID: pid, Email: "invitee@test.com"})
	req := httptest.NewRequest("POST", "/api/projects/invite", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("InviteMember: expected 200, got %d", rr.Code)
	}
	members, _ := GetProjectMembersByProject(pid)
	if len(members) != 1 {
		t.Errorf("InviteMember: expected 1 member after invite, got %d", len(members))
	}
}

func TestHandler_ForgotPassword(t *testing.T) {
	resetDB()
	router := SetupRouter()
	os.Setenv("SMTP_HOST", "mock")
	UpsertUser("Forgot", "forgot@test.com", "pw")

	body, _ := json.Marshal(ForgotPasswordRequest{Email: "forgot@test.com"})
	req := httptest.NewRequest("POST", "/api/forgot-password", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("ForgotPassword: expected 200, got %d — %s", rr.Code, rr.Body.String())
	}
}

func TestHandler_ResetPassword_InvalidOTP(t *testing.T) {
	resetDB()
	router := SetupRouter()
	UpsertUser("Reset", "reset@test.com", "oldpw")
	UpsertPasswordReset("reset@test.com", HashOTP("111111"), time.Now().Add(5*time.Minute))

	body, _ := json.Marshal(ResetPasswordRequest{Email: "reset@test.com", OTP: "999999", NewPassword: "newpw"})
	req := httptest.NewRequest("POST", "/api/reset-password", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("ResetPassword bad OTP: expected 401, got %d", rr.Code)
	}
}

func TestHandler_ResetPassword_Success(t *testing.T) {
	resetDB()
	router := SetupRouter()
	UpsertUser("ResetOK", "resetok@test.com", "oldpw")
	UpsertPasswordReset("resetok@test.com", HashOTP("555555"), time.Now().Add(5*time.Minute))

	body, _ := json.Marshal(ResetPasswordRequest{Email: "resetok@test.com", OTP: "555555", NewPassword: "newpw"})
	req := httptest.NewRequest("POST", "/api/reset-password", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("ResetPassword success: expected 200, got %d — %s", rr.Code, rr.Body.String())
	}
	// Verify password changed
	_, _, pw, _ := GetUserByEmail("resetok@test.com")
	if pw != "newpw" {
		t.Errorf("ResetPassword: password not updated, got %q", pw)
	}
}

func TestHandler_ProjectStatus_InvalidID(t *testing.T) {
	resetDB()
	router := SetupRouter()
	req := httptest.NewRequest("GET", "/api/projects/status?project_id=short", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("ProjectStatus bad ID: expected 400, got %d", rr.Code)
	}
}

func TestHandler_ProjectStatus_NotFound(t *testing.T) {
	resetDB()
	router := SetupRouter()
	fakeUUID := "12345678-1234-1234-1234-123456789012"
	req := httptest.NewRequest("GET", "/api/projects/status?project_id="+fakeUUID, nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("ProjectStatus not found: expected 200 (with error message), got %d", rr.Code)
	}
}

func TestHandler_ProjectStatus_Success(t *testing.T) {
	resetDB()
	router := SetupRouter()
	pid, _ := InsertProject("Status Proj", nil, "")
	CreateProcessingJob(pid)
	UpdateProcessingJob(pid, 50, 3, "processing", nil)

	req := httptest.NewRequest("GET", "/api/projects/status?project_id="+pid, nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("ProjectStatus: expected 200, got %d", rr.Code)
	}
	var job ProcessingJob
	json.NewDecoder(rr.Body).Decode(&job)
	if job.Progress != 50 {
		t.Errorf("ProjectStatus: expected progress 50, got %d", job.Progress)
	}
}

func TestHandler_Summary_Fallback(t *testing.T) {
	resetDB()
	router := SetupRouter()
	body, _ := json.Marshal(map[string]string{"notes": "Test meeting transcript"})
	req := httptest.NewRequest("POST", "/api/summary", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	// Should return 200 even if Gemini fails (graceful fallback)
	if rr.Code != http.StatusOK {
		t.Errorf("Summary fallback: expected 200, got %d", rr.Code)
	}
}
