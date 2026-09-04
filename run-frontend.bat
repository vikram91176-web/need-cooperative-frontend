@echo off
REM Starts the React app on http://localhost:5173
REM Leave this window open while you use the app.

cd /d "%~dp0frontend"

if not exist node_modules (
  echo.
  echo JavaScript packages are missing.
  echo Run setup-windows.bat first.
  pause
  exit /b 1
)

echo Starting the ShramSetu frontend on http://localhost:5173
echo Press Ctrl+C to stop it.
echo.
call npm run dev
pause
