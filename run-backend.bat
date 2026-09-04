@echo off
REM Starts the Flask API on http://localhost:5000
REM Leave this window open while you use the app.

cd /d "%~dp0backend"

if not exist venv\Scripts\activate.bat (
  echo.
  echo The Python virtual environment is missing.
  echo Run setup-windows.bat first.
  pause
  exit /b 1
)

call venv\Scripts\activate.bat
echo Starting the ShramSetu backend on http://localhost:5000
echo Press Ctrl+C to stop it.
echo.
python app.py
pause
