@echo off
echo ============================================
echo   PhishGuard AI - Starting Frontend
echo ============================================
echo.
echo Serving frontend at http://localhost:5173
echo.
echo NOTE: The frontend uses React via CDN.
echo       No npm install required!
echo.
echo Press Ctrl+C to stop.
echo.

cd /d "%~dp0frontend"
python -m http.server 5173

pause
