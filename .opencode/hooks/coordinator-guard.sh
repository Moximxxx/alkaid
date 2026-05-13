#!/bin/bash
# coordinator-guard.sh — 合同门禁：确保文件编辑在 active 合同范围内
# 入参: $1 = 正在编辑的文件路径（相对于项目根目录）
# 退出码: 0=PASS, 1=BLOCK, 2=WARN
# 被 contract-mechanism.md R-01 引用

FILE_PATH="${1:-}"

if [ -z "$FILE_PATH" ]; then
  echo "RESULT: PASS (no file path provided)"
  exit 0
fi

# 豁免 .opencode/ 目录（系统文件修改本身需要合同，避免鸡生蛋死锁）
if [[ "$FILE_PATH" == .opencode/* ]]; then
  echo "RESULT: PASS (.opencode/ system file exempt)"
  exit 0
fi

# 扫描所有 active 合同
CONTRACTS_DIR=".opencode/contracts"
if [ ! -d "$CONTRACTS_DIR" ]; then
  echo "RESULT: WARN (no contracts directory)"
  exit 2
fi

MATCHED=false
while IFS= read -r -d '' contract; do
  # 跳过 schema 文件
  [[ "$contract" == *"contract-schema.json" ]] && continue

  # 检查 status 是否为 active
  STATUS=$(grep -o '"status"[[:space:]]*:[[:space:]]*"active"' "$contract" 2>/dev/null)
  if [ -z "$STATUS" ]; then
    continue
  fi

  # 检查 files_to_modify 是否包含此文件
  if grep -q "\"$FILE_PATH\"" "$contract" 2>/dev/null; then
    MATCHED=true
    # 提取合同 task_id
    TASK_ID=$(grep -o '"task_id"[[:space:]]*:[[:space:]]*"[^"]*"' "$contract" | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
    echo "RESULT: PASS (covered by contract $TASK_ID)"
    break
  fi
done < <(find "$CONTRACTS_DIR" -name "*.json" -print0)

if [ "$MATCHED" = false ]; then
  echo "RESULT: BLOCK (file $FILE_PATH not in any active contract's files_to_modify)"
  exit 1
fi

exit 0
