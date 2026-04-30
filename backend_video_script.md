# MeetMint Sprint 3 — Backend Video Script (NEW Features Only)

> Features already covered in Sprint 1/2 (basic auth, signup, login, OTP, upload-video, summary, dashboard API, SQLite schema, local AI transcription) are **not repeated** here.

---

## SECTION 1: What's New in Sprint 3 Backend

**SAY:**
> "In Sprint 3, we made major upgrades to the backend. Here's what's new:"
> 1. "We built a live RAG pipeline that runs at question time using the transcript as direct input"
> 2. "We migrated from the local Python AI server to the Google Gemini API for transcript analysis"
> 3. "We added new API endpoints for task creation, editing, deletion, member invites, and processing status"
> 4. "We wrote 62 new backend unit tests across 4 new test files — bringing the total to 97"

---

## SECTION 2: Live RAG Pipeline (New in Sprint 3)

**SAY:**
> "The biggest Sprint 3 feature is a complete rewrite of the Ask AI endpoint. Previously, RAG chunks were pre-stored during video upload. Now, the RAG pipeline runs live every time a user asks a question, using the transcript directly as input."

**SHOW:** Open `backend/main.go` — `handleAsk` function

**SAY:**
> "Here's the new handleAsk flow — 8 steps that run at question time:"

**SHOW:** Steps 1-2 — Fetch transcript and chunk it

```go
// Step 1: Fetch the transcript from meetings table
meetings, err := GetMeetingsByProject(req.ProjectID)
// Combine all transcripts
var fullTranscript strings.Builder
for _, m := range meetings {
    fullTranscript.WriteString(m.TranscriptText)
}

// Step 2: Chunk the transcript on-the-fly
chunks := ChunkTranscript(transcript)
```

**SAY:**
> "Steps 1 and 2: We fetch every meeting transcript for this project from SQLite and chunk it on-the-fly into 250-word overlapping segments. This is new — previously chunks were pre-stored."

**SHOW:** Steps 3-4 — Embed question and chunks, compute similarity

```go
// Step 3: Embed the question
qVector, err := GetGeminiEmbedding(req.Question)

// Step 4: Embed each chunk and rank
for i, chunkText := range chunks {
    chunkVec, err := GetGeminiEmbedding(chunkText)
    score := CosineSimilarity(qVector, chunkVec)
    scored = append(scored, ScoredChunk{Content: chunkText, Score: score})
}
```

**SAY:**
> "Steps 3 and 4: We embed the user's question and every chunk using Gemini's embedding API, then compute cosine similarity between the question and each chunk."

**SHOW:** Steps 5-8 — Sort, construct prompt, call Gemini, parse response

**SAY:**
> "Steps 5 through 8: We sort chunks by similarity, take the top 5, construct a prompt with those chunks as context, call Gemini for a grounded answer, and parse the JSON response."

> "The key design decision: RAG runs fresh at question time using the transcript as direct input. This ensures the AI always has the most up-to-date data without relying on pre-computed embeddings."

---

## SECTION 3: Gemini API Migration (New in Sprint 3)

**SAY:**
> "In Sprint 2, we used a local Python ML server for AI analysis. In Sprint 3, we migrated to the Google Gemini API."

**SHOW:** Open `backend/gemini.go`

**SHOW:** `AnalyzeTranscriptWithGemini` function (lines 56–167)

**SAY:**
> "AnalyzeTranscriptWithGemini is the new function that replaces the local AI server for transcript analysis. It sends the full transcript to Gemini with a structured prompt asking for a JSON response containing a summary and extracted tasks."

**SHOW:** The prompt template (lines 69–103)

```go
prompt := fmt.Sprintf(`You are a professional meeting assistant AI.
Your job is to:
1. Write a clear 3-5 sentence summary
2. Extract every action item or task
3. For each task, identify WHO was assigned

Return ONLY valid JSON:
{
  "summary": "...",
  "tasks": [
    {"title": "...", "description": "...", "owner": "...", "due_date": "YYYY-MM-DD or null"}
  ]
}
TRANSCRIPT:
%s`, transcript)
```

**SAY:**
> "The prompt is carefully crafted — it tells Gemini to preserve exact name spellings and use null for dates not mentioned. This ensures reliable parsing."

**SHOW:** `cleanJSONResponse` helper (lines 224–233)

```go
func cleanJSONResponse(raw string) string {
    raw = strings.TrimSpace(raw)
    re := regexp.MustCompile("(?s)```(?:json)?\n?(.*?)\n?```")
    match := re.FindStringSubmatch(raw)
    if len(match) > 1 {
        return strings.TrimSpace(match[1])
    }
    return strings.TrimSpace(raw)
}
```

**SAY:**
> "We built a cleanJSONResponse helper that strips markdown code fences. Sometimes Gemini wraps its JSON in backticks, so this regex handles that automatically."

---

## SECTION 4: New API Endpoints (Sprint 3)

**SAY:**
> "Sprint 3 added several new endpoints that weren't in Sprint 2."

**SHOW:** Open `backend/main.go` — `SetupRouter` (highlight the new routes)

**SAY:**
> "Here are the new endpoints added in Sprint 3:"

```
NEW in Sprint 3:
POST /api/tasks/edit       — Edit task title and reassign owner
POST /api/tasks/delete     — Delete a task
POST /api/tasks/create     — Manually create a new task
POST /api/projects/delete  — Delete a project and cascade data
POST /api/projects/members/add    — Add a member to a project
POST /api/projects/members/remove — Remove a member
POST /api/projects/invite         — Invite by email
GET  /api/projects/status         — Real-time processing job progress
GET  /api/users/search            — Search users by name or email
POST /api/ask                     — RAG-powered Q&A (rewritten)
```

**SHOW:** `handleCreateTask` (lines ~706–727)

```go
func handleCreateTask(w http.ResponseWriter, r *http.Request) {
    var req struct {
        ProjectID   string  `json:"project_id"`
        Title       string  `json:"title"`
        Description string  `json:"description"`
        OwnerID     *string `json:"owner_id"`
    }
    json.NewDecoder(r.Body).Decode(&req)
    taskID, err := InsertTask(nil, &req.ProjectID, req.Title, req.Description, 
        req.OwnerID, "", nil, nil)
    json.NewEncoder(w).Encode(map[string]string{"id": taskID})
}
```

**SAY:**
> "handleCreateTask lets users manually create tasks from the dashboard without needing an AI extraction. The task is linked to a project and optionally assigned to an owner."

**SHOW:** Open `backend/job_endpoints.go`

```go
func RegisterJobEndpoints(mux *http.ServeMux) {
    mux.HandleFunc("/api/projects/status", func(w http.ResponseWriter, r *http.Request) {
        projectID := r.URL.Query().Get("project_id")
        job, err := GetProcessingJob(projectID)
        json.NewEncoder(w).Encode(job)
    })
}
```

**SAY:**
> "The processing status endpoint is new — it returns real-time progress for the Processing Screen. The frontend polls this every 2 seconds to show live updates during video processing."

---

## SECTION 5: New Backend Unit Tests (Sprint 3)

**SAY:**
> "Sprint 2 had about 35 backend tests. In Sprint 3, we added 62 new tests across 4 new test files, bringing the total to 97."

**SHOW:** Run in terminal:

```bash
cd backend
go test -v -count=1 ./...
```

**SAY:**
> "Here are the 4 new test files we created:"

| New File | Tests | What's Tested |
|----------|-------|---------------|
| `handlers_test.go` | 30 | All HTTP endpoints — signup, login, OTP, projects, tasks, members, password reset, processing status |
| `rag_test.go` | 15 | ChunkTranscript edge cases, CosineSimilarity math, RAG DB integration |
| `gemini_test.go` | 8 | cleanJSONResponse parsing, MeetingAnalysis struct validation |
| `otp_sprint3_test.go` | 7 | OTP length, digit-only, uniqueness, hash determinism, SMTP errors |

**SHOW:** Open `backend/handlers_test.go` — show `TestHandler_ResetPassword_Success`

```go
func TestHandler_ResetPassword_Success(t *testing.T) {
    resetDB()
    UpsertUser("ResetOK", "resetok@test.com", "oldpw")
    UpsertPasswordReset("resetok@test.com", HashOTP("555555"), 
        time.Now().Add(5*time.Minute))

    body, _ := json.Marshal(ResetPasswordRequest{
        Email: "resetok@test.com", OTP: "555555", NewPassword: "newpw",
    })
    req := httptest.NewRequest("POST", "/api/reset-password", bytes.NewBuffer(body))
    rr := httptest.NewRecorder()
    router.ServeHTTP(rr, req)

    if rr.Code != http.StatusOK { t.Errorf(...) }
    _, _, pw, _ := GetUserByEmail("resetok@test.com")
    if pw != "newpw" { t.Errorf("password not updated") }
}
```

**SAY:**
> "This integration test creates a user, stores a reset OTP, sends the HTTP request, checks the response code, then verifies the database was actually updated. This is new — Sprint 2 didn't have handler-level HTTP tests."

**SHOW:** Open `backend/rag_test.go` — show `TestCosineSimilarity_IdenticalVectors`

```go
func TestCosineSimilarity_IdenticalVectors(t *testing.T) {
    a := []float32{1.0, 2.0, 3.0}
    b := []float32{1.0, 2.0, 3.0}
    score := CosineSimilarity(a, b)
    if score < 0.999 {
        t.Errorf("expected ~1.0, got %f", score)
    }
}
```

**SAY:**
> "The RAG tests cover mathematical edge cases — identical vectors should return 1.0, orthogonal vectors return 0, opposite vectors return -1, and mismatched lengths return 0."

**SHOW:** Terminal output — all 97 tests PASS

**SAY:**
> "All 97 backend tests pass. The 62 new tests give us coverage over the RAG pipeline, all API endpoints, Gemini integration, and extended OTP security."

---
