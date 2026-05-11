#!/bin/bash
# verify_arch.sh — 架构规则验证脚本
# 用于 Electron + React + TypeScript 项目的架构约束验证
# 用法: bash .opencode/scripts/verify_arch.sh

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Windows 路径兼容：将 Cygwin/MSYS2/Git Bash / WSL 路径转为 Windows 格式
case "$PROJECT_ROOT" in
  /cygdrive/*|/mnt/*)
    if command -v cygpath &>/dev/null; then
      PROJECT_ROOT=$(cygpath -w "$PROJECT_ROOT")
    elif [[ "$PROJECT_ROOT" == /mnt/* ]]; then
      # WSL: /mnt/d/... → D:/...
      PROJECT_ROOT="/${PROJECT_ROOT#/mnt/}"
      PROJECT_ROOT="${PROJECT_ROOT:0:1}:${PROJECT_ROOT:1}"
    fi
    # 将反斜杠转为正斜杠以兼容 bash
    PROJECT_ROOT="${PROJECT_ROOT//\\//}"
    ;;
esac

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

# ---- 检查 1: 合同文件有效性 ----
echo "--- 检查 1: 合同文件有效性 ---"

# 查找最新合同（支持按日期分目录结构）
CONTRACT_FILE=""
for dir in "$PROJECT_ROOT/.opencode/contracts"/*/; do
    if [ -d "$dir" ]; then
        FOUND=$(find "$dir" -name '*.json' -maxdepth 1 2>/dev/null | sort | tail -1)
        if [ -n "$FOUND" ]; then
            CONTRACT_FILE="$FOUND"
        fi
    fi
done

# 也检查 contracts/ 根目录
ROOT_CONTRACT=$(find "$PROJECT_ROOT/.opencode/contracts" -maxdepth 1 -name '*.json' 2>/dev/null | sort | tail -1)
if [ -n "$ROOT_CONTRACT" ]; then
    if [ -z "$CONTRACT_FILE" ] || [ "$ROOT_CONTRACT" -nt "$CONTRACT_FILE" ] 2>/dev/null; then
        CONTRACT_FILE="$ROOT_CONTRACT"
    fi
fi

if [ -n "$CONTRACT_FILE" ]; then
    # 检查过期（30分钟 = 1800秒）
    if command -v stat &>/dev/null; then
        if date -d "@$(stat -c %Y "$CONTRACT_FILE" 2>/dev/null)" &>/dev/null; then
            CONTRACT_TIME=$(stat -c %Y "$CONTRACT_FILE" 2>/dev/null)
        else
            CONTRACT_TIME=$(stat -f %m "$CONTRACT_FILE" 2>/dev/null || echo 0)
        fi
        CURRENT_TIME=$(date +%s)
        AGE=$((CURRENT_TIME - CONTRACT_TIME))

        if [ "$AGE" -gt 1800 ]; then
            warn "合同已过期（超过30分钟）: $(basename "$CONTRACT_FILE")"
        else
            pass "存在有效合同: $(basename "$CONTRACT_FILE")（${AGE}秒前）"
        fi
    else
        pass "存在合同文件: $(basename "$CONTRACT_FILE")（跳过时效检查）"
    fi
else
    # 无合同，检查是否有代码变更
    MODIFIED_SOURCE=$(git -C "$PROJECT_ROOT" diff --name-only 2>/dev/null | grep -E '\.(ts|tsx|js|jsx|json)$' | head -5 || true)
    if [ -n "$MODIFIED_SOURCE" ]; then
        warn "源码已修改但无任务合同"
        echo "$MODIFIED_SOURCE" | sed 's/^/  /'
    else
        pass "无源码修改，合同非必需"
    fi
fi
echo ""

# ---- 检查 2: 三层架构约束（Arch-layering）----
echo "--- 检查 2: 三层架构约束（Arch-layering）---"

RENDERER_DIR="$PROJECT_ROOT/src/renderer"
MAIN_DIR="$PROJECT_ROOT/src/main"
LAYERING_ERROR=0

# 2a: 检查 src/renderer/ 中是否直接调用了 Node.js API
if [ -d "$RENDERER_DIR" ]; then
    # 检查 fs 模块
    FS_USAGE=$(grep -rn "require(['\"]fs['\"]\|from ['\"]fs['\"]\|import\(\s\)\?[\s*{]\?.*\bfs\b" "$RENDERER_DIR" --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v '__tests__' | grep -v 'node_modules' || true)
    # 检查 process 全局
    PROCESS_USAGE=$(grep -rn '\bprocess\.' "$RENDERER_DIR" --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v '__tests__' | grep -v 'node_modules' | grep -v 'process\.env' || true)
    # 检查 path 模块
    PATH_USAGE=$(grep -rn "require(['\"]path['\"]\|from ['\"]path['\"]\|import\(\s\)\?[\s*{]\?.*\bpath\b" "$RENDERER_DIR" --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v '__tests__' | grep -v 'node_modules' || true)
    # 检查直接 require electron
    ELECTRON_REQUIRE=$(grep -rn "require(['\"]electron['\"])\|from ['\"]electron['\"]" "$RENDERER_DIR" --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v '__tests__' | grep -v 'node_modules' || true)

    RENDERER_VIOLATIONS=""
    [ -n "$FS_USAGE" ] && RENDERER_VIOLATIONS="$RENDERER_VIOLATIONS  fs 模块（应通过 IPC 调用 main 进程）"
    [ -n "$PROCESS_USAGE" ] && RENDERER_VIOLATIONS="$RENDERER_VIOLATIONS  process 全局（渲染进程应使用 window 环境）"
    [ -n "$PATH_USAGE" ] && RENDERER_VIOLATIONS="$RENDERER_VIOLATIONS  path 模块（应通过 IPC 调用 main 进程）"
    [ -n "$ELECTRON_REQUIRE" ] && RENDERER_VIOLATIONS="$RENDERER_VIOLATIONS  require('electron')（应使用 window.electronAPI）"

    if [ -n "$RENDERER_VIOLATIONS" ]; then
        error "Layer 3（renderer）直接调用了 Layer 1（运行时）API:$RENDERER_VIOLATIONS"
        LAYERING_ERROR=1
    else
        pass "Layer 3（renderer）未直接调用 Node.js API"
    fi
else
    warn "renderer 目录不存在，跳过检查"
fi

# 2b: 检查 src/main/ 中是否直接引用了 renderer 的模块
if [ -d "$MAIN_DIR" ]; then
    MAIN_TO_RENDERER=$(grep -rnE "renderer|\.tsx" "$MAIN_DIR" --include='*.ts' 2>/dev/null | grep -v '__tests__' | grep -v 'node_modules' | grep -v '//.*renderer' || true)
    if [ -n "$MAIN_TO_RENDERER" ]; then
        error "Layer 2（main）直接引用了 Layer 3（renderer）模块"
        echo "$MAIN_TO_RENDERER" | head -5 | sed 's/^/  /'
        LAYERING_ERROR=1
    else
        pass "Layer 2（main）未直接引用 renderer 模块"
    fi
else
    warn "main 目录不存在，跳过检查"
fi

echo ""

# ---- 检查 3: coverage_checklist 完整性 ----
echo "--- 检查 3: coverage_checklist 完整性 ---"

if [ -d "$PROJECT_ROOT/.opencode/contracts" ]; then
    TODO_ITEMS=""
    # 在根目录和日期子目录中查找合同
    for contract in $(find "$PROJECT_ROOT/.opencode/contracts" -name '*.json' -not -name 'contract-schema.json' 2>/dev/null); do
        if [ -f "$contract" ]; then
            # 使用 grep 检查 coverage_checklist 中是否包含 TODO
            if grep -q '"coverage_checklist"' "$contract" 2>/dev/null; then
                TODOS=$(grep -oE '"[^"]+":[[:space:]]*"TODO[^"]*"' "$contract" 2>/dev/null || true)
                if [ -n "$TODOS" ]; then
                    TODO_ITEMS="$TODO_ITEMS  $(basename "$contract"): $TODOS"
                fi
            fi
        fi
    done

    if [ -z "$TODO_ITEMS" ]; then
        pass "coverage_checklist 无 TODO 项"
    else
        error "存在未覆盖的功能区域:$TODO_ITEMS"
    fi
else
    warn "contracts 目录不存在，跳过 coverage_checklist 检查"
fi
echo ""

# ---- 检查 4: P-01 模型列表一致性 ----
echo "--- 检查 4: P-01 模型列表一致性 ---"

WELCOME_FILE="$PROJECT_ROOT/src/renderer/pages/Welcome.tsx"
SETTINGS_FILE="$PROJECT_ROOT/src/renderer/pages/Settings.tsx"
CONSTANTS_FILE="$PROJECT_ROOT/src/shared/constants.ts"

P01_ERROR=0

if [ -f "$WELCOME_FILE" ] && [ -f "$SETTINGS_FILE" ] && [ -f "$CONSTANTS_FILE" ]; then
    # 统计各文件中 value: 定义的数量（模型条目）
    WELCOME_COUNT=$(grep -c 'value:\s*"' "$WELCOME_FILE" 2>/dev/null || echo 0)
    SETTINGS_COUNT=$(grep -c 'value:\s*"' "$SETTINGS_FILE" 2>/dev/null || echo 0)
    CONSTANTS_COUNT=$(grep -c 'value:\s*"' "$CONSTANTS_FILE" 2>/dev/null || echo 0)

    # Compare Welcome vs Settings (should match exactly since they share same definitions)
    if [ "$WELCOME_COUNT" -ne "$SETTINGS_COUNT" ]; then
        error "P-01: Welcome.tsx 与 Settings.tsx 模型数量不一致（Welcome:$WELCOME_COUNT vs Settings:$SETTINGS_COUNT）"
        P01_ERROR=1
    fi

    # Check that constants has reasonable coverage (at least as many as Welcome which covers rendered models)
    if [ "$CONSTANTS_COUNT" -lt "$WELCOME_COUNT" ] && [ "$P01_ERROR" -eq 0 ]; then
        # constants may have different model count; let's just warn
        warn "P-01: constants.ts 模型条目数（$CONSTANTS_COUNT）少于 Welcome.tsx（$WELCOME_COUNT），请确认是否故意"
    fi

    if [ "$P01_ERROR" -eq 0 ]; then
        pass "P-01: Welcome.tsx 与 Settings.tsx 模型一致（各 $WELCOME_COUNT 个）; constants.ts 含 $CONSTANTS_COUNT 个"
    fi
else
    warn "P-01: 关键文件不存在，跳过检查"
    for f in "$WELCOME_FILE" "$SETTINGS_FILE" "$CONSTANTS_FILE"; do
        [ ! -f "$f" ] && echo "  缺失: $f"
    done
fi
echo ""

# ---- 检查 5: 工作区洁净检查 ----
echo "--- 检查 5: 工作区洁净检查 ---"

GIT_STATUS=$(git -C "$PROJECT_ROOT" status --porcelain 2>/dev/null || true)
if [ -n "$GIT_STATUS" ]; then
    # 过滤出源码变更
    SRC_CHANGES=$(echo "$GIT_STATUS" | grep -E '\.(ts|tsx|js|jsx|json|css|html)$' || true)
    if [ -n "$SRC_CHANGES" ]; then
        CHANGED_FILES=$(echo "$SRC_CHANGES" | wc -l)
        warn "工作区有 $CHANGED_FILES 个未提交的源码变更"
        echo "$SRC_CHANGES" | head -10 | sed 's/^/  /'
        if [ "$CHANGED_FILES" -gt 10 ]; then
            echo "  ... 以及 $((CHANGED_FILES - 10)) 个更多变更"
        fi
    else
        pass "工作区洁净（无未提交的源码变更）"
    fi
else
    pass "工作区洁净"
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
