#!/bin/bash
# workflow-integrity-check.sh — 工作流完整性验证
# 检查合同字段是否完整（trace_id/constraints/verification/coverage_checklist 非空）
# 退出码: 0=PASS, 2=WARN
# 作为 task-executor 的 pre_task 钩子

# 找到当前 active 合同
# 获取最新合同文件（ls -t 在 Git Bash 下工作，添加 find fallback）
CONTRACT_FILE=$(find .opencode/contracts -name "*.json" ! -name "contract-schema.json" -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)
if [ -z "$CONTRACT_FILE" ]; then
  # fallback: 直接用 find 拿第一个
  CONTRACT_FILE=$(find .opencode/contracts -name "*.json" ! -name "contract-schema.json" -print0 2>/dev/null | head -1 | tr -d '\0')
fi

if [ -z "$CONTRACT_FILE" ]; then
  echo "RESULT: WARN (no active contract found)"
  exit 2
fi

ISSUES=0

# 验证 trace_id
if ! grep -q '"trace_id"[[:space:]]*:[[:space:]]*"[a-f0-9]\{8\}-[a-f0-9]\{4\}-[a-f0-9]\{4\}-[a-f0-9]\{4\}-[a-f0-9]\{12\}"' "$CONTRACT_FILE"; then
  echo "[WARN] $CONTRACT_FILE: trace_id missing or not UUID format"
  ISSUES=$((ISSUES + 1))
fi

# 验证 constraints 非空数组
if ! grep -q '"constraints"[[:space:]]*:[[:space:]]*\[[[:space:]]*"[^"]' "$CONTRACT_FILE"; then
  echo "[WARN] $CONTRACT_FILE: constraints is empty"
  ISSUES=$((ISSUES + 1))
fi

# 验证 verification 非空数组
if ! grep -q '"verification"[[:space:]]*:[[:space:]]*\[[[:space:]]*"[^"]' "$CONTRACT_FILE"; then
  echo "[WARN] $CONTRACT_FILE: verification is empty"
  ISSUES=$((ISSUES + 1))
fi

# 验证 coverage_checklist 非空对象
if grep -q '"coverage_checklist"[[:space:]]*:[[:space:]]*{' "$CONTRACT_FILE"; then
  CHECKLIST_EMPTY=$(grep -A 50 '"coverage_checklist"' "$CONTRACT_FILE" | grep -c '"assert:')
  if [ "$CHECKLIST_EMPTY" -eq 0 ]; then
    echo "[WARN] $CONTRACT_FILE: coverage_checklist has no assert entries"
    ISSUES=$((ISSUES + 1))
  fi
else
  echo "[WARN] $CONTRACT_FILE: coverage_checklist missing"
  ISSUES=$((ISSUES + 1))
fi

if [ "$ISSUES" -gt 0 ]; then
  echo "RESULT: WARN ($ISSUES integrity issue(s) found)"
  exit 2
fi

echo "RESULT: PASS (contract integrity verified)"
exit 0
