#!/bin/bash
# workspace-clean.sh — 工作区洁净检查（pre_task 钩子）
# 用途：任务执行前检查 git status，防止在脏工作区上修改
# 协议：RESULT: PASS/BLOCK/WARN
# 触发时机：Coordinator 委派 task-executor 之前
#
# 注意：源码变更指 .ts/.tsx/.js/.jsx/.json 文件的修改
#       非源码变更（dist/、node_modules/、.opencode/tmp/）忽略
#
# retry(0): 根据 @R-10 规划，这是对 Builder 构建前洁净检查的前置强化
# 不阻断：有未提交变更时只输出 WARN 不 BLOCK（因为可能是在已有改动上增量工作）

set -euo pipefail

GIT_STATUS=$(git status --porcelain 2>/dev/null || echo "")
if [ -z "$GIT_STATUS" ]; then
    echo "RESULT: PASS 工作区洁净，无未提交变更"
    exit 0
fi

SRC_CHANGES=$(echo "$GIT_STATUS" | grep -E '\.(ts|tsx|js|jsx|json)$' || true)
if [ -z "$SRC_CHANGES" ]; then
    echo "RESULT: PASS 仅有非源码变更（如 dist/、node_modules/ 等）"
    exit 0
fi

CHANGED_COUNT=$(echo "$SRC_CHANGES" | wc -l)
FILE_LIST=$(echo "$SRC_CHANGES" | head -10 | sed 's/^/  /')
if [ "$CHANGED_COUNT" -gt 10 ]; then
    FILE_LIST="$FILE_LIST\n  ... 以及 $((CHANGED_COUNT - 10)) 个更多变更"
fi

echo "RESULT: WARN 工作区有 $CHANGED_COUNT 个未提交的源码变更，建议先提交或 stash"
echo "$FILE_LIST"
exit 2
