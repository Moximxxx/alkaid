@echo off
chcp 65001 >nul
echo [摇光] Installing dependencies...
bun install
if %errorlevel% neq 0 (
    echo [Error] Failed to install dependencies
    exit /b 1
)
echo [摇光] Starting Vite dev server and Electron...
bun run dev:electron
