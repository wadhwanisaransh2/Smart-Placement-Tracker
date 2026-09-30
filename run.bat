@echo off
echo ========================================
echo   PLACEMENT TRACKER - SIMPLE START
echo ========================================
echo.

echo Killing any existing Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting Backend Server...
start "Placement Tracker - Backend" cmd /k "cd /d %~dp0backend && node server.js"

echo Waiting for backend to initialize...
timeout /t 4 /nobreak >nul

echo.
echo Starting Frontend...
start "Placement Tracker - Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================
echo   SERVERS STARTING!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Two terminal windows have opened.
echo Wait for "MongoDB Connected" message in backend.
echo Frontend will open browser automatically.
echo.
echo Press any key to close this window...
pause >nul
