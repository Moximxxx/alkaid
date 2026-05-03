#!/bin/bash
# dual-check-hook.sh — 双重校验 Hook
# 版本: v2.0.0
# 更新: 2026-04-30
#
# 功能:
# 实现 Agent 自验 + 工具层独立校验的双重校验机制
# 当两次校验结果不一致时，提出质疑
#
# 用法:
#   dual-check-hook.sh <operation> <agent_verdict> [agent_reason]
#
# 校验流程:
#   1. Agent 自我验证并给出判断
#   2. Hook 独立执行相同验证
#   3. 比较两者结果
#   4. 一致 -> 放行
#   5. 不一致 -> 提出质疑
#
# 返回:
#   0 一致或质疑后确认
#   1 不一致且用户拒绝

set -euo pipefail

# ============================================================
# 配置
# ============================================================

readonly OPERATION="${1:-}"
readonly AGENT_VERDICT="${2:-pass}"
readonly AGENT_REASON="${3:-}"

# 校验类型
readonly CHECK_TYPES=(
  "syntax"
  "type"
  "lint"
  "test"
  "logic"
  "security"
  "format"
)

# ============================================================
# 函数
# ============================================================

# 打印校验结果
print_check_result() {
  local result="$1"
  local message="$2"

  echo ""
  echo "┌─────────────────────────────────────────────────────────────┐"
  echo "│  双重复验结果                                             │"
  echo "├─────────────────────────────────────────────────────────────┤"
  echo "│                                                             │"
  echo "│  操作: $OPERATION                                            │"
  echo "│  Agent 判断: $AGENT_VERDICT                                   │"
  echo "│  校验判断: $result                                              │"
  echo "│                                                             │"

  if [[ -n "$message" ]]; then
    echo "│  原因: $message                                              │"
  fi

  echo "└─────────────────────────────────────────────────────────────┘"
  echo ""
}

# 打印质疑
print_challenge() {
  local agent_verdict="$1"
  local tool_verdict="$2"
  local agent_reason="$3"
  local tool_reason="$4"

  echo ""
  echo "┌─────────────────────────────────────────────────────────────┐"
  echo "│  ⚠️  校验结果不一致                                        │"
  echo "├─────────────────────────────────────────────────────────────┤"
  echo "│                                                             │"
  echo "│  操作: $OPERATION                                            │"
  echo "│                                                             │"
  echo "│  Agent 验证:                                               │"
  echo "│    判断: $agent_verdict                                        │"
  echo "│    原因: $agent_reason                                         │"
  echo "│                                                             │"
  echo "│  工具校验:                                                   │"
  echo "│    判断: $tool_verdict                                         │"
  echo "│    原因: $tool_reason                                           │"
  echo "│                                                             │"
  echo "│  说明: 工具层校验与 Agent 自我验证结果不一致                   │"
  echo "│        请确认以下哪种判断是正确的                              │"
  echo "│                                                             │"
  echo "│  操作选项:                                                  │"
  echo "│  [a] 采用 Agent 判断（$agent_verdict）                         │"
  echo "│  [t] 采用工具校验（$tool_verdict）                             │"
  echo "│  [i] 忽略，继续执行                                          │"
  echo "│  [q] 取消操作                                              │"
  echo "│                                                             │"
  echo -n "│  请输入选择: _                                              │"
  echo ""
  echo "└─────────────────────────────────────────────────────────────┘"
  echo ""
}

# 执行语法检查
check_syntax() {
  local file="${1:-}"

  if [[ -z "$file" ]]; then
    echo "pass|no file specified"
    return
  fi

  local ext="${file##*.}"

  case "$ext" in
    ts|tsx|js|jsx)
      if command -v npx &> /dev/null; then
        npx tsc --noEmit --pretty false "$file" 2>/dev/null
        if [[ $? -eq 0 ]]; then
          echo "pass|no syntax errors"
        else
          echo "fail|syntax errors detected"
        fi
      else
        echo "pass|cannot check syntax without tsc"
      fi
      ;;
    py)
      if command -v python &> /dev/null; then
        python -m py_compile "$file" 2>/dev/null
        if [[ $? -eq 0 ]]; then
          echo "pass|no syntax errors"
        else
          echo "fail|syntax errors detected"
        fi
      else
        echo "pass|cannot check syntax"
      fi
      ;;
    go)
      if command -v go &> /dev/null; then
        go vet "$file" 2>/dev/null
        if [[ $? -eq 0 ]]; then
          echo "pass|no syntax errors"
        else
          echo "fail|syntax errors detected"
        fi
      else
        echo "pass|cannot check syntax"
      fi
      ;;
    *)
      echo "pass|no syntax check for $ext files"
      ;;
  esac
}

# 执行 lint 检查
check_lint() {
  local file="${1:-}"

  if [[ -z "$file" ]]; then
    echo "pass|no file specified"
    return
  fi

  local ext="${file##*.}"

  case "$ext" in
    ts|tsx|js|jsx)
      if command -v npx &> /dev/null; then
        npx eslint --no-eslintrc --parser-options=ecmaVersion:2020 "$file" 2>/dev/null
        if [[ $? -eq 0 ]]; then
          echo "pass|no lint errors"
        else
          echo "fail|lint errors detected"
        fi
      else
        echo "pass|cannot run lint"
      fi
      ;;
    *)
      echo "pass|no lint check for $ext files"
      ;;
  esac
}

# 执行类型检查
check_types() {
  local file="${1:-}"

  if [[ -z "$file" ]]; then
    echo "pass|no file specified"
    return
  fi

  local ext="${file##*.}"

  case "$ext" in
    ts|tsx|js|jsx)
      if command -v npx &> /dev/null; then
        npx tsc --noEmit "$file" 2>/dev/null
        if [[ $? -eq 0 ]]; then
          echo "pass|no type errors"
        else
          echo "fail|type errors detected"
        fi
      else
        echo "pass|cannot check types"
      fi
      ;;
    *)
      echo "pass|no type check for $ext files"
      ;;
  esac
}

# 执行测试
check_test() {
  local file="${1:-}"

  if [[ -z "$file" ]]; then
    echo "pass|no file specified"
    return
  fi

  # 检查是否存在对应的测试文件
  local test_file=""
  local ext="${file##*.}"

  case "$ext" in
    ts|tsx)
      if [[ -f "${file%.ts}.test.ts" ]]; then
        test_file="${file%.ts}.test.ts"
      elif [[ -f "${file%.ts}.spec.ts" ]]; then
        test_file="${file%.ts}.spec.ts"
      fi
      ;;
    js|jsx)
      if [[ -f "${file%.js}.test.js" ]]; then
        test_file="${file%.js}.test.js"
      elif [[ -f "${file%.js}.spec.js" ]]; then
        test_file="${file%.js}.spec.js"
      fi
      ;;
  esac

  if [[ -z "$test_file" ]]; then
    echo "pass|no corresponding test file"
    return
  fi

  if command -v npm &> /dev/null && [[ -f "package.json" ]]; then
    npm test -- "$test_file" 2>/dev/null
    if [[ $? -eq 0 ]]; then
      echo "pass|tests passed"
    else
      echo "fail|tests failed"
    fi
  else
    echo "pass|cannot run tests"
  fi
}

# 执行格式检查
check_format() {
  local file="${1:-}"

  if [[ -z "$file" ]]; then
    echo "pass|no file specified"
    return
  fi

  local ext="${file##*.}"

  case "$ext" in
    ts|tsx|js|jsx)
      if command -v npx &> /dev/null; then
        npx prettier --check "$file" 2>/dev/null
        if [[ $? -eq 0 ]]; then
          echo "pass|format OK"
        else
          echo "fail|format errors"
        fi
      else
        echo "pass|cannot check format"
      fi
      ;;
    *)
      echo "pass|no format check for $ext files"
      ;;
  esac
}

# 执行文件存在性检查
check_file_exists() {
  local file="${1:-}"

  if [[ -z "$file" ]]; then
    echo "pass|no file specified"
    return
  fi

  if [[ -f "$file" ]]; then
    echo "pass|file exists"
  else
    echo "fail|file does not exist"
  fi
}

# 执行独立校验
run_independent_check() {
  local check_type="$1"
  local target="${2:-}"

  case "$check_type" in
    syntax)
      check_syntax "$target"
      ;;
    lint)
      check_lint "$target"
      ;;
    type)
      check_types "$target"
      ;;
    test)
      check_test "$target"
      ;;
    format)
      check_format "$target"
      ;;
    exists)
      check_file_exists "$target"
      ;;
    *)
      echo "pass|unknown check type: $check_type"
      ;;
  esac
}

# ============================================================
# 主逻辑
# ============================================================

# 参数验证
if [[ -z "$OPERATION" ]]; then
  echo "用法: dual-check-hook.sh <operation> [verdict] [reason]" >&2
  exit 1
fi

# 解析操作类型和目标
# 格式: <check_type>:<target>
IFS=':' read -r CHECK_TYPE TARGET <<< "$OPERATION"

# 如果没有指定 verdict，使用 pass
if [[ -z "$AGENT_VERDICT" ]]; then
  AGENT_VERDICT="pass"
fi

# 执行独立校验
TOOL_RESULT=$(run_independent_check "$CHECK_TYPE" "$TARGET")

IFS='|' read -r TOOL_VERDICT TOOL_REASON <<< "$TOOL_RESULT"

# 标准化 verdicts
normalize_verdict() {
  local verdict="$1"
  case "$verdict" in
    pass|ok|success|true|1)
      echo "pass"
      ;;
    fail|error|failure|false|0)
      echo "fail"
      ;;
    warn|warning)
      echo "warn"
      ;;
    *)
      echo "unknown"
      ;;
  esac
}

AGENT_VERDICT=$(normalize_verdict "$AGENT_VERDICT")
TOOL_VERDICT=$(normalize_verdict "$TOOL_VERDICT")

# 比较结果
if [[ "$AGENT_VERDICT" == "$TOOL_VERDICT" ]]; then
  # 一致，放行
  print_check_result "$TOOL_VERDICT" "两次校验结果一致"
  exit 0
fi

# 不一致，提出质疑
print_challenge "$AGENT_VERDICT" "$TOOL_VERDICT" \
  "$AGENT_REASON" "$TOOL_REASON"

read -r response
case "$response" in
  a|A|agent|Agent)
    echo "采用 Agent 判断: $AGENT_VERDICT"
    exit 0
    ;;
  t|T|tool|Tool)
    echo "采用工具校验: $TOOL_VERDICT"
    exit 0
    ;;
  i|I|ignore|Ignore)
    echo "忽略不一致，继续执行"
    exit 0
    ;;
  *)
    echo "操作已取消"
    exit 1
    ;;
esac
