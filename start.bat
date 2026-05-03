@echo off
chcp 65001 >nul
echo [摇光] 安装依赖...
bun install
if %errorlevel% neq 0 (
    echo [错误] 安装依赖失败
    exit /b 1
)
echo [摇光] 启动 Vite 开发服务器和 Electrobun...
start /B bun run dev
timeout /t 5 /nobreak >nul
bun start
