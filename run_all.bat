@echo off
echo ==========================================
echo    MeetMint Unified Start Script
echo ==========================================

:: 1. Start AI server in a new window
start "MeetMint AI Server" cmd /k "cd ai_server && python local_ai_server.py"

:: 2. Start Go backend in a new window
echo Starting Go Backend...
start "MeetMint Backend" cmd /k "cd backend && go run ."

:: 3. Start Frontend
echo Starting Vite Frontend...
cd frntend
npm install && npm run dev

pause
