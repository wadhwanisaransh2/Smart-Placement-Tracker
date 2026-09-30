@echo off
echo ========================================
echo  PLACEMENT TRACKER - NETWORK ACCESS
echo ========================================
echo.

REM Get IP Address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%

echo [INFO] Your Computer's IP Address: %IP%
echo.
echo ========================================
echo  ACCESS URLS
echo ========================================
echo.
echo Desktop (This Computer):
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo.
echo Mobile Phone (Same WiFi):
echo   Frontend: http://%IP%:3000
echo   Backend:  http://%IP%:5000
echo.
echo ========================================
echo  IMPORTANT: Make sure your phone is
echo  connected to the SAME WiFi network!
echo ========================================
echo.

REM Kill existing Node processes
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
echo [3/5] Starting Backend Server (Network Mode)...
cd backend
start "Placement Tracker Backend" cmd /k "node server.js"
timeout /t 3 /nobreak >nul

echo [4/5] Starting Frontend Server (Network Mode)...
cd ..\frontend
start "Placement Tracker Frontend" cmd /k "set REACT_APP_API_URL=http://%IP%:5000/api && npm start"

echo.
echo [5/5] Startup Complete!
echo.
echo ========================================
echo  SERVERS STARTED
echo ========================================
echo.
echo Desktop Access:
echo   Open browser: http://localhost:3000
echo.
echo Mobile Access:
echo   1. Connect phone to same WiFi
echo   2. Open browser on phone
echo   3. Go to: http://%IP%:3000
echo.
echo Backend API:
echo   Local:   http://localhost:5000
echo   Network: http://%IP%:5000
echo.
echo ========================================
echo  TROUBLESHOOTING
echo ========================================
echo.
echo If mobile can't connect:
echo   1. Check WiFi - same network?
echo   2. Check firewall settings
echo   3. Try: http://%IP%:3000 (not https)
echo   4. Restart servers
echo.
echo Press any key to close this window.
pause >nul
