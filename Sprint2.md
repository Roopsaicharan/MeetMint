# Sprint 2 Deliverables & Documentation

## Demo Links
FrontEnd:[URL](https://drive.google.com/file/d/15ZhS9AlRSmj-M08KvTpxuxqvwpiLqbqE/view?usp=sharing)

BackEnd: [URL](https://drive.google.com/file/d/15LM2P-Fx4ZH_Q4sVLoGQGJHEznAP4TyY/view)

## 1. Work Completed in Sprint 2

During Sprint 2, the team focused on building the core application logic, integrating the ML capabilities, and establishing a robust authentication flow. Key achievements include:

- **Secure Authentication System**: Implemented an OTP-based email authentication flow for Signups, Logins, and Password Recovery using Golang and SMTP.
- **Local AI Transcription & Summarization**: Integrated the Go backend with a local Python ML server (`local_ai_server.py`) to process uploaded videos, generate transcripts, and leverage AI to extract structured action items and meeting summaries.
- **Database Persistence**: Designed and deployed a robust relational database schema using SQLite to persist Users, Projects, Meetings, Action Items, and Roles.
- **Dynamic Frontend Dashboard**: Developed a 3D-responsive React dashboard featuring an interactive Kanban board to track extracted meeting tasks and monitor project health.
- **Team Collaboration Features**: Built functionality that allows users to invite team members to projects, intelligently assign extracted tasks to specific owners, and update task statuses in real-time.

---

## 2. Frontend Test Coverage (Unit & Cypress)

To ensure the reliability of the UI and user flows, we implemented a combination of component-level unit tests (using Vite/React Testing environments) and End-to-End browser tests (using Cypress).

### Unit Tests
- `App.test.jsx`: 
  - `renders the background engine`: Verifies the main application shell and 3D background wrapper mount successfully.
  - `redirects to login when unauthenticated`: Asserts proper protected route redirection.
- `Dashboard.test.jsx`: 
  - `renders the sidebar and welcome message`: Ensures the primary navigation elements are visible.
  - `triggers logout when clicked`: Validates the `onLogout` mock function is called upon user action.
  - `displays the list of fetched projects`: Verifies asynchronous project loading and rendering in the view.
- `LoginPage.test.jsx`: 
  - `renders the sign in header`: Confirms the login form mounts correctly.
  - `validates email input`: Tests standard controlled input behavior.
  - `triggers registration navigaton on click`: Validates the navigation toggle to the sign-up page.

---

## 3. Backend Test Coverage (Golang)

Backend reliability and security were tested through standard Go unit and integration tests located in the root directory.

- `localai_test.go`: 
  - `TestTranscribeLocally_Success`: Asserts the mocked AI local transcription yields the accurate result properties.
  - `TestTranscribeLocally_AIError`: Validates that error payloads from the AI server are parsed and handled gracefully.
- `queries_test.go`: 
  - **User Queries**: `TestUpsertUser_NewUser`, `TestGetUserByEmail_Found`, `TestSearchUsers_ByName` ensuring correct user lookups.
  - **Project Queries**: `TestInsertProject`, `TestGetAllProjects_WithData`, `TestDeleteProject` validating project creation.
  - **Task Queries**: `TestInsertTask`, `TestCheckTaskOwnership_IsOwner` asserting correct task ownership boundaries.
  - **Auth/OTP Lifecycle**: `TestUpsertOTP_AndGetValidOTP`, `TestGetValidPendingSignup_Expired`, `TestUpdateUserPassword` testing secure 5-minute expirations.
- `router_test.go`: 
  - `TestRouter_Home`: Ensures backend health route responds appropriately.
  - `TestRouter_SignupFlow`: INTEGRATION test mocking the SMTP server during the complete signup workflow.
  - `TestRouter_LoginResponse`: Validates correct authentication and OTP dispatching for returning users.
- `testhelper_test.go`: 
  - Contains `resetDB` utility logic to securely wipe testing states before suite execution.

---

## 4. Backend API Documentation

Below is the fully documented RESTful API created for the MeetMint Go backend to handle frontend requests.

### Authentication Endpoints

#### `POST /api/signup`
Creates a pending user account and dispatches an OTP verification code via email.
- **Request Body:** `{ "name": "John Doe", "email": "john@email.com", "password": "securepass" }`
- **Response (200 OK):** `{ "message": "OTP sent successfully! Please verify to complete registration." }`

#### `POST /api/login`
Verifies credentials and dispatches an OTP verification code via email for 2FA login.
- **Request Body:** `{ "email": "john@email.com", "password": "securepass" }`
- **Response (200 OK):** `{ "message": "OTP sent successfully to your email!" }`

#### `POST /api/verify-otp`
Finalizes user registration or authenticates the user's login session upon successful code verification.
- **Request Body:** `{ "email": "john@email.com", "otp": "123456" }`
- **Response (200 OK):** `{ "message": "Login successful", "user": { "email": "john@email.com", "id": "uuid-here" } }`

#### `POST /api/forgot-password` / `POST /api/reset-password`
Handles secure password resets. `forgot-password` triggers an OTP to the email. `reset-password` verifies it and updates the DB.
- **Reset Request Body:** `{ "email": "john@email.com", "otp": "123456", "new_password": "newpass" }`

### Core Application Endpoints

#### `POST /api/upload-video`
Accepts a multipart form video upload, creates a project, and triggers background AI transcription and summarization tasks.
- **FormData:** `video` (File), `user_id` (String), `project_name` (String), `due_date` (String)
- **Response (200 OK):** `{ "id": "project-uuid-here" }`

#### `POST /api/summary`
Generates an AI summary and extracts action items from raw meeting notes utilizing the local Python ML server integration.
- **Request Body:** `{ "notes": "Meeting raw text transcript here..." }`
- **Response (200 OK):** Returns a comprehensive JSON object detailing `summary`, `decisions`, and an array of `action_items` (with dynamically assigned deadlines and predicted owners).

#### `GET /api/projects`
Retrieves a list of all active projects. Can optionally be scoped to a specific user.
- **Query Params:** `?user_id={uuid}` (Optional)
- **Response (200 OK):** `[ { "id": "proj-uuid", "name": "Sprint Planning", "created_at": "..." }, ... ]`

#### `GET /api/project-details`
Retrieves granular details about a specific project, aggregating its associated users, tasks, and historical meeting transcripts into a unified payload.
- **Query Params:** `?project_id={uuid}` (Required)
- **Response (200 OK):** JSON containing nested `notes`, `members`, and `summary/tasks` objects.

#### `POST /api/tasks/update`
Allows users or project managers to rapidly update the status of Kanban board action items.
- **Request Body:** `{ "task_id": "task-uuid", "user_id": "user-uuid", "status": "completed" }`
- **Response (200 OK):** `{ "message": "Task updated successfully" }`
