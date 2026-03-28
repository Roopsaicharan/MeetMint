# MeetMint Final Prototype - Sprint 2 Submission

MeetMint is a high-fidelity **AI-driven Productivity Dashboard** designed to automate meeting minutes, link transcripts to project tasks, and handle user authentication with a premium Glassmorphism UI.

## 📺 Project Demo
The full application walk-through and backend workflow can be viewed here:
- **Frontend Demo**: [View on Google Drive](https://drive.google.com/file/d/15ZhS9AlRSmj-M08KvTpxuxqvwpiLqbqE/view?usp=sharing)
- **Backend Demo**: [View on Google Drive](https://drive.google.com/file/d/15LM2P-Fx4ZH_Q4sVLoGQGJHEznAP4TyY/view)

## 🚀 One-Click Start
To run all 3 services at once on Windows:
```powershell
./run_all.bat
```
*(Wait for all 3 windows to initialize before logging in).*

## 🏗️ Project Architecture
- **Frontend** ([`frntend/`](/frntend)): React + Vite. Uses Framer Motion for premium aesthetics.
- **Backend** ([`backend/`](/backend)): Go (Golang) on Port 5000. Features SQLite persistence.
- **AI Server** ([`ai_server/`](/ai_server)): Flask + Whisper AI for local ML transcriptions on Port 5001.

## ⚙️ Prerequisites
1. **Node.js** (for frontend)
2. **Go 1.2x** (for backend)
3. **Python 3.x** (for AI server)
   - `pip install whisper moviepy flask numpy`

## 🧪 Sprint 2 Deliverables
Detailed reports on testing, API specifications, and database schemas are available in:
👉 [**`Sprint2.md`**](/Sprint2.md)

- **Backend**: `go test ./...` ✅ **Passing**
- **Frontend Unit**: `npm run test:unit` ✅ **Passing** (8/8)
- **Frontend E2E**: `npm run test:e2e` ✅ **Passing** (3/3)

## 🔑 Default Test Credentials
- **Email**: `test@example.com`
- **Password**: `newpassword123`
*(OTP login code is printed to the Go Backend terminal for demo purposes).*

---
© 2026 MeetMint Development Team
