package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"

	_ "modernc.org/sqlite"
)

// DB is the global database connection pool.
var DB *sql.DB

// InitDB initializes the SQLite database.
func InitDB() {
	dbPath := os.Getenv("DATABASE_URL")
	if dbPath == "" {
		dbPath = "meetmint.db" // Default fallback
	}

	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("Unable to open database: %v\n", err)
	}

	// Verify the connection
	if err := DB.Ping(); err != nil {
		log.Fatalf("Unable to ping database: %v\n", err)
	}

	// Enable foreign keys
	_, err = DB.Exec("PRAGMA foreign_keys = ON;")
	if err != nil {
		log.Printf("Warning: Failed to enable foreign keys: %v\n", err)
	}

	fmt.Println("--------------------------------------------------")
	fmt.Println("🚀 DATABASE SCHEMA INITIALIZATION STARTING (SQLite)")
	fmt.Println("--------------------------------------------------")

	// Auto-initialize schema if tables are missing
	schema, err := os.ReadFile("schema.sql")
	if err != nil {
		log.Printf("❌ ERROR: schema.sql not found! Skipping auto-initialization: %v\n", err)
	} else {
		// Split by semicolon and execute individually for better error reporting
		statements := strings.Split(string(schema), ";")
		for _, stmt := range statements {
			trimmed := strings.TrimSpace(stmt)
			if trimmed == "" {
				continue
			}
			_, err = DB.Exec(trimmed)
			if err != nil {
				log.Printf("⚠️  SCHEMA NOTE: Statement failed: %v\n", err)
			} else {
				if strings.Contains(strings.ToLower(trimmed), "pending_signups") {
					fmt.Println("✅ TABLE CHECKED/CREATED: pending_signups")
				}
			}
		}

		// Extra Migrations (SQLite style - column exists check is different, but we'll try simple ALTERs)
		_, _ = DB.Exec("ALTER TABLE meetings ADD COLUMN summary_text TEXT;") // Will fail if already exists, which is fine
		_, _ = DB.Exec("ALTER TABLE meetings ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE CASCADE;")
		_, _ = DB.Exec("ALTER TABLE tasks ADD COLUMN owner_name TEXT;")

		fmt.Println("--------------------------------------------------")
		fmt.Println("🏁 DATABASE SCHEMA INITIALIZATION COMPLETED")
		fmt.Println("--------------------------------------------------")
	}
}

// CloseDB closes the database connection.
func CloseDB() {
	if DB != nil {
		DB.Close()
		fmt.Println("Database connection closed.")
	}
}
