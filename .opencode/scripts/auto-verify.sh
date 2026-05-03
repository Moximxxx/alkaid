# auto-verify.sh — 自动化验证脚本
# 版本: v2.0.0
# 更新: 2026-04-30
#
# 功能:
# 自动化执行多阶段验证：语法 -> 静态分析 -> 测试 -> 报告
#
# 用法:
#   bash auto-verify.sh [options]
#
# 选项:
#   --files FILE1 FILE2...  指定要验证的文件
#   --dir DIRECTORY         验证整个目录
#   --incremental            增量验证模式
#   --fail-fast             遇到错误立即停止
#   --verbose               显示详细信息

set -euo pipefail

# ============================================================
# 配置
# ============================================================

# 颜色输出
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# 验证阶段
readonly STAGES=("syntax" "types" "lint" "test")

# 阶段配置
declare -A STAGE_ENABLED=(
  ["syntax"]=true
  ["types"]=true
  ["lint"]=true
  ["test"]=true
)

declare -A STAGE_LABELS=(
  ["syntax"]="语法检查"
  ["types"]="类型检查"
  ["lint"]="代码规范"
  ["test"]="单元测试"
)

# 状态文件
readonly STATUS_FILE="${HARNESS_STATUS_DIR:-/tmp/harness-status}/verification-status.json"

# ============================================================
# 函数
# ============================================================

# 打印带颜色的消息
print_msg() {
  local color="$1"
  local msg="$2"
  echo -e "${color}${msg}${NC}"
}

# 打印阶段开始
print_stage_start() {
  local stage="$1"
  local label="${STAGE_LABELS[$stage]}"
  print_msg "$BLUE" ""
  print_msg "$BLUE" "═══════════════════════════════════════════════════"
  print_msg "$BLUE" "  阶段: $label"
  print_msg "$BLUE" "═══════════════════════════════════════════════════"
}

# 打印阶段结果
print_stage_result() {
  local stage="$1"
  local result="$2"
  local label="${STAGE_LABELS[$stage]}"

  if [[ "$result" == "pass" ]]; then
    print_msg "$GREEN" "  ✓ $label 通过"
    return 0
  elif [[ "$result" == "skip" ]]; then
    print_msg "$YELLOW" "  ○ $label 跳过"
    return 0
  else
    print_msg "$RED" "  ✗ $label 失败"
    return 1
  fi
}

# ============================================================
# 验证阶段实现
# ============================================================

# 语法检查
verify_syntax() {
  local file="$1"
  local ext="${file##*.}"

  case "$ext" in
    ts|tsx|js|jsx)
      if command -v npx &> /dev/null; then
        if npx tsc --noEmit --pretty false "$file" 2>/dev/null; then
          echo "pass"
        else
          echo "fail"
        fi
      else
        echo "skip"
      fi
      ;;
    py)
      if command -v python &> /dev/null; then
        if python -m py_compile "$file" 2>/dev/null; then
          echo "pass"
        else
          echo "fail"
        fi
      else
        echo "skip"
      fi
      ;;
    go)
      if command -v go &> /dev/null; then
        if go vet "$file" 2>/dev/null; then
          echo "pass"
        else
          echo "fail"
        fi
      else
        echo "skip"
      fi
      ;;
    rs)
      if command -v rustc &> /dev/null; then
        if rustc --crate-type lib --edition 2021 "$file" 2>/dev/null; then
          echo "pass"
        else
          echo "fail"
        fi
      else
        echo "skip"
      fi
      ;;
    *)
      echo "skip"
      ;;
  esac
}

# 类型检查
verify_types() {
  local file="$1"
  local ext="${file##*.}"

  case "$ext" in
    ts|tsx|js|jsx)
      if command -v npx &> /dev/null; then
        if npx tsc --noEmit "$file" 2>/dev/null; then
          echo "pass"
        else
          echo "fail"
        fi
      else
        echo "skip"
      fi
      ;;
    py)
      if command -v mypy &> /dev/null; then
        if mypy "$file" 2>/dev/null; then
          echo "pass"
        else
          echo "fail"
        fi
      else
        echo "skip"
      fi
      ;;
    go)
      if command -v go &> /dev/null; then
        if go build "$file" 2>/dev/null; then
          echo "pass"
        else
          echo "fail"
        fi
      else
        echo "skip"
      fi
      ;;
    *)
      echo "skip"
      ;;
  esac
}

# Lint 检查
verify_lint() {
  local file="$1"
  local ext="${file##*.}"

  case "$ext" in
    ts|tsx|js|jsx)
      if command -v npx &> /dev/null; then
        if npx eslint --no-eslintrc --parser-options=ecmaVersion:2020 "$file" 2>/dev/null; then
          echo "pass"
        else
          echo "fail"
        fi
      elif command -v eslint &> /dev/null; then
        if eslint "$file" 2>/dev/null; then
          echo "pass"
        else
          echo "fail"
        fi
      else
        echo "skip"
      fi
      ;;
    py)
      if command -v flake8 &> /dev/null; then
        if flake8 "$file" 2>/dev/null; then
          echo "pass"
        else
          echo "fail"
        fi
      elif command -v ruff &> /dev/null; then
        if ruff check "$file" 2>/dev/null; then
          echo "pass"
        else
          echo "fail"
        fi
      else
        echo "skip"
      fi
      ;;
    go)
      if command -v golint &> /dev/null; then
        if golint "$file" 2>/dev/null; then
          echo "pass"
        else
          echo "fail"
        fi
      else
        echo "skip"
      fi
      ;;
    *)
      echo "skip"
      ;;
  esac
}

# 测试
verify_test() {
  local file="$1"
  local ext="${file##*.}"

  # 查找对应的测试文件
  local test_file=""
  local dir=$(dirname "$file")
  local base=$(basename "$file")

  case "$ext" in
    ts|tsx)
      local name="${base%.ts}"
      for pattern in "${name}.test.ts" "${name}.spec.ts" "${name}.test.tsx" "${name}.spec.tsx"; do
        if [[ -f "$dir/$pattern" ]]; then
          test_file="$dir/$pattern"
          break
        fi
      done
      ;;
    js|jsx)
      local name="${base%.js}"
      for pattern in "${name}.test.js" "${name}.spec.js"; do
        if [[ -f "$dir/$pattern" ]]; then
          test_file="$dir/$pattern"
          break
        fi
      done
      ;;
  esac

  if [[ -z "$test_file" ]]; then
    echo "skip"
    return
  fi

  # 运行测试
  if command -v npm &> /dev/null && [[ -f "package.json" ]]; then
    if npm test -- "$test_file" 2>/dev/null; then
      echo "pass"
    else
      echo "fail"
    fi
  else
    echo "skip"
  fi
}

# ============================================================
# 主逻辑
# ============================================================

# 解析参数
FILES=()
INCREMENTAL=false
FAIL_FAST=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --files)
      shift
      while [[ $# -gt 0 && ! "$1" =~ ^-- ]]; do
        FILES+=("$1")
        shift
      done
      ;;
    --dir)
      shift
      local dir="$1"
      if [[ -d "$dir" ]]; then
        while IFS= read -r -d '' file; do
          FILES+=("$file")
        done < <(find "$dir" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" \) -print0)
      fi
      shift
      ;;
    --incremental)
      INCREMENTAL=true
      shift
      ;;
    --fail-fast)
      FAIL_FAST=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# 如果没有指定文件，使用 git 变更的文件
if [[ ${#FILES[@]} -eq 0 ]]; then
  if command -v git &> /dev/null && git rev-parse --git-dir &> /dev/null; then
    while IFS= read -r file; do
      FILES+=("$file")
    done < <(git diff --name-only --cached 2>/dev/null || git diff --name-only HEAD 2>/dev/null || echo "")
  fi
fi

# 去重
IFS=$'\n' FILES=($(printf "%s\n" "${FILES[@]}" | sort -u))
IFS=$' '

# 统计
TOTAL=0
PASSED=0
FAILED=0
SKIPPED=0
FAILED_FILES=()

# 开始验证
print_msg "$BLUE" ""
print_msg "$BLUE" "╔═══════════════════════════════════════════════════╗"
print_msg "$BLUE" "║         自动化验证开始                              ║"
print_msg "$BLUE" "╚═══════════════════════════════════════════════════╝"
print_msg "$BLUE" "待验证文件数: ${#FILES[@]}"

if [[ ${#FILES[@]} -eq 0 ]]; then
  print_msg "$YELLOW" "没有需要验证的文件"
  exit 0
fi

# 保存状态
mkdir -p "$(dirname "$STATUS_FILE")"
cat > "$STATUS_FILE" << EOF
{
  "started_at": "$(date -Iseconds)",
  "total_files": ${#FILES[@]},
  "verified": 0,
  "passed": 0,
  "failed": 0,
  "skipped": 0,
  "results": {}
}
EOF

# 验证每个文件
for file in "${FILES[@]}"; do
  TOTAL=$((TOTAL + 1))

  # 检查文件是否存在
  if [[ ! -f "$file" ]]; then
    continue
  fi

  print_msg "$BLUE" ""
  print_msg "$BLUE" "─────────────────────────────────────────────────────"
  print_msg "$BLUE" "文件: $file"
  print_msg "$BLUE" "─────────────────────────────────────────────────────"

  local file_failed=false
  local file_results="{}"

  # 执行各阶段验证
  for stage in "${STAGES[@]}"; do
    if [[ "${STAGE_ENABLED[$stage]}" != "true" ]]; then
      continue
    fi

    print_stage_start "$stage"

    local result
    case "$stage" in
      syntax)
        result=$(verify_syntax "$file")
        ;;
      types)
        result=$(verify_types "$file")
        ;;
      lint)
        result=$(verify_lint "$file")
        ;;
      test)
        result=$(verify_test "$file")
        ;;
    esac

    print_stage_result "$stage" "$result"

    if [[ "$result" == "fail" ]]; then
      file_failed=true
    elif [[ "$result" == "pass" ]]; then
      PASSED=$((PASSED + 1))
    else
      SKIPPED=$((SKIPPED + 1))
    fi

    # 更新状态
    local timestamp=$(date -Iseconds)
    local status_json=$(cat "$STATUS_FILE")
    echo "$status_json" | \
      jq --arg file "$file" \
         --arg stage "$stage" \
         --arg result "$result" \
         --arg timestamp "$timestamp" \
         '.results[$file][$stage] = {result: $result, timestamp: $timestamp}' \
      > "$STATUS_FILE.tmp"
    mv "$STATUS_FILE.tmp" "$STATUS_FILE"
  done

  if [[ "$file_failed" == "true" ]]; then
    FAILED=$((FAILED + 1))
    FAILED_FILES+=("$file")

    if [[ "$FAIL_FAST" == "true" ]]; then
      print_msg "$RED" ""
      print_msg "$RED" "遇到错误，fail-fast 模式，停止验证"
      break
    fi
  fi
done

# 打印总结
print_msg "$BLUE" ""
print_msg "$BLUE" "╔═══════════════════════════════════════════════════╗"
print_msg "$BLUE" "║         验证总结                                    ║"
print_msg "$BLUE" "╚═══════════════════════════════════════════════════╝"
print_msg "$BLUE" "总文件数: $TOTAL"
print_msg "$GREEN" "通过: $PASSED"
print_msg "$RED" "失败: $FAILED"
print_msg "$YELLOW" "跳过: $SKIPPED"

if [[ $FAILED -gt 0 ]]; then
  print_msg "$RED" ""
  print_msg "$RED" "失败的文件:"
  for file in "${FAILED_FILES[@]}"; do
    print_msg "$RED" "  - $file"
  done
  print_msg "$RED" ""
  print_msg "$RED" "验证失败"
  exit 1
else
  print_msg "$GREEN" ""
  print_msg "$GREEN" "所有验证通过 ✓"
  print_msg "$GREEN" ""
  print_msg "$GREEN" "验证成功"
  exit 0
fi