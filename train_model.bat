@echo off
echo ============================================
echo   PhishGuard AI - Train ML Model
echo ============================================
echo.

cd /d "%~dp0machine_learning"

echo [1/2] Installing Python dependencies...
pip install -r ..\requirements.txt -q

echo [2/2] Training models (this may take 1-2 minutes)...
echo.

set PYTHONIOENCODING=utf-8
python train_model.py

echo.
echo Model training complete! Check machine_learning\ for .pkl files.
pause
