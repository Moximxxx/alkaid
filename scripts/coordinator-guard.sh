#!/bin/bash
# coordinator-guard.sh - 工作流守卫脚本
# 检查操作是否经过正确的委派流程

set -e

CONTRACT_FILE="/tmp/opencode/.active_contract"
CONTRACT_TIMEOUT=1800  # 30分钟

check_contract() {
    if [ ! -f "$CONTRACT_FILE" ]; then
        echo "BLOCKED: No active contract found. Please request a task from Coordinator."
        exit 1
    fi

    local file_age=$(($(date +%s) - $(stat -c %Y "$CONTRACT_FILE" 2>/dev/null || echo 0)))
    if [ "$file_age" -gt "$CONTRACT_TIMEOUT" ]; then
        echo "BLOCKED: Contract expired (${file_age}s > ${CONTRACT_TIMEOUT}s). Please request a new task."
        exit 1
    fi

    echo "ALLOWED"
}

check_retro() {
    local retro_flag="/tmp/opencode/.retro_required"
    if [ -f "$retro_flag" ]; then
        echo "BLOCKED: Previous task requires Retro review. Run 'bash scripts/retro-scaffold.sh' first."
        return 1
    fi
}

check_contract
check_retro
