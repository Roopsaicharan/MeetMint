-- =============================================================
-- MeetMint SQLite Schema
-- =============================================================

-- =============================================================
-- 1) users
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    name       TEXT,
    email      TEXT UNIQUE NOT NULL,
    password   TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- 2) workspaces
-- =============================================================
CREATE TABLE IF NOT EXISTS workspaces (
    id         TEXT PRIMARY KEY,
    name       TEXT,
    owner_id   TEXT REFERENCES users(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- 3) workspace_members
-- =============================================================
CREATE TABLE IF NOT EXISTS workspace_members (
    id           TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id      TEXT REFERENCES users(id) ON DELETE CASCADE,
    role         TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- 4) projects
-- =============================================================
CREATE TABLE IF NOT EXISTS projects (
    id           TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    name         TEXT,
    created_by   TEXT REFERENCES users(id),
    due_date     TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- 4.5) project_members
-- =============================================================
CREATE TABLE IF NOT EXISTS project_members (
    id           TEXT PRIMARY KEY,
    project_id   TEXT REFERENCES projects(id) ON DELETE CASCADE,
    user_id      TEXT REFERENCES users(id) ON DELETE CASCADE,
    role         TEXT DEFAULT 'member', -- admin/member
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- 5) meetings
-- =============================================================
CREATE TABLE IF NOT EXISTS meetings (
    id              TEXT PRIMARY KEY,
    project_id      TEXT REFERENCES projects(id) ON DELETE CASCADE,
    transcript_text TEXT,
    summary_text    TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- 6) tasks
-- =============================================================
CREATE TABLE IF NOT EXISTS tasks (
    id          TEXT PRIMARY KEY,
    meeting_id  TEXT REFERENCES meetings(id) ON DELETE CASCADE,
    project_id  TEXT REFERENCES projects(id) ON DELETE CASCADE,
    title       TEXT,
    description TEXT,
    owner_id    TEXT REFERENCES users(id),
    status      TEXT DEFAULT 'todo',
    due_date    DATETIME,
    created_by  TEXT REFERENCES users(id),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- 7) messages
-- =============================================================
CREATE TABLE IF NOT EXISTS messages (
    id         TEXT PRIMARY KEY,
    task_id    TEXT REFERENCES tasks(id) ON DELETE CASCADE,
    sender_id  TEXT REFERENCES users(id),
    message    TEXT,
    visibility TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- 8) rag_chunks
-- =============================================================
CREATE TABLE IF NOT EXISTS rag_chunks (
    id         TEXT PRIMARY KEY,
    meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
    chunk_text TEXT,
    embedding  TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- 9) otps
-- =============================================================
CREATE TABLE IF NOT EXISTS otps (
    email      TEXT PRIMARY KEY,
    otp        TEXT NOT NULL,
    expires_at DATETIME NOT NULL
);

-- =============================================================
-- 10) pending_signups
-- =============================================================
CREATE TABLE IF NOT EXISTS pending_signups (
    email      TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    password   TEXT NOT NULL,
    otp_hash   TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- 11) password_resets
-- =============================================================
CREATE TABLE IF NOT EXISTS password_resets (
    email      TEXT PRIMARY KEY,
    otp_hash   TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- 12) processing_jobs
-- =============================================================
CREATE TABLE IF NOT EXISTS processing_jobs (
  id             TEXT PRIMARY KEY,
  project_id     TEXT REFERENCES projects(id) ON DELETE CASCADE,
  status         TEXT DEFAULT 'processing',
  progress       INTEGER DEFAULT 0,
  current_step   INTEGER DEFAULT 1,
  eta_seconds    INTEGER,
  error_message  TEXT,
  started_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at   DATETIME
);
