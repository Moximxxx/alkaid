# incident-analyzer.sh — 错误分析脚本
# 版本: v2.0.0
# 更新: 2026-04-30
#
# 功能:
# 1. 解析错误日志
# 2. 分类错误类型
# 3. 提取关键信息
# 4. 生成分析报告
#
# 用法:
#   bash incident-analyzer.sh <log_file>
#   echo "error message" | bash incident-analyzer.sh --stdin

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

# 错误类型定义
readonly ERROR_TYPES=(
  "syntax_error"
  "type_error"
  "lint_error"
  "test_failure"
  "runtime_error"
  "logic_error"
  "api_error"
  "resource_error"
)

# 错误模式
declare -A ERROR_PATTERNS=(
  ["syntax_error"]="SyntaxError|ParseError|syntax error|unexpected token"
  ["type_error"]="TypeError|Type.*does not exist|cannot read property"
  ["lint_error"]="ESLint|lint.*error|indentation|whitespace"
  ["test_failure"]="Test.*failed|Assertion.*failed|expect.*received"
  ["runtime_error"]="RuntimeError|Exception|ReferenceError|Cannot"
  ["logic_error"]="AssertionError|Expected.*but got|logic error"
  ["api_error"]="API.*error|ECONNREFUSED|404|500|network"
  ["resource_error"]="Memory|EOUT|maximum call stack|recursion"
)

# ============================================================
# 函数
# ============================================================

print_msg() {
  local color="$1"
  local msg="$2"
  echo -e "${color}${msg}${NC}"
}

# 分类错误
classify_error() {
  local message="$1"

  for error_type in "${ERROR_TYPES[@]}"; do
    local pattern="${ERROR_PATTERNS[$error_type]}"
    if echo "$message" | grep -qiE "$pattern" 2>/dev/null; then
      echo "$error_type"
      return 0
    fi
  done

  echo "unknown"
}

# 提取文件路径
extract_file() {
  local line="$1"

  # TypeScript/JavaScript
  if echo "$line" | grep -qE "\.ts:|\.tsx:|\.js:|\.jsx:"; then
    echo "$line" | grep -oE "[^[:space:]]+\.(ts|tsx|js|jsx):[0-9]+" | head -1
    return
  fi

  # Python
  if echo "$line" | grep -qE "\.py:"; then
    echo "$line" | grep -oE "[^[:space:]]+\.py:[0-9]+" | head -1
    return
  fi

  # Go
  if echo "$line" | grep -qE "\.go:"; then
    echo "$line" | grep -oE "[^[:space:]]+\.go:[0-9]+" | head -1
    return
  fi

  # 通用路径提取
  echo "$line" | grep -oE "/[^[:space:])]+" | head -1
}

# 提取行号
extract_line() {
  local line="$1"

  echo "$line" | grep -oE ":[0-9]+:" | grep -oE "[0-9]+" | head -1
}

# 提取堆栈信息
extract_stack_trace() {
  local log="$1"
  local in_stack=false
  local stack_lines=()

  while IFS= read -r line; do
    if echo "$line" | grep -qE "^\s+at\s+" || echo "$line" | grep -qE "^Traceback|^Error:|^TypeError"; then
      in_stack=true
      stack_lines+=("$line")
    elif [[ "$in_stack" == "true" ]]; then
      # 堆栈通常连续，继续收集几行
      if [[ ${#stack_lines[@]} -lt 10 ]]; then
        stack_lines+=("$line")
      else
        break
      fi
    fi
  done <<< "$log"

  printf "%s\n" "${stack_lines[@]}"
}

# 提取关键建议
extract_suggestion() {
  local error_type="$1"
  local message="$2"

  case "$error_type" in
    syntax_error)
      echo "检查语法错误：括号、引号、分号是否匹配"
      ;;
    type_error)
      echo "检查类型定义：变量是否已声明、类型是否匹配"
      ;;
    lint_error)
      echo "运行 linter 修复：npm run lint --fix"
      ;;
    test_failure)
      echo "检查测试用例和实现代码，确保两者一致"
      ;;
    runtime_error)
      echo "检查运行时状态：变量是否初始化、是否存在空值"
      ;;
    logic_error)
      echo "分析代码逻辑：对照需求检查实现是否正确"
      ;;
    api_error)
      echo "检查 API 调用：URL、参数、认证是否正确"
      ;;
    resource_error)
      echo "检查资源使用：内存、递归深度、循环是否正常"
      ;;
    *)
      echo "需要进一步分析错误原因"
      ;;
  esac
}

# 生成分析报告
generate_report() {
  local error_type="$1"
  local message="$2"
  local file="$3"
  local line="$4"
  local stack="$5"
  local suggestion="$6"

  print_msg "$BLUE" ""
  print_msg "$BLUE" "╔═══════════════════════════════════════════════════════════════╗"
  print_msg "$BLUE" "║           错误分析报告                                      ║"
  print_msg "$BLUE" "╚═══════════════════════════════════════════════════════════════╝"

  print_msg "$BLUE" ""
  print_msg "$BLUE" "错误分类:"
  print_msg "$BLUE" "─────────────────────────────────────────────────────────────"
  print_msg "$CYAN" "  类型: $error_type"

  if [[ -n "$file" ]]; then
    print_msg "$CYAN" "  位置: $file${line:+:$line}"
  fi

  print_msg "$BLUE" ""
  print_msg "$BLUE" "错误摘要:"
  print_msg "$BLUE" "─────────────────────────────────────────────────────────────"
  echo "$message" | head -5 | while IFS= read -r line; do
    print_msg "$CYAN" "  $line"
  done

  if [[ -n "$stack" ]]; then
    print_msg "$BLUE" ""
    print_msg "$BLUE" "堆栈跟踪 (前 10 行):"
    print_msg "$BLUE" "─────────────────────────────────────────────────────────────"
    echo "$stack" | while IFS= read -r line; do
      print_msg "$YELLOW" "  $line"
    done
  fi

  print_msg "$BLUE" ""
  print_msg "$BLUE" "建议:"
  print_msg "$BLUE" "─────────────────────────────────────────────────────────────"
  print_msg "$GREEN" "  $suggestion"

  print_msg "$BLUE" ""
}

# 输出 JSON 格式
output_json() {
  local error_type="$1"
  local message="$2"
  local file="$3"
  local line="$4"
  local suggestion="$5"

  cat << EOF
{
  "error_type": "$error_type",
  "message": "$(echo "$message" | head -1 | tr -d '"')",
  "location": {
    "file": "${file:-null}",
    "line": ${line:-null}
  },
  "suggestion": "$(echo "$suggestion" | tr -d '"')",
  "timestamp": "$(date -Iseconds)"
}
EOF
}

# ============================================================
# 主逻辑
# ============================================================

# 解析参数
INPUT=""
JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --stdin)
      INPUT=$(cat)
      shift
      ;;
    --json)
      JSON_OUTPUT=true
      shift
      ;;
    -h|--help)
      echo "用法: incident-analyzer.sh [--stdin|--json] [log_file]"
      echo ""
      echo "选项:"
      echo "  --stdin    从标准输入读取"
      echo "  --json     JSON 格式输出"
      exit 0
      ;;
    *)
      if [[ -z "$INPUT" ]]; then
        INPUT=$(cat "$1" 2>/dev/null || echo "$1")
      fi
      shift
      ;;
  esac
done

# 检查输入
if [[ -z "$INPUT" ]]; then
  echo "Error: No input provided"
  echo "用法: incident-analyzer.sh [--stdin|--json] [log_file]"
  exit 1
fi

# 分析错误
ERROR_MESSAGE=$(echo "$INPUT" | head -20 | tr '\n' ' ')
ERROR_TYPE=$(classify_error "$ERROR_MESSAGE")
ERROR_FILE=$(echo "$INPUT" | extract_file)
ERROR_LINE=$(echo "$INPUT" | extract_line)
STACK_TRACE=$(echo "$INPUT" | extract_stack_trace)
SUGGESTION=$(extract_suggestion "$ERROR_TYPE" "$ERROR_MESSAGE")

# 输出结果
if [[ "$JSON_OUTPUT" == "true" ]]; then
  output_json "$ERROR_TYPE" "$ERROR_MESSAGE" "$ERROR_FILE" "$ERROR_LINE" "$SUGGESTION"
else
  generate_report "$ERROR_TYPE" "$ERROR_MESSAGE" "$ERROR_FILE" "$ERROR_LINE" "$STACK_TRACE" "$SUGGESTION"
fi