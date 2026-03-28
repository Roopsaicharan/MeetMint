package main

import (
	"testing"
	"time"
)

// ─────────────────────────────────────────────────────────────────────────────
// User Queries
// ─────────────────────────────────────────────────────────────────────────────

func TestUpsertUser_NewUser(t *testing.T) {
	resetDB()
	id, err := UpsertUser("Alice", "alice@example.com", "pass123")
	if err != nil {
		t.Fatalf("UpsertUser (new): unexpected error: %v", err)
	}
	if len(id) != 36 {
		t.Errorf("UpsertUser (new): expected UUID (36 chars), got %q", id)
	}
}

func TestUpsertUser_ExistingUser_UpdatesName(t *testing.T) {
	resetDB()
	id1, _ := UpsertUser("Bob", "bob@example.com", "pass")
	id2, err := UpsertUser("Robert", "bob@example.com", "pass")
	if err != nil {
		t.Fatalf("UpsertUser (existing): unexpected error: %v", err)
	}
	if id1 != id2 {
		t.Errorf("UpsertUser (existing): expected same UUID, got %q vs %q", id1, id2)
	}
	// Verify name was updated
	_, name, _, _ := GetUserByEmail("bob@example.com")
	if name != "Robert" {
		t.Errorf("UpsertUser (existing): expected name 'Robert', got %q", name)
	}
}

func TestGetUserByEmail_Found(t *testing.T) {
	resetDB()
	UpsertUser("Carol", "carol@example.com", "secret")
	id, name, pw, err := GetUserByEmail("carol@example.com")
	if err != nil {
		t.Fatalf("GetUserByEmail: unexpected error: %v", err)
	}
	if len(id) != 36 {
		t.Errorf("GetUserByEmail: expected UUID, got %q", id)
	}
	if name != "Carol" {
		t.Errorf("GetUserByEmail: expected name 'Carol', got %q", name)
	}
	if pw != "secret" {
		t.Errorf("GetUserByEmail: expected password 'secret', got %q", pw)
	}
}

func TestGetUserByEmail_NotFound(t *testing.T) {
	resetDB()
	_, _, _, err := GetUserByEmail("nobody@example.com")
	if err == nil {
		t.Error("GetUserByEmail: expected error for missing user, got nil")
	}
}

func TestSearchUsers_ByName(t *testing.T) {
	resetDB()
	UpsertUser("Dave Smith", "dave@example.com", "pw")
	UpsertUser("Eve Jones", "eve@example.com", "pw")

	results, err := SearchUsers("dave")
	if err != nil {
		t.Fatalf("SearchUsers: unexpected error: %v", err)
	}
	if len(results) != 1 {
		t.Errorf("SearchUsers: expected 1 result, got %d", len(results))
	}
	if results[0].Name != "Dave Smith" {
		t.Errorf("SearchUsers: expected 'Dave Smith', got %q", results[0].Name)
	}
}

func TestSearchUsers_ByEmail(t *testing.T) {
	resetDB()
	UpsertUser("Frank", "frank@company.com", "pw")

	results, err := SearchUsers("company")
	if err != nil {
		t.Fatalf("SearchUsers by email: unexpected error: %v", err)
	}
	if len(results) == 0 {
		t.Error("SearchUsers by email: expected at least 1 result")
	}
}

func TestSearchUsers_NoMatch(t *testing.T) {
	resetDB()
	results, err := SearchUsers("zzznomatch")
	if err != nil {
		t.Fatalf("SearchUsers (no match): unexpected error: %v", err)
	}
	if len(results) != 0 {
		t.Errorf("SearchUsers (no match): expected 0 results, got %d", len(results))
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Project Queries
// ─────────────────────────────────────────────────────────────────────────────

func TestInsertProject(t *testing.T) {
	resetDB()
	id, err := InsertProject("Alpha Project", nil, "2026-12-31")
	if err != nil {
		t.Fatalf("InsertProject: unexpected error: %v", err)
	}
	if len(id) != 36 {
		t.Errorf("InsertProject: expected UUID (36 chars), got %q", id)
	}
}

func TestGetAllProjects_Empty(t *testing.T) {
	resetDB()
	projects, err := GetAllProjects()
	if err != nil {
		t.Fatalf("GetAllProjects (empty): unexpected error: %v", err)
	}
	if len(projects) != 0 {
		t.Errorf("GetAllProjects (empty): expected 0 projects, got %d", len(projects))
	}
}

func TestGetAllProjects_WithData(t *testing.T) {
	resetDB()
	InsertProject("Project One", nil, "2026-06-01")
	InsertProject("Project Two", nil, "2026-07-01")

	projects, err := GetAllProjects()
	if err != nil {
		t.Fatalf("GetAllProjects: unexpected error: %v", err)
	}
	if len(projects) != 2 {
		t.Errorf("GetAllProjects: expected 2 projects, got %d", len(projects))
	}
}

func TestGetProjectsByUser_FiltersByMembership(t *testing.T) {
	resetDB()
	userID, _ := UpsertUser("Gina", "gina@example.com", "pw")
	p1, _ := InsertProject("Gina Project", nil, "")
	InsertProject("Other Project", nil, "") // not joined

	InsertProjectMember(p1, userID, "admin")

	projects, err := GetProjectsByUser(userID)
	if err != nil {
		t.Fatalf("GetProjectsByUser: unexpected error: %v", err)
	}
	if len(projects) != 1 {
		t.Errorf("GetProjectsByUser: expected 1 project, got %d", len(projects))
	}
	if projects[0].Name != "Gina Project" {
		t.Errorf("GetProjectsByUser: expected 'Gina Project', got %q", projects[0].Name)
	}
}

func TestDeleteProject(t *testing.T) {
	resetDB()
	id, _ := InsertProject("To Delete", nil, "")
	err := DeleteProject(id)
	if err != nil {
		t.Fatalf("DeleteProject: unexpected error: %v", err)
	}
	projects, _ := GetAllProjects()
	if len(projects) != 0 {
		t.Errorf("DeleteProject: expected 0 projects after delete, got %d", len(projects))
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Project Member Queries
// ─────────────────────────────────────────────────────────────────────────────

func TestInsertProjectMember(t *testing.T) {
	resetDB()
	userID, _ := UpsertUser("Hank", "hank@example.com", "pw")
	projectID, _ := InsertProject("Hank's Project", nil, "")

	err := InsertProjectMember(projectID, userID, "admin")
	if err != nil {
		t.Fatalf("InsertProjectMember: unexpected error: %v", err)
	}
}

func TestInsertProjectMember_Idempotent(t *testing.T) {
	resetDB()
	userID, _ := UpsertUser("Iris", "iris@example.com", "pw")
	projectID, _ := InsertProject("Iris Project", nil, "")

	_ = InsertProjectMember(projectID, userID, "member")
	err := InsertProjectMember(projectID, userID, "member") // duplicate — should not error
	if err != nil {
		t.Errorf("InsertProjectMember (duplicate): expected no error (ON CONFLICT DO NOTHING), got %v", err)
	}
}

func TestGetProjectMembersByProject(t *testing.T) {
	resetDB()
	u1, _ := UpsertUser("Jack", "jack@example.com", "pw")
	u2, _ := UpsertUser("Kai", "kai@example.com", "pw")
	pid, _ := InsertProject("Team Project", nil, "")
	InsertProjectMember(pid, u1, "admin")
	InsertProjectMember(pid, u2, "member")

	members, err := GetProjectMembersByProject(pid)
	if err != nil {
		t.Fatalf("GetProjectMembersByProject: unexpected error: %v", err)
	}
	if len(members) != 2 {
		t.Errorf("GetProjectMembersByProject: expected 2 members, got %d", len(members))
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Meeting Queries
// ─────────────────────────────────────────────────────────────────────────────

func TestInsertMeeting(t *testing.T) {
	resetDB()
	pid, _ := InsertProject("Meeting Project", nil, "")
	mid, err := InsertMeeting(&pid, "Transcript goes here", "Summary goes here")
	if err != nil {
		t.Fatalf("InsertMeeting: unexpected error: %v", err)
	}
	if len(mid) != 36 {
		t.Errorf("InsertMeeting: expected UUID, got %q", mid)
	}
}

func TestInsertMeeting_NilProject(t *testing.T) {
	resetDB()
	mid, err := InsertMeeting(nil, "orphan transcript", "no summary")
	if err != nil {
		t.Fatalf("InsertMeeting (nil project): unexpected error: %v", err)
	}
	if len(mid) != 36 {
		t.Errorf("InsertMeeting (nil project): expected UUID, got %q", mid)
	}
}

func TestGetMeetingsByProject(t *testing.T) {
	resetDB()
	pid, _ := InsertProject("Proj", nil, "")
	InsertMeeting(&pid, "t1", "s1")
	InsertMeeting(&pid, "t2", "s2")

	meetings, err := GetMeetingsByProject(pid)
	if err != nil {
		t.Fatalf("GetMeetingsByProject: unexpected error: %v", err)
	}
	if len(meetings) != 2 {
		t.Errorf("GetMeetingsByProject: expected 2, got %d", len(meetings))
	}
}

func TestGetMeetingsByProject_Empty(t *testing.T) {
	resetDB()
	pid, _ := InsertProject("Empty Proj", nil, "")
	meetings, err := GetMeetingsByProject(pid)
	if err != nil {
		t.Fatalf("GetMeetingsByProject (empty): unexpected error: %v", err)
	}
	if len(meetings) != 0 {
		t.Errorf("GetMeetingsByProject (empty): expected 0, got %d", len(meetings))
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Task Queries
// ─────────────────────────────────────────────────────────────────────────────

func TestInsertTask(t *testing.T) {
	resetDB()
	userID, _ := UpsertUser("Leo", "leo@example.com", "pw")
	pid, _ := InsertProject("Task Project", nil, "")
	mid, _ := InsertMeeting(&pid, "transcript", "summary")
	due := time.Now().Add(48 * time.Hour)

	taskID, err := InsertTask(&mid, &pid, "Build API", "description", &userID, &due, &userID)
	if err != nil {
		t.Fatalf("InsertTask: unexpected error: %v", err)
	}
	if len(taskID) != 36 {
		t.Errorf("InsertTask: expected UUID, got %q", taskID)
	}
}

func TestInsertTask_NilOwner(t *testing.T) {
	resetDB()
	pid, _ := InsertProject("Unassigned Project", nil, "")
	mid, _ := InsertMeeting(&pid, "t", "s")
	due := time.Now().Add(24 * time.Hour)

	taskID, err := InsertTask(&mid, &pid, "Unowned Task", "", nil, &due, nil)
	if err != nil {
		t.Fatalf("InsertTask (nil owner): unexpected error: %v", err)
	}
	if len(taskID) != 36 {
		t.Errorf("InsertTask (nil owner): expected UUID, got %q", taskID)
	}
}

func TestGetTasksByProject(t *testing.T) {
	resetDB()
	userID, _ := UpsertUser("Mia", "mia@example.com", "pw")
	pid, _ := InsertProject("Project X", nil, "")
	mid, _ := InsertMeeting(&pid, "t", "s")
	due := time.Now().Add(24 * time.Hour)
	InsertTask(&mid, &pid, "Task A", "", &userID, &due, nil)
	InsertTask(&mid, &pid, "Task B", "", &userID, &due, nil)

	tasks, err := GetTasksByProject(pid)
	if err != nil {
		t.Fatalf("GetTasksByProject: unexpected error: %v", err)
	}
	if len(tasks) != 2 {
		t.Errorf("GetTasksByProject: expected 2, got %d", len(tasks))
	}
}

func TestGetTasksByUser(t *testing.T) {
	resetDB()
	u1, _ := UpsertUser("Ned", "ned@example.com", "pw")
	u2, _ := UpsertUser("Ora", "ora@example.com", "pw")
	pid, _ := InsertProject("P", nil, "")
	mid, _ := InsertMeeting(&pid, "t", "s")
	due := time.Now().Add(24 * time.Hour)
	InsertTask(&mid, &pid, "Ned's Task", "", &u1, &due, nil)
	InsertTask(&mid, &pid, "Ora's Task", "", &u2, &due, nil)

	tasks, err := GetTasksByUser(u1)
	if err != nil {
		t.Fatalf("GetTasksByUser: unexpected error: %v", err)
	}
	if len(tasks) != 1 {
		t.Errorf("GetTasksByUser: expected 1 task for Ned, got %d", len(tasks))
	}
}

func TestCheckTaskOwnership_IsOwner(t *testing.T) {
	resetDB()
	userID, _ := UpsertUser("Pat", "pat@example.com", "pw")
	pid, _ := InsertProject("P", nil, "")
	mid, _ := InsertMeeting(&pid, "t", "s")
	due := time.Now().Add(24 * time.Hour)
	taskID, _ := InsertTask(&mid, &pid, "Pat's Task", "", &userID, &due, nil)

	isOwner, err := checkTaskOwnership(userID, taskID)
	if err != nil {
		t.Fatalf("checkTaskOwnership: unexpected error: %v", err)
	}
	if !isOwner {
		t.Error("checkTaskOwnership: expected true (owner), got false")
	}
}

func TestCheckTaskOwnership_NotOwner(t *testing.T) {
	resetDB()
	u1, _ := UpsertUser("Quinn", "quinn@example.com", "pw")
	u2, _ := UpsertUser("Rosa", "rosa@example.com", "pw")
	pid, _ := InsertProject("P", nil, "")
	mid, _ := InsertMeeting(&pid, "t", "s")
	due := time.Now().Add(24 * time.Hour)
	taskID, _ := InsertTask(&mid, &pid, "Quinn's Task", "", &u1, &due, nil)

	isOwner, err := checkTaskOwnership(u2, taskID)
	if err != nil {
		t.Fatalf("checkTaskOwnership (not owner): unexpected error: %v", err)
	}
	if isOwner {
		t.Error("checkTaskOwnership (not owner): expected false, got true")
	}
}

func TestCheckTaskOwnership_TaskNotFound(t *testing.T) {
	resetDB()
	_, err := checkTaskOwnership("any-user", "nonexistent-task-id")
	if err == nil {
		t.Error("checkTaskOwnership (missing task): expected error, got nil")
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// RAG Chunk Queries
// ─────────────────────────────────────────────────────────────────────────────

func TestInsertRAGChunk(t *testing.T) {
	resetDB()
	pid, _ := InsertProject("RAG Project", nil, "")
	mid, _ := InsertMeeting(&pid, "transcript", "summary")

	chunkID, err := InsertRAGChunk(mid, "chunk text here", "embedding-vector")
	if err != nil {
		t.Fatalf("InsertRAGChunk: unexpected error: %v", err)
	}
	if len(chunkID) != 36 {
		t.Errorf("InsertRAGChunk: expected UUID, got %q", chunkID)
	}
}

func TestGetRAGChunksByMeeting(t *testing.T) {
	resetDB()
	pid, _ := InsertProject("RAG Project", nil, "")
	mid, _ := InsertMeeting(&pid, "t", "s")
	InsertRAGChunk(mid, "chunk 1", "emb1")
	InsertRAGChunk(mid, "chunk 2", "emb2")

	chunks, err := GetRAGChunksByMeeting(mid)
	if err != nil {
		t.Fatalf("GetRAGChunksByMeeting: unexpected error: %v", err)
	}
	if len(chunks) != 2 {
		t.Errorf("GetRAGChunksByMeeting: expected 2 chunks, got %d", len(chunks))
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// OTP Queries
// ─────────────────────────────────────────────────────────────────────────────

func TestUpsertOTP_AndGetValidOTP(t *testing.T) {
	resetDB()
	expiry := time.Now().Add(5 * time.Minute)
	err := UpsertOTP("sam@example.com", "123456", expiry)
	if err != nil {
		t.Fatalf("UpsertOTP: unexpected error: %v", err)
	}
	otp, err := GetValidOTP("sam@example.com")
	if err != nil {
		t.Fatalf("GetValidOTP: unexpected error: %v", err)
	}
	if otp != "123456" {
		t.Errorf("GetValidOTP: expected '123456', got %q", otp)
	}
}

func TestGetValidOTP_Expired(t *testing.T) {
	resetDB()
	expiry := time.Now().Add(-1 * time.Minute) // already expired
	UpsertOTP("expired@example.com", "999999", expiry)
	_, err := GetValidOTP("expired@example.com")
	if err == nil {
		t.Error("GetValidOTP (expired): expected error for expired OTP, got nil")
	}
}

func TestDeleteOTP(t *testing.T) {
	resetDB()
	UpsertOTP("tina@example.com", "654321", time.Now().Add(5*time.Minute))
	err := DeleteOTP("tina@example.com")
	if err != nil {
		t.Fatalf("DeleteOTP: unexpected error: %v", err)
	}
	_, err = GetValidOTP("tina@example.com")
	if err == nil {
		t.Error("DeleteOTP: expected OTP to be gone after delete")
	}
}

func TestUpsertOTP_UpdatesOnConflict(t *testing.T) {
	resetDB()
	expiry := time.Now().Add(5 * time.Minute)
	UpsertOTP("update@example.com", "111111", expiry)
	UpsertOTP("update@example.com", "222222", expiry)

	otp, _ := GetValidOTP("update@example.com")
	if otp != "222222" {
		t.Errorf("UpsertOTP (upsert): expected '222222', got %q", otp)
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Pending Signup Queries
// ─────────────────────────────────────────────────────────────────────────────

func TestUpsertPendingSignup_AndGetValid(t *testing.T) {
	resetDB()
	expiry := time.Now().Add(5 * time.Minute)
	err := UpsertPendingSignup("Uma", "uma@example.com", "pass", "hashedotp", expiry)
	if err != nil {
		t.Fatalf("UpsertPendingSignup: unexpected error: %v", err)
	}
	row, err := GetValidPendingSignup("uma@example.com")
	if err != nil {
		t.Fatalf("GetValidPendingSignup: unexpected error: %v", err)
	}
	if row.Name != "Uma" {
		t.Errorf("GetValidPendingSignup: expected name 'Uma', got %q", row.Name)
	}
	if row.OTPHash != "hashedotp" {
		t.Errorf("GetValidPendingSignup: expected OTPHash 'hashedotp', got %q", row.OTPHash)
	}
}

func TestGetValidPendingSignup_Expired(t *testing.T) {
	resetDB()
	expiry := time.Now().Add(-1 * time.Minute)
	UpsertPendingSignup("Vic", "vic@example.com", "pw", "hash", expiry)

	_, err := GetValidPendingSignup("vic@example.com")
	if err == nil {
		t.Error("GetValidPendingSignup (expired): expected error, got nil")
	}
}

func TestDeletePendingSignup(t *testing.T) {
	resetDB()
	expiry := time.Now().Add(5 * time.Minute)
	UpsertPendingSignup("Wren", "wren@example.com", "pw", "hash", expiry)
	err := DeletePendingSignup("wren@example.com")
	if err != nil {
		t.Fatalf("DeletePendingSignup: unexpected error: %v", err)
	}
	_, err = GetValidPendingSignup("wren@example.com")
	if err == nil {
		t.Error("DeletePendingSignup: expected row to be gone")
	}
}

func TestUpsertPendingSignup_UpdatesOnConflict(t *testing.T) {
	resetDB()
	expiry := time.Now().Add(5 * time.Minute)
	UpsertPendingSignup("Xena", "xena@example.com", "pw", "hash1", expiry)
	UpsertPendingSignup("Xena Updated", "xena@example.com", "pw2", "hash2", expiry)

	row, _ := GetValidPendingSignup("xena@example.com")
	if row.OTPHash != "hash2" {
		t.Errorf("UpsertPendingSignup upsert: expected 'hash2', got %q", row.OTPHash)
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Password Reset Queries
// ─────────────────────────────────────────────────────────────────────────────

func TestUpsertPasswordReset_AndGetValid(t *testing.T) {
	resetDB()
	UpsertUser("Yara", "yara@example.com", "pw")
	expiry := time.Now().Add(5 * time.Minute)
	err := UpsertPasswordReset("yara@example.com", "resethashabc", expiry)
	if err != nil {
		t.Fatalf("UpsertPasswordReset: unexpected error: %v", err)
	}
	hash, err := GetValidPasswordReset("yara@example.com")
	if err != nil {
		t.Fatalf("GetValidPasswordReset: unexpected error: %v", err)
	}
	if hash != "resethashabc" {
		t.Errorf("GetValidPasswordReset: expected 'resethashabc', got %q", hash)
	}
}

func TestGetValidPasswordReset_Expired(t *testing.T) {
	resetDB()
	expiry := time.Now().Add(-1 * time.Minute)
	UpsertPasswordReset("zack@example.com", "hash", expiry)
	_, err := GetValidPasswordReset("zack@example.com")
	if err == nil {
		t.Error("GetValidPasswordReset (expired): expected error, got nil")
	}
}

func TestDeletePasswordReset(t *testing.T) {
	resetDB()
	expiry := time.Now().Add(5 * time.Minute)
	UpsertPasswordReset("anya@example.com", "h", expiry)
	_ = DeletePasswordReset("anya@example.com")
	_, err := GetValidPasswordReset("anya@example.com")
	if err == nil {
		t.Error("DeletePasswordReset: expected row to be removed")
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// UpdateUserPassword
// ─────────────────────────────────────────────────────────────────────────────

func TestUpdateUserPassword(t *testing.T) {
	resetDB()
	UpsertUser("Ben", "ben@example.com", "oldpassword")
	err := UpdateUserPassword("ben@example.com", "newpassword")
	if err != nil {
		t.Fatalf("UpdateUserPassword: unexpected error: %v", err)
	}
	_, _, pw, _ := GetUserByEmail("ben@example.com")
	if pw != "newpassword" {
		t.Errorf("UpdateUserPassword: expected 'newpassword', got %q", pw)
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Processing Job Queries
// ─────────────────────────────────────────────────────────────────────────────

func TestCreateProcessingJob(t *testing.T) {
	resetDB()
	pid, _ := InsertProject("Job Project", nil, "")
	jobID, err := CreateProcessingJob(pid)
	if err != nil {
		t.Fatalf("CreateProcessingJob: unexpected error: %v", err)
	}
	if len(jobID) != 36 {
		t.Errorf("CreateProcessingJob: expected UUID, got %q", jobID)
	}
}

func TestUpdateProcessingJob(t *testing.T) {
	resetDB()
	pid, _ := InsertProject("Update Job Project", nil, "")
	CreateProcessingJob(pid)

	err := UpdateProcessingJob(pid, 75, 4, "processing", nil)
	if err != nil {
		t.Fatalf("UpdateProcessingJob: unexpected error: %v", err)
	}
}

func TestGetProcessingJob(t *testing.T) {
	resetDB()
	pid, _ := InsertProject("Get Job Project", nil, "")
	CreateProcessingJob(pid)
	UpdateProcessingJob(pid, 50, 3, "processing", nil)

	job, err := GetProcessingJob(pid)
	if err != nil {
		t.Fatalf("GetProcessingJob: unexpected error: %v", err)
	}
	if job.Progress != 50 {
		t.Errorf("GetProcessingJob: expected progress 50, got %d", job.Progress)
	}
	if job.CurrentStep != 3 {
		t.Errorf("GetProcessingJob: expected step 3, got %d", job.CurrentStep)
	}
	if job.Status != "processing" {
		t.Errorf("GetProcessingJob: expected status 'processing', got %q", job.Status)
	}
}

func TestGetProcessingJob_NotFound(t *testing.T) {
	resetDB()
	_, err := GetProcessingJob("nonexistent-project-id")
	if err == nil {
		t.Error("GetProcessingJob (not found): expected error, got nil")
	}
}

func TestProcessingJob_FullLifecycle(t *testing.T) {
	resetDB()
	pid, _ := InsertProject("Lifecycle Project", nil, "")
	CreateProcessingJob(pid)

	// Simulate pipeline stages
	stages := []struct {
		progress int
		step     int
		status   string
	}{
		{15, 2, "processing"},
		{30, 3, "processing"},
		{70, 4, "processing"},
		{90, 5, "processing"},
		{100, 6, "done"},
	}
	for _, s := range stages {
		if err := UpdateProcessingJob(pid, s.progress, s.step, s.status, nil); err != nil {
			t.Errorf("UpdateProcessingJob stage %d: %v", s.step, err)
		}
	}

	job, _ := GetProcessingJob(pid)
	if job.Progress != 100 {
		t.Errorf("ProcessingJob lifecycle: expected 100, got %d", job.Progress)
	}
	if job.Status != "done" {
		t.Errorf("ProcessingJob lifecycle: expected 'done', got %q", job.Status)
	}
}
