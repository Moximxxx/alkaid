#!/bin/bash
# post-edit-verify.sh — 编辑后验证（双重校验）
# 版本: v2.0.0
# 更新: 2026-04-30
#
# 功能:
# 1. 基础验证（语法、格式、基本问题）
# 2. Agent 自验结果校验
# 3. 发现问题时质疑 Agent
#
# 用法:
#   post-edit-verify.sh <file> [agent_verdict] [agent_reason]
#
# 环境变量:
#   DUAL_CHECK_ENABLED=1  启用双重校验

set -euo pipefail

# ============================================================
# 配置
# ============================================================

readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MODIFIED_FILE="${1:-}"
AGENT_VERDICT="${2:-pass}"
AGENT_REASON="${3:-}"

# 双重校验配置
DUAL_CHECK_ENABLED="${DUAL_CHECK_ENABLED:-1}"

# ============================================================
# 函数
# ============================================================

print_msg() {
  local color="$1"
  local msg="$2"
  echo -e "${color}${msg}${NC}"
}

# 检查文件是否存在
verify_file_exists() {
  local file="$1"

  if [[ ! -f "$PROJECT_ROOT/$file" ]]; then
    echo "ERROR: File not found: $file"
    return 1
  fi

  return 0
}

# 语法检查
check_syntax() {
  local file="$1"
  local ext="${file##*.}"

  case "$ext" in
    ts|tsx|js|jsx)
      if command -v npx &> /dev/null; then
        if ! npx tsc --noEmit --pretty false "$file" 2>/dev/null; then
          echo "SYNTAX_ERROR"
          return 1
        fi
      fi
      ;;
    py)
      if command -v python &> /dev/null; then
        if ! python -m py_compile "$file" 2>/dev/null; then
          echo "SYNTAX_ERROR"
          return 1
        fi
      fi
      ;;
    go)
      if command -v go &> /dev/null; then
        if ! go vet "$file" 2>/dev/null; then
          echo "SYNTAX_ERROR"
          return 1
        fi
      fi
      ;;
  esac

  return 0
}

# 格式检查
check_format() {
  local file="$1"
  local ext="${file##*.}"

  case "$ext" in
    ts|tsx|js|jsx)
      if command -v npx &> /dev/null; then
        if ! npx prettier --check "$file" 2>/dev/null; then
          echo "FORMAT_ERROR"
          return 1
        fi
      fi
      ;;
  esac

  return 0
}

# 基本问题检查
check_basic_issues() {
  local file="$1"
  local issues=()
  local ext="${file##*.}"

  # 检查 TODO/FIXME
  if grep -n "TODO\|FIXME\|XXX\|HACK" "$file" 2>/dev/null | head -3; then
    issues+=("TODO/FIXME found")
  fi

  # C++ 特定检查
  if [[ "$ext" == "cpp" ]] || [[ "$ext" == "h" ]]; then
    # 大括号匹配
    local brace_open=$(grep -o '{' "$file" | wc -l)
    local brace_close=$(grep -o '}' "$file" | wc -l)
    if [[ "$brace_open" != "$brace_close" ]]; then
      issues+=("Brace mismatch: { = $brace_open, } = $brace_close")
    fi
  fi

  # TypeScript/JavaScript 检查
  if [[ "$ext" == "ts" ]] || [[ "$ext" == "tsx" ]] || [[ "$ext" == "js" ]]; then
    # console.log 检查
    if grep -n "console\.log" "$file" 2>/dev/null | head -3; then
      issues+=("console.log found (should use proper logging)")
    fi

    # any 类型检查
    if grep -n ": any\b" "$file" 2>/dev/null | head -3; then
      issues+=("': any' type found")
    fi
  fi

  # Python 检查
  if [[ "$ext" == "py" ]]; then
    # print 语句检查
    if grep -n "^\s*print(" "$file" 2>/dev/null | head -3; then
      issues+=("print statement found (should use logging)")
    fi
  fi

  if [[ ${#issues[@]} -gt 0 ]]; then
    echo "ISSUES_FOUND: ${issues[*]}"
    return 1
  fi

  return 0
}

# 运行工具层验证
run_tool_verification() {
  local file="$1"

  local tool_result="pass"
  local tool_reason=""

  # 语法检查
  if ! check_syntax "$file"; then
    tool_result="fail"
    tool_reason="syntax errors detected"
  fi

  # 如果语法失败，不需要继续检查
  if [[ "$tool_result" == "fail" ]]; then
    echo "$tool_result|$tool_reason"
    return
  fi

  # 格式检查
  if ! check_format "$file"; then
    tool_result="fail"
    tool_reason="format errors detected"
  fi

  echo "$tool_result|$tool_reason"
}

# 质疑 Agent
challenge_agent() {
  local agent_verdict="$1"
  local tool_verdict="$2"
  local tool_reason="$3"
  local agent_reason="$4"

  echo ""
  echo "┌─────────────────────────────────────────────────────────────┐"
  echo "│  ⚠️  双重校验结果不一致                                    │"
  echo "├─────────────────────────────────────────────────────────────┤"
  echo "│                                                             │"
  echo "│  文件: $MODIFIED_FILE                                        │"
  echo "│                                                             │"
  echo "│  Agent 自我验证:                                           │"
  echo "│    判断: $agent_verdict                                        │"
  echo "│    原因: $agent_reason                                         │"
  echo "│                                                             │"
  echo "│  工具独立验证:                                              │"
  echo "│    判断: $tool_verdict                                         │"
  echo "│    原因: $tool_reason                                         │"
  echo "│                                                             │"
  echo "│  说明: 工具层校验与 Agent 自我验证结果不一致                  │"
  echo "│                                                             │"
  echo "│  操作选项:                                                  │"
  echo "│  [a] 采用 Agent 判断                                        │"
  echo "│  [t] 采用工具校验（重新生成）                               │"
  echo "│  [i] 忽略，继续                                            │"
  echo "│  [q] 取消操作                                              │"
  echo "│                                                             │"
  echo -n "│  请输入选择: _                                              │"
  echo ""
  echo "└─────────────────────────────────────────────────────────────┘"
  echo ""

  read -r response
  case "$response" in
    a|A|agent|Agent)
      echo "采用 Agent 判断: $agent_verdict"
      return 0
      ;;
    t|T|tool|Tool)
      echo "采用工具校验，将重新生成"
      return 1
      ;;
    i|I|ignore|Ignore)
      echo "忽略不一致，继续执行"
      return 0
      ;;
    *)
      echo "操作已取消"
      return 1
      ;;
  esac
}

# ============================================================
# 主逻辑
# ============================================================

# 检查参数
if [[ -z "$MODIFIED_FILE" ]]; then
  echo "用法: post-edit-verify.sh <file> [agent_verdict] [agent_reason]"
  exit 1
fi

# 规范化文件路径
MODIFIED_FILE="${MODIFIED_FILE#$PROJECT_ROOT/}"

# 验证文件存在
if ! verify_file_exists "$MODIFIED_FILE"; then
  exit 1
fi

print_msg "$BLUE" ""
print_msg "$BLUE" "─────────────────────────────────────────────────────"
print_msg "$BLUE" "验证文件: $MODIFIED_FILE"
print_msg "$BLUE" "─────────────────────────────────────────────────────"

# 运行工具层验证
print_msg "$BLUE" "运行工具层验证..."

TOOL_RESULT=$(run_tool_verification "$PROJECT_ROOT/$MODIFIED_FILE")
IFS='|' read -r TOOL_VERDICT TOOL_REASON <<< "$TOOL_RESULT"

print_msg "$BLUE" "工具校验结果: $TOOL_VERDICT"

if [[ "$TOOL_VERDICT" != "pass" ]]; then
  print_msg "$RED" "工具校验失败: $TOOL_REASON"
fi

# 基础问题检查（不阻止，但报告）
if ! check_basic_issues "$PROJECT_ROOT/$MODIFIED_FILE"; then
  print_msg "$YELLOW" "发现基本问题，请检查"
fi

# 双重校验
if [[ "$DUAL_CHECK_ENABLED" == "1" ]]; then
  # 标准化 verdicts
  case "$AGENT_VERDICT" in
    pass|ok|success|true|1)
      AGENT_VERDICT_NORM="pass"
      ;;
    fail|error|failure|false|0)
      AGENT_VERDICT_NORM="fail"
      ;;
    *)
      AGENT_VERDICT_NORM="$AGENT_VERDICT"
      ;;
  esac

  # 比较结果
  if [[ "$AGENT_VERDICT_NORM" == "$TOOL_VERDICT" ]]; then
    # 一致，放行
    print_msg "$GREEN" ""
    print_msg "$GREEN" "双重校验通过: Agent 与工具校验结果一致"
    exit 0
  else
    # 不一致，质疑
    print_msg "$YELLOW" ""
    print_msg "$YELLOW" "双重校验结果不一致，需要确认"

    if ! challenge_agent "$AGENT_VERDICT" "$TOOL_VERDICT" "$TOOL_REASON" "$AGENT_REASON"; then
      exit 1
    fi
  fi
else
  # 未启用双重校验，直接根据工具结果判断
  if [[ "$TOOL_VERDICT" == "pass" ]]; then
    exit 0
  else
    exit 1
  fi
fi