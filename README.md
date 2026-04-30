# MeetMint 💎 - Final AI Intelligence Prototype
**The Intelligent Bridge Between Meetings and Management**

MeetMint is a premium **AI-powered Productivity Dashboard** that transforms raw meeting video/audio into structured, actionable project metadata. Built with a high-fidelity Glassmorphism UI, it leverages both **Google Gemini Pro** and custom **RAG (Retrieval-Augmented Generation)** to provide instant meeting analysis and context-aware project insights.

---

## 🏗️ Project Architecture & Tech Stack
- **Frontend** ([`/frntend`](/frntend)): React 18 + Vite. Powered by Framer Motion, Canvas Particles, and premium Glassmorphism design tokens.
- **Backend** ([`/backend`](/backend)): Go (Golang) REST API. Handles SQLite persistence, secure OTP authentication, and the RAG intelligence orchestration.
- **AI Core**:
  - **Gemini Pro Integration**: High-speed, high-accuracy transcription analysis and task extraction.
  - **Local RAG Pipeline**: In-house vector-search logic using ChromaDB/Go-embeddings for intelligent transcript Q&A.
  - **Local Whisper Server** ([`/ai_server`](/ai_server)): Local Python ML processing for initial audio extraction.

---

## 🔥 Key Features (Sprint 3 Final)
- **🚀 RAG Q&A Interface**: Directly ask natural language questions about your project's meeting history (e.g., *"What did we decide about the budget last week?"*).
- **🤖 Gemini-Powered Extraction**: Automatic identification of decisions, action items, and predicted owners with 90%+ accuracy.
- **👥 Advanced Team Dynamics**: Interactive member management with real-time status tracking and simplified task delegation.
- **📊 Real-time Dashboard**: Dynamic Kanban boards, project health metrics, and automated progress calculation.
- **🛡️ Secure OTP Auth**: Enterprise-ready security with 2FA email verification and secure password recovery.

---

## 📺 Project Demo
The full application walk-through and backend workflow can be viewed here:
- **Sprint 3 Final Demo**: [View on Google Drive](REPLACE_WITH_YOUR_NEW_LINK)
- **Sprint 2 Heritage**: [View on Google Drive](https://drive.google.com/file/d/15ZhS9AlRSmj-M08KvTpxuxqvwpiLqbqE/view?usp=sharing)

---

## 🔧 One-Click Setup (Windows)
To launch the full ecosystem (Frontend + Backend + AI Server) simultaneously:
1. Ensure your `.env` file contains your `GEMINI_API_KEY`.
2. Run the main batch script:
```powershell
./run_all.bat
