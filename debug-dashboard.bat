@echo off
echo ========================================
echo Dashboard Debug Helper
echo ========================================
echo.
echo This will help identify why the dashboard is not working.
echo.
echo Step 1: Checking for syntax errors...
echo ========================================
cd frontend
echo Running ESLint check on Dashboard.js...
npx eslint src/pages/Dashboard.js --no-eslintrc --parser-options=ecmaVersion:2020,sourceType:module,ecmaFeatures:{jsx:true} 2>&1

echo.
echo Step 2: Checking if frontend compiles...
echo ========================================
echo Building frontend (this may take a minute)...
npm run build 2>&1 | findstr /i "error failed"

echo.
echo ========================================
echo Debug complete!
echo ========================================
echo.
echo If you see errors above, please share them.
echo If no errors, the issue might be with the dev server.
echo.
pause
