#!/bin/bash
# napi-sync-check.sh — NAPI 双文件注册同步检查
# 在修改 NAPI 接口后验证双文件注册一致性

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# 查找 NAPI 文件
NAPI_ENTRY_A=""
NAPI_ENTRY_B=""

# 常见的 NAPI 入口文件命名
for pattern in "ohos_napi_entry.cpp" "napi_entry.cpp" "native_napi_entry.cpp"; do
    if [ -f "$PROJECT_ROOT/texstudio/src/$pattern" ]; then
        NAPI_ENTRY_A="$PROJECT_ROOT/texstudio/src/$pattern"
        break
    fi
done

for pattern in "napi_bridge.cpp" "napi_impl.cpp" "native_bridge.cpp"; do
    if [ -f "$PROJECT_ROOT/texstudio-hap/entry/src/main/cpp/$pattern" ]; then
        NAPI_ENTRY_B="$PROJECT_ROOT/texstudio-hap/entry/src/main/cpp/$pattern"
        break
    fi
done

# 如果只有一个 NAPI 文件，跳过检查
if [ -z "$NAPI_ENTRY_A" ] && [ -z "$NAPI_ENTRY_B" ]; then
    exit 0
fi

if [ -z "$NAPI_ENTRY_A" ] || [ -z "$NAPI_ENTRY_B" ]; then
    echo "=========================================="
    echo "WARNING: 只找到一个 NAPI 文件，可能遗漏了双文件注册"
    echo "=========================================="
    exit 0
fi

# 提取两个文件中的 NAPI 函数
FUNCS_A=$(grep -oP 'DECLARE_NAPI_FUNCTION\s*\(\s*"\K[^"]+' "$NAPI_ENTRY_A" 2>/dev/null | sort || true)
FUNCS_B=$(grep -oP 'DECLARE_NAPI_FUNCTION\s*\(\s*"\K[^"]+' "$NAPI_ENTRY_B" 2>/dev/null | sort || true)

if [ "$FUNCS_A" = "$FUNCS_B" ]; then
    echo "NAPI 接口同步检查通过: $(echo "$FUNCS_A" | wc -l) 个函数"
    exit 0
else
    echo "=========================================="
    echo "ERROR: NAPI 接口不同步"
    echo ""
    echo "--- 只在 A 中存在 ---"
    comm -23 <(echo "$FUNCS_A") <(echo "$FUNCS_B") || true
    echo ""
    echo "--- 只在 B 中存在 ---"
    comm -13 <(echo "$FUNCS_A") <(echo "$FUNCS_B") || true
    echo "=========================================="
    exit 1
fi
