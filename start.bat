@echo off
cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    echo Please install Node.js v18+ from https://nodejs.org
    pause
    exit /b 1
)

node launcher.js

if %errorlevel% neq 0 (
    echo.
    echo Launch failed. See error above.
    pause
)
