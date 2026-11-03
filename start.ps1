# Day Trader AI Dashboard - Full Stack Launcher
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   DAY TRADER AI DASHBOARD - MULTI-USER LOCAL PLATFORM    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start FastAPI Backend on port 8000
Write-Host "`n[1/2] Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Yellow
$BackendProcess = Start-Process -FilePath "python" -ArgumentList "-m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload" -PassThru

# 2. Start Vite Frontend on port 5173
Write-Host "[2/2] Starting React Vite Frontend on http://localhost:5173 ..." -ForegroundColor Yellow
$FrontendProcess = Start-Process -FilePath "npm" -ArgumentList "run dev --prefix frontend" -PassThru

Write-Host "`nReady! Open your browser at:" -ForegroundColor Green
Write-Host "  👉 Frontend Dashboard: http://localhost:5173" -ForegroundColor White
Write-Host "  👉 Backend API Docs:   http://localhost:8000/docs`n" -ForegroundColor White
Write-Host "Press Ctrl+C or close this window to terminate both servers." -ForegroundColor Gray

try {
    Wait-Process -Id $BackendProcess.Id, $FrontendProcess.Id
} finally {
    Stop-Process -Id $BackendProcess.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $FrontendProcess.Id -ErrorAction SilentlyContinue
}

