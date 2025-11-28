@echo off
echo Starting KIRANA911...

start "KIRANA911 Backend" cmd /k "cd backend && npm install && node server.js"
timeout /t 5
start "KIRANA911 Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo Application started!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
pause
