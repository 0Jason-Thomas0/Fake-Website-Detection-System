@echo off
echo ============================================
echo   PhishGuard AI - Starting Backend API
echo ============================================
echo.

cd /d "%~dp0backend"

echo [1/2] Checking Python dependencies...
pip install -r ..\requirements.txt -q

echo [2/2] Starting Flask API on http://localhost:5000
echo.
echo Press Ctrl+C to stop the server.
echo.

set PYTHONIOENCODING=utf-8
python app.py

pause
