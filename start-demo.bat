@echo off
REM ============================================================
REM  ShramSetu — start the whole app.
REM  Opens two windows: the backend and the frontend.
REM  Run setup-windows.bat once before using this.
REM ============================================================

echo Opening the backend window...
start "ShramSetu backend" "%~dp0run-backend.bat"

REM Give Flask a few seconds to claim port 5000 before React loads
REM and tries to call it.
timeout /t 4 /nobreak >nul

echo Opening the frontend window...
start "ShramSetu frontend" "%~dp0run-frontend.bat"

echo.
echo Both windows are starting. The browser opens by itself at
echo http://localhost:5173 — give it about ten seconds.
echo.
echo Closing either of those two windows stops that part of the app.
timeout /t 6 /nobreak >nul
