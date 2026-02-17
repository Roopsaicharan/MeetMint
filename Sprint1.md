# Sprint 1 Report: MeetMint Prototype

## User Stories
The following user stories were addressed in Sprint 1:
1. **Authentication**: As a user, I want to be able to sign up and log in to the application so that I can access my dashboard.
2. **Dashboard Access**: As a user, I want a centralized dashboard where I can manage my post-meeting tasks.
3. **Project Management**: As a user, I want to see a list of my active projects with due date tracking ("Days Left") and create new ones.
4. **Project Search**: As a user, I want to search through my active projects to find them quickly.
5. **Meeting Notes**: As a user, I want to see generated notes from my uploaded video.
6. **AI Summary**: As a user, I want to receive an AI-generated summary, decision list, and action items from my meeting notes.
7. **Q&A (RAG)**: As a user, I want to ask questions about the meeting content and get answers with citations.
8. **Task Progress Tracking**: As a user, I want to track the status of action items (TODO, IN PROGRESS, BLOCKED, DONE) and see dynamic project-level status updates.
9. **Team Management**: As a user, I want the system to automatically track project members based on task assignments.

## Issues Planned & Completed

### Frontend (React + Vite)
- [x] **Vibrant Theme Integration**: Implemented a deep blue vibrant theme with SVG waves, glassmorphism, and smooth animations.
- [x] **"Sideways" Dashboard Layout**: Refactored the UI for horizontal scaling, featuring:
    - Side-scrolling Project Cards for better density.
    - Two-column Project Details view (Notes/RAG on left, AI Results on right).
- [x] **Intelligent Task System**: 
    - Added status controls (TODO, IN PROGRESS, BLOCKED, DONE) to all action items.
    - Implemented dynamic project-level status terms that update based on task progress.
- [x] **Automated Member Sync**: Dynamic counting of unique project members derived from action item assignees.
- [x] **Header UX Refinement**: Cleaned up header actions, removed redundant buttons, and aligned batch-delete actions with the primary workflow.
- [x] **Authentication UX**: Glassmorphism-styled Login and Register pages with field validation.
- [x] **Project Search & Filter**: Real-time project list filtering based on user search queries.
- [x] **Navigation**: Made the "MeetMint" logo a functional "Home" button to return to the project list.
- [x] **Project Management**: Full CRUD-lite capability (Create, Search, Delete, Batch Delete).

### Backend (Go)
- [x] **Project Setup**: Initialize Go module and high-performance HTTP server.
- [x] **API: Video Upload**: Endpoint `/api/upload-video` handling multipart uploads and returning prioritized meeting notes.
- [x] **API: Intelligent Summary**: Endpoint `/api/summary` returning structured JSON with summaries, decisions, and action items.
- [x] **API: RAG Q&A**: Endpoint `/api/ask` processing meeting context to provide cited answers.
- [x] **CORS Configuration**: Secure communication between Frontend (Vite) and Backend (Go).

## Incomplete Issues
- **None**: All targeted functionalities for the Sprint 1 Mock/Prototype were successfully implemented and polished.

---

## Submission Details

### GitHub Repository
[Insert your GitHub Link Here] - *Please ensure all code is pushed to the main branch.*

### Demo Requirements
1. **Integrated Frontend/Backend Flow**:
   - Demonstrate authentication and dashboard navigation.
   - Show the end-to-end "Video Upload -> AI Analysis -> Status Tracking" workflow.
   - Highlight the dynamic progress tracking and member counts.
2. **Technical Verification**:
   - Run the Go backend and demonstrate JSON responses via Postman/cURL.
   - Verify dynamic UI updates when changing task statuses.
