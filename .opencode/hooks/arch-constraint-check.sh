#!/bin/bash
# arch-constraint-check.sh — 架构约束检查（post_task 钩子）
# 用途：检查已修改文件是否违反三层架构依赖规则，捕获分层违规
# 协议：RESULT: PASS/BLOCK/WARN
# 触发时机：task-executor 返回后，进入 code-review 之前
# 参数：$@ = 修改的文件列表（空格分隔）
#
# 检查内容：
#  1. src/renderer/ 文件禁止直接引用 fs/process/path/require('electron')
#  2. src/main/ 文件禁止直接引用 renderer 模块
#  3. 禁用 any 类型泄漏（检测新增的 :any）

set -euo pipefail

FILES=("$@")
VIOLATIONS=""

if [ ${#FILES[@]} -eq 0 ]; then
    echo "RESULT: WARN 未提供文件列表，跳过 arch-constraint-check"
    exit 2
fi

for FILE in "${FILES[@]}"; do
    # 只检查 TypeScript 源文件
    case "$FILE" in
        src/renderer/*.ts|src/renderer/*.tsx)
            # 检查 Node.js API 引用
            if grep -qE "require\(['\"]fs['\"]|from ['\"]fs['\"]" "$FILE" 2>/dev/null; then
                VIOLATIONS="$VIOLATIONS\n  [分层违规] $FILE 直接引用了 fs 模块（应通过 IPC）"
            fi
            if grep -qE '\bprocess\.' "$FILE" 2>/dev/null && ! grep -qE 'process\.env' "$FILE" 2>/dev/null; then
                VIOLATIONS="$VIOLATIONS\n  [分层违规] $FILE 直接使用了 process 全局（应使用 window 环境）"
            fi
            if grep -qE "require\(['\"]path['\"]|from ['\"]path['\"]" "$FILE" 2>/dev/null; then
                VIOLATIONS="$VIOLATIONS\n  [分层违规] $FILE 直接引用了 path 模块（应通过 IPC）"
            fi
            if grep -qE "require\(['\"]electron['\"]\)" "$FILE" 2>/dev/null; then
                VIOLATIONS="$VIOLATIONS\n  [分层违规] $FILE require('electron')（应使用 window.electronAPI）"
            fi
            ;;
        src/main/*.ts)
            # 检查 main 进程引用 renderer
            if grep -qE "renderer|\.tsx" "$FILE" 2>/dev/null | grep -v '__tests__' | grep -v '//.*renderer' > /dev/null 2>&1; then
                VIOLATIONS="$VIOLATIONS\n  [分层违规] $FILE 可能引用了 renderer 模块"
            fi
            ;;
    esac

    # 通用：检查新增的 :any（禁止 any 类型）
    if grep -E ':\s*any' "$FILE" 2>/dev/null | grep -v '// eslint-disable\|// prettier-ignore' > /dev/null 2>&1; then
        VIOLATIONS="$VIOLATIONS\n  [类型违规] $FILE 包含 :any 类型（应使用 unknown 或具体类型）"
    fi
done

if [ -n "$VIOLATIONS" ]; then
    echo "RESULT: BLOCK 架构约束检查未通过:$VIOLATIONS"
    exit 1
fi

echo "RESULT: PASS 架构约束检查通过（${#FILES[@]} 个文件）"
exit 0
