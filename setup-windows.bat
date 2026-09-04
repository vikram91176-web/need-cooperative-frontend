@echo off
REM ============================================================
REM  ShramSetu — one-time setup for Windows.
REM  Double-click this once. It installs everything and fills
REM  the database with demo data. Needs internet.
REM ============================================================

echo.
echo ===== ShramSetu setup (this takes a few minutes) =====
echo.

REM %~dp0 is the folder this .bat file lives in, so the script
REM works no matter where you copied the project.
cd /d "%~dp0backend"

echo [1/5] Creating the Python virtual environment...
python -m venv venv
if errorlevel 1 (
  echo.
  echo ERROR: Python was not found.
  echo Install Python from python.org and tick "Add python.exe to PATH".
  pause
  exit /b 1
)

echo [2/5] Installing Python packages...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
  echo.
  echo ERROR: pip install failed. Check your internet connection.
  pause
  exit /b 1
)

echo [3/5] Creating the .env file...
if not exist .env copy .env.example .env

echo [4/5] Filling the database with demo data...
python seed.py

echo [5/5] Installing JavaScript packages...
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 (
  echo.
  echo ERROR: npm install failed.
  echo Install Node.js from nodejs.org, then run this file again.
  pause
  exit /b 1
)

echo.
echo ===== Setup finished =====
echo Now double-click start-demo.bat to run the app.
echo.
pause
