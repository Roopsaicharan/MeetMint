package main

import (
	"database/sql"
	"os"
	"strings"
	"testing"

	_ "modernc.org/sqlite"
)

// TestMain boots a fresh in-memory SQLite DB for every test run.
// All test files in the `main` package share this single setup.
func TestMain(m *testing.M) {
	// Use an in-memory database so tests never touch meetmint.db
	os.Setenv("DATABASE_URL", ":memory:")
	setupTestDB()
	code := m.Run()
	CloseDB()
	os.Exit(code)
}

// setupTestDB opens an in-memory SQLite connection and applies the schema.
func setupTestDB() {
	var err error
	DB, err = sql.Open("sqlite", ":memory:")
	if err != nil {
		panic("setupTestDB: open failed: " + err.Error())
	}
	if err = DB.Ping(); err != nil {
		panic("setupTestDB: ping failed: " + err.Error())
	}
	DB.Exec("PRAGMA foreign_keys = ON;")
	applySchema()
}

// applySchema reads schema.sql from disk and runs every statement.
func applySchema() {
	raw, err := os.ReadFile("schema.sql")
	if err != nil {
		panic("setupTestDB: cannot read schema.sql: " + err.Error())
	}
	for _, stmt := range strings.Split(string(raw), ";") {
		trimmed := strings.TrimSpace(stmt)
		if trimmed == "" {
			continue
		}
		if _, err := DB.Exec(trimmed); err != nil {
			// Ignore "already exists" type errors (IF NOT EXISTS handles most)
			_ = err
		}
	}
	// Extra migrations (same as InitDB)
	DB.Exec("ALTER TABLE meetings ADD COLUMN summary_text TEXT;")
	DB.Exec("ALTER TABLE meetings ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE CASCADE;")
}

// resetDB wipes all rows between tests to prevent state bleed.
func resetDB() {
	tables := []string{
		"processing_jobs", "rag_chunks", "messages",
		"tasks", "meetings", "project_members", "projects",
		"password_resets", "pending_signups", "otps",
		"workspace_members", "workspaces", "users",
	}
	for _, t := range tables {
		DB.Exec("DELETE FROM " + t)
	}
}
