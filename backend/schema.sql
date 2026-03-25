-- =============================================================
-- MeetMint PostgreSQL Schema
-- =============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Uncomment the line below if pgvector is installed:
-- CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================
-- 1) users
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       TEXT,
    email      TEXT UNIQUE NOT NULL,
    password   TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================
-- 2) workspaces
-- =============================================================
CREATE TABLE IF NOT EXISTS workspaces (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       TEXT,
    owner_id   UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================
-- 3) workspace_members
-- =============================================================
CREATE TABLE IF NOT EXISTS workspace_members (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
    role         TEXT,
    created_at   TIMESTAMP DEFAULT NOW()
);

-- =============================================================
-- 4) projects
-- =============================================================
CREATE TABLE IF NOT EXISTS projects (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name         TEXT,
    created_by   UUID REFERENCES users(id),
    due_date     TEXT,
    created_at   TIMESTAMP DEFAULT NOW()
);

-- =============================================================
-- 4.5) project_members
-- =============================================================
CREATE TABLE IF NOT EXISTS project_members (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
    role         TEXT DEFAULT 'member', -- admin/member
    created_at   TIMESTAMP DEFAULT NOW()
);

-- =============================================================
-- 5) meetings
-- =============================================================
CREATE TABLE IF NOT EXISTS meetings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
    transcript_text TEXT,
    summary_text    TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- =============================================================
-- 6) tasks
-- =============================================================
CREATE TABLE IF NOT EXISTS tasks (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id  UUID REFERENCES meetings(id) ON DELETE CASCADE,
    project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
    title       TEXT,
    description TEXT,
    owner_id    UUID REFERENCES users(id),
    status      TEXT DEFAULT 'todo',
    due_date    TIMESTAMP, -- Changed to TIMESTAMP for real dates
    created_by  UUID REFERENCES users(id),
    created_at  TIMESTAMP DEFAULT NOW()
);

-- =============================================================
-- 7) messages
-- =============================================================
CREATE TABLE IF NOT EXISTS messages (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id    UUID REFERENCES tasks(id) ON DELETE CASCADE,
    sender_id  UUID REFERENCES users(id),
    message    TEXT,
    visibility TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================
-- 8) rag_chunks
-- Uses TEXT for embedding if pgvector is not installed.
-- If pgvector IS installed, change TEXT to VECTOR(1536).
-- =============================================================
CREATE TABLE IF NOT EXISTS rag_chunks (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    chunk_text TEXT,
    embedding  TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================
-- 9) otps
-- Used for temporary login codes with a 5-minute expiry.
-- =============================================================
CREATE TABLE IF NOT EXISTS otps (
    email      TEXT PRIMARY KEY,
    otp        TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

-- =============================================================
-- 10) pending_signups
-- Stores user data temporarily until OTP is verified.
-- =============================================================
CREATE TABLE IF NOT EXISTS pending_signups (
    email      TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    password   TEXT NOT NULL,
    otp_hash   TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================
-- 11) password_resets
-- Stores OTP hashes for password reset requests.
-- =============================================================
CREATE TABLE IF NOT EXISTS password_resets (
    email      TEXT PRIMARY KEY,
    otp_hash   TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================
-- 12) processing_jobs
-- =============================================================
CREATE TABLE IF NOT EXISTS processing_jobs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id     UUID REFERENCES projects(id) ON DELETE CASCADE,
  status         TEXT DEFAULT 'processing',
  progress       INT DEFAULT 0,
  current_step   INT DEFAULT 1,
  eta_seconds    INT,
  error_message  TEXT,
  started_at     TIMESTAMPTZ DEFAULT NOW(),
  completed_at   TIMESTAMPTZ
);
