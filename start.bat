@echo off
REM ProCRM Start Script for Windows
REM This script starts both the backend and frontend servers

echo ========================================
echo  ProCRM - Professional Sales Funnel CRM
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

REM Install dependencies if needed
echo Checking dependencies...
pip install -r requirements.txt --quiet

REM Start backend
echo.
echo Starting backend server on http://localhost:5000...
start cmd /k python app.py

REM Wait a moment for backend to start
timeout /t 2 /nobreak

REM Start frontend
echo Starting frontend server on http://localhost:8080...
start cmd /k python -m http.server 8080

REM Open browser
echo.
echo Opening ProCRM in your browser...
timeout /t 2 /nobreak
start http://localhost:8080/login.html

echo.
echo ========================================
echo Servers are running!
echo Frontend:  http://localhost:8080
echo Backend:   http://localhost:5000
echo ========================================
echo.
echo Press Ctrl+C in either terminal to stop the servers
echo Demo accounts:
echo   Admin: admin@crm.com / admin123
echo   Sales: sales@crm.com / sales123
echo.
pause
