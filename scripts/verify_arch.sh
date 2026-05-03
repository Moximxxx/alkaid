#!/bin/bash
# verify_arch.sh — 架构规则验证脚本
# 检查代码变更是否违反架构约束
# 用法: bash scripts/verify_arch.sh [变更文件...]

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ERRORS=0

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error() { echo -e "${RED}[ERROR]${NC} $1"; ERRORS=$((ERRORS + 1)); }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
pass()  { echo -e "${GREEN}[PASS]${NC} $1"; }

echo "=== 架构规则验证 ==="
echo ""

# ---- 检查 1: 合同文件存在性验证 ----
echo "--- 检查任务合同文件 ---"

CONTRACT_DIR=""
for tool_dir in ".codex" ".qoder" ".claude" ".opencode"; do
    if [ -d "$PROJECT_ROOT/$tool_dir/contracts" ]; then
        CONTRACT_DIR="$PROJECT_ROOT/$tool_dir/contracts"
        break
    fi
done

if [ -z "$CONTRACT_DIR" ]; then
    CONTRACT_DIR="$PROJECT_ROOT/.codex/contracts"
fi

if [ -d "$CONTRACT_DIR" ] && [ -n "$(ls -A "$CONTRACT_DIR" 2>/dev/null)" ]; then
    LATEST_CONTRACT=$(ls -t "$CONTRACT_DIR"/*.json 2>/dev/null | head -1)
    if [ -n "$LATEST_CONTRACT" ]; then
        CONTRACT_TIME=$(stat -c %Y "$LATEST_CONTRACT" 2>/dev/null || echo 0)
        CURRENT_TIME=$(date +%s)
        AGE=$((CURRENT_TIME - CONTRACT_TIME))

        if [ "$AGE" -gt 1800 ]; then
            warn "合同已过期（超过30分钟）: $(basename "$LATEST_CONTRACT")"
        else
            pass "存在有效合同: $(basename "$LATEST_CONTRACT")"
        fi
    fi
else
    MODIFIED_SOURCE=$(git -C "$PROJECT_ROOT" diff --name-only 2>/dev/null | grep -E '\.(cpp|h|ets|ts|cmake)$' | head -5 || true)
    if [ -n "$MODIFIED_SOURCE" ]; then
        error "源码已修改但无任务合同"
        echo "$MODIFIED_SOURCE" | sed 's/^/  /'
    else
        pass "无源码修改，合同非必需"
    fi
fi
echo ""

# ---- 检查 2: NAPI 接口同步（如果存在 NAPI 文件）----
echo "--- 检查 NAPI 接口同步 ---"

NAPI_A=""
NAPI_B=""

for f in "texstudio/src/ohos_napi_entry.cpp" "texstudio/src/napi_entry.cpp"; do
    [ -f "$PROJECT_ROOT/$f" ] && NAPI_A="$PROJECT_ROOT/$f" && break
done

for f in "texstudio-hap/entry/src/main/cpp/napi_bridge.cpp" "texstudio-hap/entry/src/main/cpp/napi.cpp"; do
    [ -f "$PROJECT_ROOT/$f" ] && NAPI_B="$PROJECT_ROOT/$f" && break
done

if [ -n "$NAPI_A" ] && [ -n "$NAPI_B" ]; then
    FUNCS_A=$(grep -oP 'DECLARE_NAPI_FUNCTION\s*\(\s*"\K[^"]+' "$NAPI_A" 2>/dev/null | sort || true)
    FUNCS_B=$(grep -oP 'DECLARE_NAPI_FUNCTION\s*\(\s*"\K[^"]+' "$NAPI_B" 2>/dev/null | sort || true)

    if [ "$FUNCS_A" = "$FUNCS_B" ]; then
        pass "NAPI 接口同步: $(echo "$FUNCS_A" | wc -l) 个函数一致"
    else
        error "NAPI 接口不同步"
        comm -23 <(echo "$FUNCS_A") <(echo "$FUNCS_B") | sed 's/^/  A only: /'
        comm -13 <(echo "$FUNCS_A") <(echo "$FUNCS_B") | sed 's/^/  B only: /'
    fi
else
    warn "NAPI 文件不完整，跳过检查"
fi
echo ""

# ---- 检查 3: CMake 宏名与 #ifdef 使用一致性 ----
echo "--- 检查 CMake 宏名一致性 ---"

TEXSTUDIO_SRC="$PROJECT_ROOT/texstudio/src"
if [ -d "$TEXSTUDIO_SRC" ]; then
    # 提取 CMake 定义
    CMAKE_DEFINED=""
    for cmakefile in "$PROJECT_ROOT/texstudio/CMakeLists.txt" "$PROJECT_ROOT/miktex/CMakeLists.txt"; do
        [ -f "$cmakefile" ] && CMAKE_DEFINED="$CMAKE_DEFINED $(grep -oP '(?<=-D)[A-Z_][A-Z0-9_]*' "$cmakefile" 2>/dev/null || true)"
    done
    KNOWN_DEFINED="__OHOS__ $CMAKE_DEFINED"

    # 检查 #ifdef OHOS_* 但不在已知列表中的
    BAD_MACROS=$(grep -rohP '#ifdef\s+\K(OHOS_[A-Z_]+)' "$TEXSTUDIO_SRC" --include='*.cpp' --include='*.h' 2>/dev/null | sort -u || true)
    MISMATCH=""
    for macro in $BAD_MACROS; do
        if ! echo " $KNOWN_DEFINED " | grep -q " $macro "; then
            MISMATCH="$MISMATCH  $macro"
        fi
    done

    if [ -z "$MISMATCH" ]; then
        pass "CMake 宏名与 #ifdef 一致"
    else
        error "发现未定义的宏名:$MISMATCH"
    fi
else
    warn "texstudio/src 不存在，跳过宏名检查"
fi
echo ""

# ---- 检查 4: 禁止 posix_spawn（如果存在 OHOS 代码）----
echo "--- 检查 posix_spawn 使用 ---"

OHOS_DIR="$PROJECT_ROOT/texstudio/src/ohos"
if [ -d "$OHOS_DIR" ]; then
    SPAWN_USAGE=$(grep -rn 'posix_spawn' "$OHOS_DIR" 2>/dev/null || true)
    if [ -z "$SPAWN_USAGE" ]; then
        pass "OHOS 平台层未使用 posix_spawn"
    else
        error "OHOS 平台层使用了 posix_spawn（应改用 fork+exec）:"
        echo "$SPAWN_USAGE"
    fi
else
    warn "OHOS 平台目录不存在"
fi
echo ""

# ---- 检查 5: ArkTS 中禁止 console.log ----
echo "--- 检查 ArkTS console.log ---"

ETS_DIR="$PROJECT_ROOT/texstudio-hap/entry/src/main/ets"
if [ -d "$ETS_DIR" ]; then
    CONSOLE_LOG=$(grep -rn 'console\.log' "$ETS_DIR" 2>/dev/null || true)
    if [ -z "$CONSOLE_LOG" ]; then
        pass "ArkTS 代码无 console.log"
    else
        error "ArkTS 代码使用了 console.log（应改用 hilog）："
        echo "$CONSOLE_LOG"
    fi
else
    warn "ArkTS 目录不存在"
fi
echo ""

# ---- 检查 6: Worker 禁止 workerPort.close() ----
echo "--- 检查 Worker workerPort.close() ---"

if [ -d "$ETS_DIR" ]; then
    WORKER_CLOSE=$(grep -rn 'workerPort\.close\|worker\.terminate' "$ETS_DIR" 2>/dev/null || true)
    if [ -n "$WORKER_CLOSE" ]; then
        error "Worker 中调用了 workerPort.close()（会导致死锁）:"
        echo "$WORKER_CLOSE"
    else
        pass "Worker 未调用 workerPort.close()"
    fi
fi
echo ""

# ---- 检查 7: coverage_checklist 不允许 TODO ----
echo "--- 检查 coverage_checklist 完整性 ---"

if [ -d "$CONTRACT_DIR" ]; then
    TODO_ITEMS=""
    for contract in "$CONTRACT_DIR"/*.json; do
        [ -f "$contract" ] || continue
        TODOS=$(python3 -c "
import json, sys
try:
    with open('$contract') as f:
        d = json.load(f)
    checklist = d.get('coverage_checklist', {})
    todos = {k: v for k, v in checklist.items() if 'TODO' in v}
    if todos:
        print(', '.join(todos.keys()))
except: pass
" 2>/dev/null || true)
        [ -n "$TODOS" ] && TODO_ITEMS="$TODO_ITEMS  $(basename "$contract"): $TODOS"
    done

    if [ -z "$TODO_ITEMS" ]; then
        pass "coverage_checklist 无 TODO 项"
    else
        error "存在未覆盖的功能区域:$TODO_ITEMS"
    fi
fi
echo ""

# ---- 结果汇总 ----
echo "=== 验证结果 ==="
if [ "$ERRORS" -eq 0 ]; then
    pass "所有检查通过"
    exit 0
else
    error "共 $ERRORS 个错误需要修复"
    exit 1
fi
