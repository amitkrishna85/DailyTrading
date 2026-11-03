@echo off
title Day Trader AI Dashboard Launcher
echo ==========================================================
echo    DAY TRADER AI DASHBOARD - MULTI-USER LOCAL PLATFORM    
echo ==========================================================

echo.
echo [1/2] Starting FastAPI Backend on http://localhost:8000...
start "Day Trader Backend" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting React Vite Frontend on http://localhost:5173...
start "Day Trader Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================================
echo Ready! Open your browser:
echo   Frontend Dashboard: http://localhost:5173
echo   Backend API Docs:   http://localhost:8000/docs
echo ==========================================================
pause

