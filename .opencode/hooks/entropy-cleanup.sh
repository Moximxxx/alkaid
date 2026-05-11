#!/bin/bash
# entropy-cleanup.sh — 熵治理清理（post_task 钩子）
# 用途：清理临时文件、过期追踪记录、空目录，对抗系统熵增
# 协议：RESULT: PASS/WARN
# 触发时机：task-executor 返回后
#
# 设计理由（Harness Engineering 熵治理）：
#  AI Agent 工作流会不断产生临时文件、状态快照、构建产物。
#  熵治理支柱要求定期清理以避免系统混乱。

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLEANED_COUNT=0
CLEANED_SIZE=""
WARNINGS=""

# ---- 清理 1: .opencode/tmp/ 中超过1小时的临时文件 ----
TMP_DIR="$PROJECT_ROOT/.opencode/tmp"
if [ -d "$TMP_DIR" ]; then
    # 查找超过1小时的文件
    STALE_FILES=$(find "$TMP_DIR" -type f -mmin +60 2>/dev/null || true)
    if [ -n "$STALE_FILES" ]; then
        FILE_COUNT=$(echo "$STALE_FILES" | wc -l)
        # 计算总大小（兼容 macOS/Linux）
        if command -v du &>/dev/null; then
            TOTAL_SIZE=$(echo "$STALE_FILES" | xargs du -ch 2>/dev/null | tail -1 | awk '{print $1}')
        else
            TOTAL_SIZE="未知"
        fi
        echo "$STALE_FILES" | xargs rm -f 2>/dev/null || WARNINGS="$WARNINGS\n  tmp/ 部分文件删除失败"
        CLEANED_COUNT=$((CLEANED_COUNT + FILE_COUNT))
        CLEANED_SIZE="$TOTAL_SIZE"
    fi
fi

# ---- 清理 2: .opencode/traces/ 中超过24小时的追踪记录 ----
TRACES_DIR="$PROJECT_ROOT/.opencode/traces"
if [ -d "$TRACES_DIR" ]; then
    STALE_TRACES=$(find "$TRACES_DIR" -type f -mmin +1440 2>/dev/null || true)
    if [ -n "$STALE_TRACES" ]; then
        TRACE_COUNT=$(echo "$STALE_TRACES" | wc -l)
        echo "$STALE_TRACES" | xargs rm -f 2>/dev/null || WARNINGS="$WARNINGS\n  traces/ 部分文件删除失败"
        CLEANED_COUNT=$((CLEANED_COUNT + TRACE_COUNT))
    fi
fi

# ---- 清理 3: 清空空目录 ----
EMPTY_DIRS=$(find "$PROJECT_ROOT/.opencode" -type d -empty 2>/dev/null || true)
if [ -n "$EMPTY_DIRS" ]; then
    # 只删除 tmp 和 traces 下的空目录，不删 contracts/ 等
    CLEANED_EMPTY=$(echo "$EMPTY_DIRS" | grep -E '(tmp|traces)' 2>/dev/null || true)
    if [ -n "$CLEANED_EMPTY" ]; then
        echo "$CLEANED_EMPTY" | xargs rmdir 2>/dev/null || true
    fi
fi

# ---- 输出结果 ----
if [ "$CLEANED_COUNT" -gt 0 ]; then
    if [ -n "$WARNINGS" ]; then
        echo -e "RESULT: WARN 清理 $CLEANED_COUNT 项（$CLEANED_SIZE），但存在清理失败:$WARNINGS"
    else
        echo "RESULT: WARN 清理完成，共清理 $CLEANED_COUNT 项（$CLEANED_SIZE）"
    fi
    exit 2
else
    echo "RESULT: PASS 无需清理"
    exit 0
fi
