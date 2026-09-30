@echo off
echo ========================================
echo  SMART PLACEMENT TRACKER - STARTUP
echo ========================================
echo.

REM Kill any existing Node processes
echo [1/5] Stopping existing Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Check MongoDB
echo [2/5] Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo MongoDB is not running. Starting MongoDB...
    net start MongoDB
    if %errorlevel% neq 0 (
        echo WARNING: Could not start MongoDB automatically.
        echo Please start MongoDB manually and press any key to continue...
        pause >nul
    )
) else (
    echo MongoDB is running!
)

echo.
echo [3/5] Starting Backend Server...
cd backend
start "Placement Tracker Backend" cmd /k "node server.js"
timeout /t 3 /nobreak >nul

echo [4/5] Starting Frontend Server...
cd ..\frontend
start "Placement Tracker Frontend" cmd /k "npm start"

echo.
echo [5/5] Startup Complete!
echo.
echo ========================================
echo  SERVERS STARTED
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Your browser will open automatically...
echo.
echo Press any key to close this window.
pause >nul
