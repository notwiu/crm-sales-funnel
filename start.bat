@echo off
echo.
echo ============================================
echo   ProCRM - Sales Funnel Management
echo ============================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

echo ✓ Python detected

REM Create virtual environment
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    echo ✓ Virtual environment created
)

REM Activate venv
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt --quiet
echo ✓ Dependencies installed

REM Start server
echo.
echo ============================================
echo ✓ Setup Complete!
echo ============================================
echo.
echo 🚀 Starting ProCRM Backend...
echo    Backend: http://localhost:5001
echo    Frontend: http://localhost:8081
echo.
echo In another terminal run:
echo    python -m http.server 8081
echo.

python app.py
