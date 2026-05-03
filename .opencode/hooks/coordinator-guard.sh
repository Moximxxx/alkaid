#!/bin/bash
# coordinator-guard.sh — 源码修改必须先有合同
# 在 Edit/Write 操作前检查是否存在有效的任务合同

set -euo pipefail

TOOL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_ROOT="$(cd "$TOOL_DIR/.." && pwd)"
CONTRACT_DIR="$TOOL_DIR/contracts"

# 如果不是源码文件，放行
if [[ "$*" != *".cpp"* && "$*" != *".h"* && "$*" != *".ets"* && "$*" != *".ts"* && "$*" != *"CMakeLists.txt"* ]]; then
    exit 0
fi

# 如果没有 contracts 目录，放行（可能是全新项目还未初始化 harness）
if [ ! -d "$CONTRACT_DIR" ]; then
    exit 0
fi

# 查找最新的合同文件
LATEST_CONTRACT=$(ls -t "$CONTRACT_DIR"/*.json 2>/dev/null | head -1)

if [ -z "$LATEST_CONTRACT" ]; then
    echo "=========================================="
    echo "BLOCKED: 修改源码需要先创建任务合同"
    echo ""
    echo "请先调用 coordinator agent 生成任务合同"
    echo "或手动创建 $CONTRACT_DIR/{timestamp}_{task_id}.json"
    echo "=========================================="
    exit 1
fi

# 检查合同是否过期（30分钟 = 1800秒）
CONTRACT_TIME=$(stat -c %Y "$LATEST_CONTRACT" 2>/dev/null || echo 0)
CURRENT_TIME=$(date +%s)
AGE=$((CURRENT_TIME - CONTRACT_TIME))

if [ "$AGE" -gt 1800 ]; then
    echo "=========================================="
    echo "BLOCKED: 任务合同已过期（超过30分钟）"
    echo ""
    echo "请重新调用 coordinator agent 更新合同"
    echo "或创建新的任务合同"
    echo "=========================================="
    exit 1
fi

# 合同有效，放行
exit 0
