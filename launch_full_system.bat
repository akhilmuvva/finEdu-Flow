@echo off
echo [1/3] Starting FinnEDu Backend...
start cmd /k ".\.venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo [2/3] Starting FinnEDu Frontend...
start cmd /k "cd frontend && npm run dev"

echo [3/3] System is launching! 
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
pause
