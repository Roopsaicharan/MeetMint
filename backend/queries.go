package main

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// ProjectRow represents a row from the projects table.
type ProjectRow struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	CreatedBy   *string   `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	Status      string    `json:"status"`
	DueDate     string    `json:"dueDate"`
	Progress    int       `json:"progress"`
	MembersList []UserRow `json:"membersList"`
	Summary     *Summary  `json:"summary"` // Matches frontend's p.summary
}

type Summary struct {
	Summary     string       `json:"summary"`
	ActionItems []TaskRow    `json:"action_items"`
	Transcript  string       `json:"transcript"`
}

// UserRow represents a row from the users table.
type UserRow struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

// ---- User Queries ----

// UpsertUser inserts a new user or returns the existing one (by email).
// Returns the user's UUID.
func UpsertUser(name, email, password string) (string, error) {
	var userID string
	// Check if user exists
	row := DB.QueryRow("SELECT id FROM users WHERE email = ?", email)
	err := row.Scan(&userID)
	if err == nil {
		// Update existing user name
		_, err = DB.Exec("UPDATE users SET name = ? WHERE email = ?", name, email)
		return userID, err
	}

	// Insert new user
	newID := uuid.New().String()
	_, err = DB.Exec(`INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)`,
		newID, name, email, password,
	)
	if err != nil {
		return "", fmt.Errorf("UpsertUser: %w", err)
	}
	return newID, nil
}

// GetUserByEmail retrieves a user by their email address.
func GetUserByEmail(email string) (string, string, string, error) {
	var userID, userName, password string
	err := DB.QueryRow(`SELECT id, COALESCE(name, ''), COALESCE(password, '') FROM users WHERE email = ?`,
		email,
	).Scan(&userID, &userName, &password)
	if err != nil {
		return "", "", "", fmt.Errorf("GetUserByEmail: %w", err)
	}
	return userID, userName, password, nil
}

// SearchUsers searches for users by name or email.
func SearchUsers(query string) ([]UserRow, error) {
	rows, err := DB.Query(`SELECT id, name, email, created_at FROM users 
		 WHERE name LIKE '%' || ? || '%' OR email LIKE '%' || ? || '%'
		 LIMIT 10`,
		query, query,
	)
	if err != nil {
		return nil, fmt.Errorf("SearchUsers: %w", err)
	}
	defer rows.Close()

	users := []UserRow{}
	for rows.Next() {
		var u UserRow
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.CreatedAt); err != nil {
			return nil, fmt.Errorf("SearchUsers scan: %w", err)
		}
		users = append(users, u)
	}
	return users, nil
}

// ---- Project Queries ----

// InsertProject inserts a new project and returns its ID.
func InsertProject(name string, createdBy *string, dueDate string) (string, error) {
	projectID := uuid.New().String()
	_, err := DB.Exec(`INSERT INTO projects (id, name, created_by, due_date) VALUES (?, ?, ?, ?)`,
		projectID, name, createdBy, dueDate,
	)
	if err != nil {
		return "", fmt.Errorf("InsertProject: %w", err)
	}
	return projectID, nil
}

// GetAllProjects retrieves all projects with their members.
func GetAllProjects() ([]ProjectRow, error) {
	rows, err := DB.Query(`SELECT id, name, created_by, created_at, COALESCE(due_date, '') FROM projects ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("GetAllProjects: %w", err)
	}
	defer rows.Close()

	projects := []ProjectRow{}
	for rows.Next() {
		var p ProjectRow
		if err := rows.Scan(&p.ID, &p.Name, &p.CreatedBy, &p.CreatedAt, &p.DueDate); err != nil {
			return nil, fmt.Errorf("GetAllProjects scan: %w", err)
		}

		p.Status = "Active"
		
		// Fetch members
		members, _ := GetProjectMembersByProject(p.ID)
		p.MembersList = members

		// Fetch latest meeting for summary/tasks
		meetings, _ := GetMeetingsByProject(p.ID)
		if len(meetings) > 0 {
			latest := meetings[0]
			tasks, _ := GetTasksByProject(p.ID)
			p.Summary = &Summary{
				Summary:     latest.SummaryText,
				Transcript:  latest.TranscriptText,
				ActionItems: tasks,
			}
			
			// Calculate progress
			if len(tasks) > 0 {
				done := 0
				for _, t := range tasks {
					if t.Status == "done" {
						done++
					}
				}
				p.Progress = (done * 100) / len(tasks)
			}
		}

		projects = append(projects, p)
	}
	return projects, nil
}

// GetProjectsByUser retrieves only projects where the user is a member.
func GetProjectsByUser(userID string) ([]ProjectRow, error) {
	rows, err := DB.Query(`SELECT p.id, p.name, p.created_by, p.created_at, COALESCE(p.due_date, '')
		 FROM projects p
		 JOIN project_members pm ON p.id = pm.project_id
		 WHERE pm.user_id = ?
		 ORDER BY p.created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("GetProjectsByUser: %w", err)
	}
	defer rows.Close()

	projects := []ProjectRow{}
	for rows.Next() {
		var p ProjectRow
		if err := rows.Scan(&p.ID, &p.Name, &p.CreatedBy, &p.CreatedAt, &p.DueDate); err != nil {
			return nil, fmt.Errorf("GetProjectsByUser scan: %w", err)
		}

		p.Status = "Active"
		
		// Fetch members
		members, _ := GetProjectMembersByProject(p.ID)
		p.MembersList = members

		// Fetch latest meeting for summary/tasks
		meetings, _ := GetMeetingsByProject(p.ID)
		if len(meetings) > 0 {
			latest := meetings[0]
			tasks, _ := GetTasksByProject(p.ID)
			p.Summary = &Summary{
				Summary:     latest.SummaryText,
				Transcript:  latest.TranscriptText,
				ActionItems: tasks,
			}
			
			// Calculate progress
			if len(tasks) > 0 {
				done := 0
				for _, t := range tasks {
					if t.Status == "done" {
						done++
					}
				}
				p.Progress = (done * 100) / len(tasks)
			}
		}

		projects = append(projects, p)
	}
	return projects, nil
}

// GetTasksByProject returns all tasks for a given project ID.
func GetTasksByProject(projectID string) ([]TaskRow, error) {
	rows, err := DB.Query(`SELECT id, meeting_id, title, description, owner_id, status, COALESCE(due_date, ''), created_at
		 FROM tasks
		 WHERE project_id = ?
		 ORDER BY created_at DESC`,
		projectID,
	)
	if err != nil {
		return nil, fmt.Errorf("GetTasksByProject: %w", err)
	}
	defer rows.Close()

	tasks := []TaskRow{}
	for rows.Next() {
		var t TaskRow
		if err := rows.Scan(&t.ID, &t.MeetingID, &t.Title, &t.Description, &t.OwnerID, &t.Status, &t.DueDate, &t.CreatedAt); err != nil {
			return nil, fmt.Errorf("GetTasksByProject scan: %w", err)
		}
		tasks = append(tasks, t)
	}
	return tasks, nil
}

// ---- Meeting Queries ----

// InsertMeeting inserts a new meeting transcript and summary.
func InsertMeeting(projectID *string, transcript, summary string) (string, error) {
	meetingID := uuid.New().String()
	_, err := DB.Exec(`INSERT INTO meetings (id, project_id, transcript_text, summary_text)
		 VALUES (?, ?, ?, ?)`,
		meetingID, projectID, transcript, summary,
	)
	if err != nil {
		return "", fmt.Errorf("InsertMeeting: %w", err)
	}
	return meetingID, nil
}

// MeetingRow represents a row from the meetings table.
type MeetingRow struct {
	ID             string
	ProjectID      *string
	TranscriptText string
	SummaryText    string
	CreatedAt      time.Time
}

// GetMeetingsByProject returns all meetings for a given project ID.
func GetMeetingsByProject(projectID string) ([]MeetingRow, error) {
	rows, err := DB.Query(`SELECT id, project_id, transcript_text, COALESCE(summary_text, ''), created_at
		 FROM meetings
		 WHERE project_id = ?
		 ORDER BY created_at DESC`,
		projectID,
	)
	if err != nil {
		return nil, fmt.Errorf("GetMeetingsByProject: %w", err)
	}
	defer rows.Close()

	meetings := []MeetingRow{}
	for rows.Next() {
		var m MeetingRow
		if err := rows.Scan(&m.ID, &m.ProjectID, &m.TranscriptText, &m.SummaryText, &m.CreatedAt); err != nil {
			return nil, fmt.Errorf("GetMeetingsByProject scan: %w", err)
		}
		meetings = append(meetings, m)
	}
	return meetings, nil
}

// ---- Task Queries ----

// InsertTask inserts a new task linked to a meeting and project.
func InsertTask(meetingID *string, projectID *string, title, description string, ownerID *string, dueDate *time.Time, createdBy *string) (string, error) {
	taskID := uuid.New().String()
	_, err := DB.Exec(`INSERT INTO tasks (id, meeting_id, project_id, title, description, owner_id, due_date, created_by)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		taskID, meetingID, projectID, title, description, ownerID, dueDate, createdBy,
	)
	if err != nil {
		return "", fmt.Errorf("InsertTask: %w", err)
	}
	return taskID, nil
}

// TaskRow represents a row from the tasks table.
type TaskRow struct {
	ID          string
	MeetingID   *string
	Title       string
	Description string
	OwnerID     *string
	Status      string
	DueDate     string
	CreatedAt   time.Time
}

// GetTasksByUser returns all tasks assigned to a given user ID.
func GetTasksByUser(userID string) ([]TaskRow, error) {
	rows, err := DB.Query(`SELECT id, meeting_id, title, description, owner_id, status, COALESCE(due_date, ''), created_at
		 FROM tasks
		 WHERE owner_id = ?
		 ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("GetTasksByUser: %w", err)
	}
	defer rows.Close()

	tasks := []TaskRow{}
	for rows.Next() {
		var t TaskRow
		if err := rows.Scan(&t.ID, &t.MeetingID, &t.Title, &t.Description, &t.OwnerID, &t.Status, &t.DueDate, &t.CreatedAt); err != nil {
			return nil, fmt.Errorf("GetTasksByUser scan: %w", err)
		}
		tasks = append(tasks, t)
	}
	return tasks, nil
}

// ---- RAG Chunk Queries ----

type RAGChunkRow struct {
	ID        string
	MeetingID string
	ChunkText string
	Embedding string
	CreatedAt time.Time
}

// InsertRAGChunk inserts a new RAG chunk for a meeting.
func InsertRAGChunk(meetingID, chunkText, embedding string) (string, error) {
	chunkID := uuid.New().String()
	_, err := DB.Exec(`INSERT INTO rag_chunks (id, meeting_id, chunk_text, embedding)
		 VALUES (?, ?, ?, ?)`,
		chunkID, meetingID, chunkText, embedding,
	)
	if err != nil {
		return "", fmt.Errorf("InsertRAGChunk: %w", err)
	}
	return chunkID, nil
}

// GetRAGChunksByMeeting returns all RAG chunks for a given meeting ID.
func GetRAGChunksByMeeting(meetingID string) ([]RAGChunkRow, error) {
	rows, err := DB.Query(`SELECT id, meeting_id, chunk_text, COALESCE(embedding, ''), created_at
		 FROM rag_chunks
		 WHERE meeting_id = ?
		 ORDER BY created_at ASC`,
		meetingID,
	)
	if err != nil {
		return nil, fmt.Errorf("GetRAGChunksByMeeting: %w", err)
	}
	defer rows.Close()

	chunks := []RAGChunkRow{}
	for rows.Next() {
		var c RAGChunkRow
		if err := rows.Scan(&c.ID, &c.MeetingID, &c.ChunkText, &c.Embedding, &c.CreatedAt); err != nil {
			return nil, fmt.Errorf("GetRAGChunksByMeeting scan: %w", err)
		}
		chunks = append(chunks, c)
	}
	return chunks, nil
}

// ---- OTP Queries ----

// UpsertOTP saves or updates the OTP for a given email with an expiry time.
func UpsertOTP(email, otp string, expiresAt time.Time) error {
	_, err := DB.Exec(`INSERT INTO otps (email, otp, expires_at)
		 VALUES (?, ?, ?)
		 ON CONFLICT (email) DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at`,
		email, otp, expiresAt.UTC(),
	)
	if err != nil {
		return fmt.Errorf("UpsertOTP: %w", err)
	}
	return nil
}

// GetValidOTP retrieves the OTP for an email if it hasn't expired.
func GetValidOTP(email string) (string, error) {
	var otp string
	now := time.Now().UTC()
	err := DB.QueryRow(`SELECT otp FROM otps WHERE email = ? AND expires_at > ?`,
		email, now,
	).Scan(&otp)
	if err != nil {
		return "", fmt.Errorf("GetValidOTP (now=%v): %w", now, err)
	}
	return otp, nil
}

// DeleteOTP removes the OTP for an email.
func DeleteOTP(email string) error {
	_, err := DB.Exec(`DELETE FROM otps WHERE email = ?`, email)
	if err != nil {
		return fmt.Errorf("DeleteOTP: %w", err)
	}
	return nil
}

// ---- Pending Signup Queries ----

type PendingSignupRow struct {
	Email    string
	Name     string
	Password string
	OTPHash  string
}

// UpsertPendingSignup stores signup data and a hashed OTP temporarily.
func UpsertPendingSignup(name, email, password, otpHash string, expiresAt time.Time) error {
	_, err := DB.Exec(`INSERT INTO pending_signups (name, email, password, otp_hash, expires_at)
		 VALUES (?, ?, ?, ?, ?)
		 ON CONFLICT (email) DO UPDATE 
		 SET name = EXCLUDED.name, password = EXCLUDED.password, otp_hash = EXCLUDED.otp_hash, expires_at = EXCLUDED.expires_at`,
		name, email, password, otpHash, expiresAt.UTC(),
	)
	if err != nil {
		return fmt.Errorf("UpsertPendingSignup: %w", err)
	}
	return nil
}

// GetValidPendingSignup retrieves pending signup data if the OTP hasn't expired.
func GetValidPendingSignup(email string) (PendingSignupRow, error) {
	var p PendingSignupRow
	now := time.Now().UTC()
	err := DB.QueryRow(`SELECT email, name, password, otp_hash FROM pending_signups WHERE email = ? AND expires_at > ?`,
		email, now,
	).Scan(&p.Email, &p.Name, &p.Password, &p.OTPHash)
	if err != nil {
		return p, fmt.Errorf("GetValidPendingSignup (now=%v): %w", now, err)
	}
	return p, nil
}

// DeletePendingSignup removes the temporary signup data.
func DeletePendingSignup(email string) error {
	_, err := DB.Exec(`DELETE FROM pending_signups WHERE email = ?`, email)
	if err != nil {
		return fmt.Errorf("DeletePendingSignup: %w", err)
	}
	return nil
}

// ---- Password Reset Queries ----

// UpsertPasswordReset stores a password reset request.
func UpsertPasswordReset(email, otpHash string, expiresAt time.Time) error {
	_, err := DB.Exec(`INSERT INTO password_resets (email, otp_hash, expires_at)
		 VALUES (?, ?, ?)
		 ON CONFLICT (email) DO UPDATE SET otp_hash = EXCLUDED.otp_hash, expires_at = EXCLUDED.expires_at`,
		email, otpHash, expiresAt.UTC(),
	)
	if err != nil {
		return fmt.Errorf("UpsertPasswordReset: %w", err)
	}
	return nil
}

// GetValidPasswordReset retrieves the OTP hash if not expired.
func GetValidPasswordReset(email string) (string, error) {
	var otpHash string
	now := time.Now().UTC()
	err := DB.QueryRow(`SELECT otp_hash FROM password_resets WHERE email = ? AND expires_at > ?`,
		email, now,
	).Scan(&otpHash)
	if err != nil {
		return "", fmt.Errorf("GetValidPasswordReset (now=%v): %w", now, err)
	}
	return otpHash, nil
}

// DeletePasswordReset removes the reset request.
func DeletePasswordReset(email string) error {
	_, err := DB.Exec(`DELETE FROM password_resets WHERE email = ?`, email)
	return err
}

// UpdateUserPassword updates the user's password.
func UpdateUserPassword(email, newPassword string) error {
	_, err := DB.Exec(`UPDATE users SET password = ? WHERE email = ?`,
		newPassword, email,
	)
	if err != nil {
		return fmt.Errorf("UpdateUserPassword: %w", err)
	}
	return nil
}

// checkTaskOwnership verifies if the user is the assigned owner of a task.
func checkTaskOwnership(userID string, taskID string) (bool, error) {
	var ownerID string
	err := DB.QueryRow("SELECT owner_id FROM tasks WHERE id = ?", taskID).Scan(&ownerID)
	if err != nil {
		return false, fmt.Errorf("checkTaskOwnership: %w", err)
	}
	return ownerID == userID, nil
}

// InsertProjectMember adds a user to a project.
func InsertProjectMember(projectID, userID, role string) error {
	id := uuid.New().String()
	_, err := DB.Exec(`INSERT INTO project_members (id, project_id, user_id, role)
		 VALUES (?, ?, ?, ?)
		 ON CONFLICT DO NOTHING`,
		id, projectID, userID, role,
	)
	if err != nil {
		return fmt.Errorf("InsertProjectMember: %w", err)
	}
	return nil
}

// GetProjectMembersByProject returns all users belonging to a project.
func GetProjectMembersByProject(projectID string) ([]UserRow, error) {
	rows, err := DB.Query(`SELECT u.id, u.name, u.email, u.created_at 
		 FROM users u
		 JOIN project_members pm ON u.id = pm.user_id
		 WHERE pm.project_id = ?`,
		projectID,
	)
	if err != nil {
		return nil, fmt.Errorf("GetProjectMembersByProject: %w", err)
	}
	defer rows.Close()

	users := []UserRow{}
	for rows.Next() {
		var u UserRow
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.CreatedAt); err != nil {
			return nil, fmt.Errorf("GetProjectMembersByProject scan: %w", err)
		}
		users = append(users, u)
	}
	return users, nil
}

// DeleteProject deletes a project.
func DeleteProject(projectID string) error {
	_, err := DB.Exec(`DELETE FROM projects WHERE id = ?`, projectID)
	if err != nil {
		return fmt.Errorf("DeleteProject: %w", err)
	}
	return nil
}

// ---- Processing Job Queries ----

type ProcessingJob struct {
	ID           string     `json:"id"`
	ProjectID    string     `json:"project_id"`
	Status       string     `json:"status"`
	Progress     int        `json:"progress"`
	CurrentStep  int        `json:"current_step"`
	ETASeconds   int        `json:"eta_seconds"`
	ErrorMessage *string    `json:"error_message"`
	StartedAt    time.Time  `json:"started_at"`
	CompletedAt  *time.Time `json:"completed_at"`
}

func CreateProcessingJob(projectID string) (string, error) {
	jobID := uuid.New().String()
	_, err := DB.Exec(
		"INSERT INTO processing_jobs (id, project_id, status, progress, current_step) VALUES (?, ?, 'processing', 5, 1)",
		jobID, projectID,
	)
	return jobID, err
}

func UpdateProcessingJob(projectID string, progress, currentStep int, status string, errMsg *string) error {
	_, err := DB.Exec(
		"UPDATE processing_jobs SET progress = ?, current_step = ?, status = ?, error_message = ? WHERE project_id = ?",
		progress, currentStep, status, errMsg, projectID,
	)
	return err
}

func GetProcessingJob(projectID string) (ProcessingJob, error) {
	var j ProcessingJob
	err := DB.QueryRow(
		"SELECT id, project_id, status, progress, current_step, COALESCE(eta_seconds, 0), error_message, started_at, completed_at FROM processing_jobs WHERE project_id = ?",
		projectID,
	).Scan(&j.ID, &j.ProjectID, &j.Status, &j.Progress, &j.CurrentStep, &j.ETASeconds, &j.ErrorMessage, &j.StartedAt, &j.CompletedAt)
	return j, err
}
