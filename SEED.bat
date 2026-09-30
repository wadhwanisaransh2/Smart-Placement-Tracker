@echo off
echo ========================================
echo SEEDING DATABASE WITH SAMPLE COMPANIES
echo ========================================
echo.

cd backend
node seedData.js

echo.
echo ========================================
echo SEED COMPLETE!
echo ========================================
echo.
echo Press any key to close...
pause > nul
