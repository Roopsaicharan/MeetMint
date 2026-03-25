package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB is the global database connection pool.
var DB *pgxpool.Pool

// InitDB initializes the PostgreSQL connection pool using DATABASE_URL from env.
func InitDB() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	var err error
	DB, err = pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to create connection pool: %v\n", err)
	}

	// Verify the connection
	if err := DB.Ping(context.Background()); err != nil {
		log.Fatalf("Unable to ping database: %v\n", err)
	}

	fmt.Println("--------------------------------------------------")
	fmt.Println("🚀 DATABASE SCHEMA INITIALIZATION STARTING")
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
			_, err = DB.Exec(context.Background(), trimmed)
			if err != nil {
				// Don't fail the whole process if one statement fails (e.g. extension already exists)
				log.Printf("⚠️  SCHEMA NOTE: Statement failed (may already exist): %v\n", err)
			} else {
				// Log success for specific tables we care about to be sure
				if strings.Contains(strings.ToLower(trimmed), "pending_signups") {
					fmt.Println("✅ TABLE CHECKED/CREATED: pending_signups")
				}
			}
		}
		// 2. Extra Migrations: Ensure existing tables have the latest columns
		// PostgreSQL 'IF NOT EXISTS' only works for creation, not columns.
		_, _ = DB.Exec(context.Background(), "ALTER TABLE meetings ADD COLUMN IF NOT EXISTS summary_text TEXT;")
		_, _ = DB.Exec(context.Background(), "ALTER TABLE meetings ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;")

		fmt.Println("--------------------------------------------------")
		fmt.Println("🏁 DATABASE SCHEMA INITIALIZATION COMPLETED")
		fmt.Println("--------------------------------------------------")
	}
}

// CloseDB closes the database connection pool.
func CloseDB() {
	if DB != nil {
		DB.Close()
		fmt.Println("Database connection closed.")
	}
}
