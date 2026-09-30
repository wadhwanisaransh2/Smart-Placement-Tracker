@echo off
echo ========================================
echo Profile Update Fix - Quick Test
echo ========================================
echo.
echo This script will help you test the profile update fix.
echo.
echo STEP 1: Starting Backend Server...
echo ========================================
cd backend
start "Backend Server" cmd /k "npm start"
timeout /t 5 /nobreak >nul

echo.
echo STEP 2: Starting Frontend Server...
echo ========================================
cd ..\frontend
start "Frontend Server" cmd /k "npm start"

echo.
echo ========================================
echo Servers are starting...
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo TESTING CHECKLIST:
echo ========================================
echo [ ] 1. Register a new student account
echo [ ] 2. Check Profile page - verify all fields display
echo [ ] 3. Edit Profile - add Department and CGPA
echo [ ] 4. Save changes - verify success message
echo [ ] 5. Logout and login again
echo [ ] 6. Check Profile - verify all data persists
echo.
echo Press any key to open the browser...
pause >nul
start http://localhost:3000/register
echo.
echo Browser opened! Follow the testing checklist above.
echo.
echo To stop servers: Close the Backend and Frontend terminal windows
echo.
pause
