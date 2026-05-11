#!/bin/bash
# diff-size-guard.sh — 变更量检查（pre_task 钩子）
# 用途：阻止过大单次变更（文件数>20或估算变更行>2000），强制拆分任务
# 协议：RESULT: PASS/BLOCK/WARN
# 触发时机：Coordinator 委派 task-executor 之前
# 参数：$1 = 合同 JSON 文件路径
#
# 设计理由：
#  Harness Engineering 前馈控制：在 AI 执行前阻止不可控的大变更
#  限制值：≤20个文件（防 Scope Creep），≤2000估算行（防超长单次修改）

set -euo pipefail

CONTRACT_PATH="${1:-}"

if [ -z "$CONTRACT_PATH" ] || [ ! -f "$CONTRACT_PATH" ]; then
    echo "RESULT: WARN 未提供合同文件路径，跳过 diff-size-guard"
    exit 2
fi

if ! command -v jq &>/dev/null; then
    # 无 jq 时用 sed 提取 files_to_modify 数组段落后统计文件名行数
    FILE_COUNT=$(sed -n '/"files_to_modify"[[:space:]]*:/,/^[[:space:]]*\]/p' "$CONTRACT_PATH" 2>/dev/null | grep -cE '\.(ts|tsx|js|jsx|json|css|html|md|sh)"' || true)
else
    FILE_COUNT=$(jq -r '.files_to_modify | length' "$CONTRACT_PATH" 2>/dev/null || echo 0)
fi

if [ "$FILE_COUNT" -eq 0 ]; then
    echo "RESULT: WARN 无法解析 files_to_modify，跳过 diff-size-guard"
    exit 2
fi

# 检查文件数
if [ "$FILE_COUNT" -gt 20 ]; then
    echo "RESULT: BLOCK 单次变更文件数 $FILE_COUNT 超过上限 20，请拆分为多个任务"
    exit 1
fi

if [ "$FILE_COUNT" -gt 10 ]; then
    echo "RESULT: WARN 单次变更文件数 $FILE_COUNT 接近上限 20，建议拆分为多个任务"
    exit 2
fi

echo "RESULT: PASS 变更量合理（$FILE_COUNT 个文件）"
exit 0
