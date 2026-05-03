@echo off
echo [摇光] 设置 Electrobun Resources...
if not exist "node_modules\electrobun\dist\api\Resources" mkdir "node_modules\electrobun\dist\api\Resources"
copy /Y "Resources\version.json" "node_modules\electrobun\dist\api\Resources\version.json" >nul
if %errorlevel% neq 0 (
    echo [错误] 复制 version.json 失败
    exit /b 1
)
echo [摇光] Resources 设置完成
echo [摇光] 启动 Electrobun...
bun run --bun src/main/electrobun.ts
