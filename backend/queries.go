package main

import (
	"context"
	"fmt"
	"time"
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
}

// ---- User Queries ----

// UpsertUser inserts a new user or returns the existing one (by email).
// Returns the user's UUID.
func UpsertUser(name, email, password string) (string, error) {
	var userID string
	err := DB.QueryRow(context.Background(),
		`INSERT INTO users (name, email, password)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
		 RETURNING id`,
		name, email, password,
	).Scan(&userID)
	if err != nil {
		return "", fmt.Errorf("UpsertUser: %w", err)
	}
	return userID, nil
}

// UserRow represents a row from the users table.
type UserRow struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

// GetUserByEmail retrieves a user by their email address.
func GetUserByEmail(email string) (string, string, string, error) {
	var userID, userName, password string
	err := DB.QueryRow(context.Background(),
		`SELECT id, COALESCE(name, ''), COALESCE(password, '') FROM users WHERE email = $1`,
		email,
	).Scan(&userID, &userName, &password)
	if err != nil {
		return "", "", "", fmt.Errorf("GetUserByEmail: %w", err)
	}
	return userID, userName, password, nil
}

// SearchUsers searches for users by name or email.
func SearchUsers(query string) ([]UserRow, error) {
	rows, err := DB.Query(context.Background(),
		`SELECT id, name, email, created_at FROM users 
		 WHERE name ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%'
		 LIMIT 10`,
		query,
	)
	if err != nil {
		return nil, fmt.Errorf("SearchUsers: %w", err)
	}
	defer rows.Close()

	var users []UserRow
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
	var projectID string
	err := DB.QueryRow(context.Background(),
		`INSERT INTO projects (name, created_by, due_date)
		 VALUES ($1, $2, $3)
		 RETURNING id`,
		name, createdBy, dueDate,
	).Scan(&projectID)
	if err != nil {
		return "", fmt.Errorf("InsertProject: %w", err)
	}
	return projectID, nil
}

// GetAllProjects retrieves all projects with their members.
func GetAllProjects() ([]ProjectRow, error) {
	rows, err := DB.Query(context.Background(),
		`SELECT id, name, created_by, created_at, COALESCE(due_date, '') FROM projects ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, fmt.Errorf("GetAllProjects: %w", err)
	}
	defer rows.Close()

	var projects []ProjectRow
	for rows.Next() {
		var p ProjectRow
		if err := rows.Scan(&p.ID, &p.Name, &p.CreatedBy, &p.CreatedAt, &p.DueDate); err != nil {
			return nil, fmt.Errorf("GetAllProjects scan: %w", err)
		}

		// For now, these are calculated or defaulted
		p.Status = "Active"
		p.Progress = 0

		// Fetch members for this project
		members, err := GetProjectMembersByProject(p.ID)
		if err == nil {
			p.MembersList = members
		}

		projects = append(projects, p)
	}
	return projects, nil
}

// GetProjectsByUser retrieves only projects where the user is a member.
func GetProjectsByUser(userID string) ([]ProjectRow, error) {
	rows, err := DB.Query(context.Background(),
		`SELECT p.id, p.name, p.created_by, p.created_at, COALESCE(p.due_date, '')
		 FROM projects p
		 JOIN project_members pm ON p.id = pm.project_id
		 WHERE pm.user_id = $1
		 ORDER BY p.created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("GetProjectsByUser: %w", err)
	}
	defer rows.Close()

	var projects []ProjectRow
	for rows.Next() {
		var p ProjectRow
		if err := rows.Scan(&p.ID, &p.Name, &p.CreatedBy, &p.CreatedAt, &p.DueDate); err != nil {
			return nil, fmt.Errorf("GetProjectsByUser scan: %w", err)
		}

		p.Status = "Active"
		p.Progress = 0

		// Fetch members for this project
		members, err := GetProjectMembersByProject(p.ID)
		if err == nil {
			p.MembersList = members
		}

		projects = append(projects, p)
	}
	return projects, nil
}

// GetTasksByProject returns all tasks for a given project ID.
func GetTasksByProject(projectID string) ([]TaskRow, error) {
	rows, err := DB.Query(context.Background(),
		`SELECT id, meeting_id, title, description, owner_id, status, COALESCE(due_date::text, ''), created_at
		 FROM tasks
		 WHERE project_id = $1
		 ORDER BY created_at DESC`,
		projectID,
	)
	if err != nil {
		return nil, fmt.Errorf("GetTasksByProject: %w", err)
	}
	defer rows.Close()

	var tasks []TaskRow
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
	var meetingID string
	err := DB.QueryRow(context.Background(),
		`INSERT INTO meetings (project_id, transcript_text, summary_text)
		 VALUES ($1, $2, $3)
		 RETURNING id`,
		projectID, transcript, summary,
	).Scan(&meetingID)
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
	rows, err := DB.Query(context.Background(),
		`SELECT id, project_id, transcript_text, COALESCE(summary_text, ''), created_at
		 FROM meetings
		 WHERE project_id = $1
		 ORDER BY created_at DESC`,
		projectID,
	)
	if err != nil {
		return nil, fmt.Errorf("GetMeetingsByProject: %w", err)
	}
	defer rows.Close()

	var meetings []MeetingRow
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
	var taskID string
	err := DB.QueryRow(context.Background(),
		`INSERT INTO tasks (meeting_id, project_id, title, description, owner_id, due_date, created_by)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id`,
		meetingID, projectID, title, description, ownerID, dueDate, createdBy,
	).Scan(&taskID)
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
	rows, err := DB.Query(context.Background(),
		`SELECT id, meeting_id, title, description, owner_id, status, COALESCE(due_date::text, ''), created_at
		 FROM tasks
		 WHERE owner_id = $1
		 ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("GetTasksByUser: %w", err)
	}
	defer rows.Close()

	var tasks []TaskRow
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

// RAGChunkRow represents a row from the rag_chunks table.
type RAGChunkRow struct {
	ID        string
	MeetingID string
	ChunkText string
	Embedding string
	CreatedAt time.Time
}

// InsertRAGChunk inserts a new RAG chunk for a meeting.
func InsertRAGChunk(meetingID, chunkText, embedding string) (string, error) {
	var chunkID string
	err := DB.QueryRow(context.Background(),
		`INSERT INTO rag_chunks (meeting_id, chunk_text, embedding)
		 VALUES ($1, $2, $3)
		 RETURNING id`,
		meetingID, chunkText, embedding,
	).Scan(&chunkID)
	if err != nil {
		return "", fmt.Errorf("InsertRAGChunk: %w", err)
	}
	return chunkID, nil
}

// GetRAGChunksByMeeting returns all RAG chunks for a given meeting ID.
func GetRAGChunksByMeeting(meetingID string) ([]RAGChunkRow, error) {
	rows, err := DB.Query(context.Background(),
		`SELECT id, meeting_id, chunk_text, COALESCE(embedding, ''), created_at
		 FROM rag_chunks
		 WHERE meeting_id = $1
		 ORDER BY created_at ASC`,
		meetingID,
	)
	if err != nil {
		return nil, fmt.Errorf("GetRAGChunksByMeeting: %w", err)
	}
	defer rows.Close()

	var chunks []RAGChunkRow
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
	_, err := DB.Exec(context.Background(),
		`INSERT INTO otps (email, otp, expires_at)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (email) DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at`,
		email, otp, expiresAt,
	)
	if err != nil {
		return fmt.Errorf("UpsertOTP: %w", err)
	}
	return nil
}

// GetValidOTP retrieves the OTP for an email if it hasn't expired.
func GetValidOTP(email string) (string, error) {
	var otp string
	err := DB.QueryRow(context.Background(),
		`SELECT otp FROM otps WHERE email = $1 AND expires_at > NOW()`,
		email,
	).Scan(&otp)
	if err != nil {
		return "", fmt.Errorf("GetValidOTP: %w", err)
	}
	return otp, nil
}

// DeleteOTP removes the OTP for an email (called after successful verification).
func DeleteOTP(email string) error {
	_, err := DB.Exec(context.Background(),
		`DELETE FROM otps WHERE email = $1`,
		email,
	)
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
	_, err := DB.Exec(context.Background(),
		`INSERT INTO pending_signups (name, email, password, otp_hash, expires_at)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (email) DO UPDATE 
		 SET name = EXCLUDED.name, password = EXCLUDED.password, otp_hash = EXCLUDED.otp_hash, expires_at = EXCLUDED.expires_at`,
		name, email, password, otpHash, expiresAt,
	)
	if err != nil {
		return fmt.Errorf("UpsertPendingSignup: %w", err)
	}
	return nil
}

// GetValidPendingSignup retrieves pending signup data if the OTP hasn't expired.
func GetValidPendingSignup(email string) (PendingSignupRow, error) {
	var p PendingSignupRow
	err := DB.QueryRow(context.Background(),
		`SELECT email, name, password, otp_hash FROM pending_signups WHERE email = $1 AND expires_at > NOW()`,
		email,
	).Scan(&p.Email, &p.Name, &p.Password, &p.OTPHash)
	if err != nil {
		return p, fmt.Errorf("GetValidPendingSignup: %w", err)
	}
	return p, nil
}

// DeletePendingSignup removes the temporary signup data.
func DeletePendingSignup(email string) error {
	_, err := DB.Exec(context.Background(),
		`DELETE FROM pending_signups WHERE email = $1`,
		email,
	)
	if err != nil {
		return fmt.Errorf("DeletePendingSignup: %w", err)
	}
	return nil
}

// ---- Password Reset Queries ----

// UpsertPasswordReset stores a password reset request.
func UpsertPasswordReset(email, otpHash string, expiresAt time.Time) error {
	_, err := DB.Exec(context.Background(),
		`INSERT INTO password_resets (email, otp_hash, expires_at)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (email) DO UPDATE SET otp_hash = EXCLUDED.otp_hash, expires_at = EXCLUDED.expires_at`,
		email, otpHash, expiresAt,
	)
	if err != nil {
		return fmt.Errorf("UpsertPasswordReset: %w", err)
	}
	return nil
}

// GetValidPasswordReset retrieves the OTP hash if not expired.
func GetValidPasswordReset(email string) (string, error) {
	var otpHash string
	err := DB.QueryRow(context.Background(),
		`SELECT otp_hash FROM password_resets WHERE email = $1 AND expires_at > NOW()`,
		email,
	).Scan(&otpHash)
	if err != nil {
		return "", fmt.Errorf("GetValidPasswordReset: %w", err)
	}
	return otpHash, nil
}

// DeletePasswordReset removes the reset request.
func DeletePasswordReset(email string) error {
	_, err := DB.Exec(context.Background(), `DELETE FROM password_resets WHERE email = $1`, email)
	return err
}

// UpdateUserPassword updates the user's password.
func UpdateUserPassword(email, newPassword string) error {
	_, err := DB.Exec(context.Background(),
		`UPDATE users SET password = $1 WHERE email = $2`,
		newPassword, email,
	)
	if err != nil {
		return fmt.Errorf("UpdateUserPassword: %w", err)
	}
	return nil
}

// ---- Project & Task Access Queries ----

// checkTaskOwnership verifies if the user is the assigned owner of a task.
func checkTaskOwnership(userID string, taskID string) (bool, error) {
	var ownerID string
	err := DB.QueryRow(context.Background(), "SELECT owner_id FROM tasks WHERE id = $1", taskID).Scan(&ownerID)
	if err != nil {
		return false, fmt.Errorf("checkTaskOwnership: %w", err)
	}
	return ownerID == userID, nil
}

// InsertProjectMember adds a user to a project with a specific role.
func InsertProjectMember(projectID, userID, role string) error {
	_, err := DB.Exec(context.Background(),
		`INSERT INTO project_members (project_id, user_id, role)
		 VALUES ($1, $2, $3)
		 ON CONFLICT DO NOTHING`,
		projectID, userID, role,
	)
	if err != nil {
		return fmt.Errorf("InsertProjectMember: %w", err)
	}
	return nil
}

// GetProjectMembersByProject returns all users belonging to a project.
func GetProjectMembersByProject(projectID string) ([]UserRow, error) {
	rows, err := DB.Query(context.Background(),
		`SELECT u.id, u.name, u.email, u.created_at 
		 FROM users u
		 JOIN project_members pm ON u.id = pm.user_id
		 WHERE pm.project_id = $1`,
		projectID,
	)
	if err != nil {
		return nil, fmt.Errorf("GetProjectMembersByProject: %w", err)
	}
	defer rows.Close()

	var users []UserRow
	for rows.Next() {
		var u UserRow
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.CreatedAt); err != nil {
			return nil, fmt.Errorf("GetProjectMembersByProject scan: %w", err)
		}
		users = append(users, u)
	}
	return users, nil
}

// DeleteProject completely deletes a project and its cascades.
func DeleteProject(projectID string) error {
	_, err := DB.Exec(context.Background(), `DELETE FROM projects WHERE id = $1`, projectID)
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
	var jobID string
	err := DB.QueryRow(context.Background(),
		"INSERT INTO processing_jobs (project_id, status, progress, current_step) VALUES ($1, 'processing', 5, 1) RETURNING id",
		projectID,
	).Scan(&jobID)
	return jobID, err
}

func UpdateProcessingJob(projectID string, progress, currentStep int, status string) error {
	_, err := DB.Exec(context.Background(),
		"UPDATE processing_jobs SET progress = $1, current_step = $2, status = $3 WHERE project_id = $4",
		progress, currentStep, status, projectID,
	)
	return err
}

func GetProcessingJob(projectID string) (ProcessingJob, error) {
	var j ProcessingJob
	err := DB.QueryRow(context.Background(),
		"SELECT id, project_id, status, progress, current_step, COALESCE(eta_seconds, 0), error_message, started_at, completed_at FROM processing_jobs WHERE project_id = $1",
		projectID,
	).Scan(&j.ID, &j.ProjectID, &j.Status, &j.Progress, &j.CurrentStep, &j.ETASeconds, &j.ErrorMessage, &j.StartedAt, &j.CompletedAt)
	return j, err
}
