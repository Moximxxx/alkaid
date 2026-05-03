# incremental-verify.sh — 增量验证脚本
# 版本: v2.0.0
# 更新: 2026-04-30
#
# 功能:
# 1. 只验证变更相关的文件和测试
# 2. 分析变更范围
# 3. 执行增量测试
# 4. 生成验证报告
#
# 用法:
#   bash incremental-verify.sh [options]
#
# 选项:
#   --base BASE        比较的基础分支
#   --affected-tests   只运行受影响的测试
#   --include-deps     包含依赖文件
#   --regression       同时运行回归测试
#   --verbose          显示详细信息

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

BASE_BRANCH="${BASE_BRANCH:-main}"
AFFECTED_TESTS=false
INCLUDE_DEPS=false
REGRESSION=false
VERBOSE=false

# ============================================================
# 函数
# ============================================================

print_msg() {
  local color="$1"
  local msg="$2"
  echo -e "${color}${msg}${NC}"
}

# 获取变更文件
get_changed_files() {
  local base="$1"

  if git rev-parse "$base" &>/dev/null; then
    git diff --name-only "$base...HEAD" 2>/dev/null
  else
    git diff --name-only HEAD 2>/dev/null
  fi
}

# 查找对应的测试文件
find_test_for_file() {
  local file="$1"
  local dir=$(dirname "$file")
  local base=$(basename "$file")
  local ext="${base##*.}"
  local name="${base%.$ext}"

  # 测试文件命名模式
  local patterns=(
    "${name}.test.${ext}"
    "${name}.spec.${ext}"
    "${name}.test.ts"
    "${name}.spec.ts"
    "${name}.test.tsx"
    "${name}.spec.tsx"
    "test_${name}.${ext}"
    "_test.${ext}"
  )

  # 常见测试目录
  local test_dirs=("tests" "test" "__tests__" "spec" "specs")

  for pattern in "${patterns[@]}"; do
    # 在同目录查找
    if [[ -f "$dir/$pattern" ]]; then
      echo "$dir/$pattern"
      return
    fi

    # 在 tests 子目录查找
    for test_dir in "${test_dirs[@]}"; do
      if [[ -f "$dir/$test_dir/$pattern" ]]; then
        echo "$dir/$test_dir/$pattern"
        return
      fi
    done
  done

  # 在父目录的 tests 查找
  local parent=$(dirname "$dir")
  if [[ "$parent" != "$dir" ]]; then
    for test_dir in "${test_dirs[@]}"; do
      if [[ -f "$parent/$test_dir/$pattern" ]]; then
        echo "$parent/$test_dir/$pattern"
        return
      fi
    done
  fi
}

# 分析依赖关系
analyze_dependencies() {
  local file="$1"
  local deps=()

  local ext="${file##*.}"

  case "$ext" in
    ts|tsx|js|jsx)
      if command -v grep &> /dev/null; then
        # 查找 import 语句
        while IFS= read -r dep; do
          dep=$(echo "$dep" | sed -E 's/.*import.*from.*['\''"]?([^'\''"]+)['\''"]?.*/\1/')
          dep=$(echo "$dep" | sed -E 's/^@//' | tr '/' '\\/')

          # 转换为文件路径
          if [[ "$dep" == "." ]] || [[ "$dep" == ".." ]]; then
            continue
          fi

          local resolved=""
          for ext2 in "ts" "tsx" "js" "jsx"; do
            if [[ -f "${dep}.${ext2}" ]]; then
              resolved="${dep}.${ext2}"
              break
            fi
            if [[ -f "${dep}/index.${ext2}" ]]; then
              resolved="${dep}/index.${ext2}"
              break
            fi
          done

          if [[ -n "$resolved" ]]; then
            deps+=("$resolved")
          fi
        done < <(grep -E "^import.*from" "$file" 2>/dev/null || echo "")
      fi
      ;;
    py)
      if command -v grep &> /dev/null; then
        while IFS= read -r dep; do
          dep=$(echo "$dep" | sed -E 's/^(import|from)\s+//' | cut -d'.' -f1 | tr -d ' ')
          if [[ -n "$dep" ]] && [[ -f "${dep}.py" ]]; then
            deps+=("${dep}.py")
          fi
        done < <(grep -E "^(import|from)" "$file" 2>/dev/null || echo "")
      fi
      ;;
  esac

  printf "%s\n" "${deps[@]}"
}

# 查找模块入口文件
find_module_entry() {
  local file="$1"
  local dir=$(dirname "$file")
  local base=$(basename "$file")
  local name="${base%.*}"

  # 常见入口文件模式
  local patterns=(
    "index.ts"
    "index.tsx"
    "index.js"
    "index.jsx"
    "${name}.ts"
    "${name}.tsx"
  )

  for pattern in "${patterns[@]}"; do
    if [[ -f "$dir/$pattern" ]]; then
      echo "$dir/$pattern"
      return
    fi
  done

  echo "$file"
}

# 运行增量测试
run_incremental_tests() {
  local test_files=("$@")

  if [[ ${#test_files[@]} -eq 0 ]]; then
    print_msg "$YELLOW" "没有找到需要运行的测试"
    return 0
  fi

  print_msg "$BLUE" ""
  print_msg "$BLUE" "运行增量测试: ${#test_files[@]} 个测试文件"

  local total_passed=0
  local total_failed=0
  local failed_tests=()

  for test_file in "${test_files[@]}"; do
    if [[ ! -f "$test_file" ]]; then
      continue
    fi

    print_msg "$CYAN" ""
    print_msg "$CYAN" "─────────────────────────────────────────────────────"
    print_msg "$CYAN" "测试文件: $test_file"

    local ext="${test_file##*.}"

    case "$ext" in
      ts|tsx|js|jsx)
        if command -v npm &> /dev/null && [[ -f "package.json" ]]; then
          if npm test -- "$test_file" 2>&1; then
            print_msg "$GREEN" "  ✓ 通过"
            total_passed=$((total_passed + 1))
          else
            print_msg "$RED" "  ✗ 失败"
            total_failed=$((total_failed + 1))
            failed_tests+=("$test_file")
          fi
        else
          print_msg "$YELLOW" "  ○ 跳过 (npm 或 package.json 不存在)"
        fi
        ;;
      py)
        if command -v pytest &> /dev/null; then
          if pytest "$test_file" -v 2>&1; then
            print_msg "$GREEN" "  ✓ 通过"
            total_passed=$((total_passed + 1))
          else
            print_msg "$RED" "  ✗ 失败"
            total_failed=$((total_failed + 1))
            failed_tests+=("$test_file")
          fi
        else
          print_msg "$YELLOW" "  ○ 跳过 (pytest 不存在)"
        fi
        ;;
      go)
        if command -v go &> /dev/null; then
          if go test -v "$test_file" 2>&1; then
            print_msg "$GREEN" "  ✓ 通过"
            total_passed=$((total_passed + 1))
          else
            print_msg "$RED" "  ✗ 失败"
            total_failed=$((total_failed + 1))
            failed_tests+=("$test_file")
          fi
        else
          print_msg "$YELLOW" "  ○ 跳过 (go 不存在)"
        fi
        ;;
    esac
  done

  print_msg "$BLUE" ""
  print_msg "$BLUE" "测试结果:"
  print_msg "$GREEN" "  通过: $total_passed"
  print_msg "$RED" "  失败: $total_failed"

  if [[ $total_failed -gt 0 ]]; then
    print_msg "$RED" ""
    print_msg "$RED" "失败的测试:"
    for test in "${failed_tests[@]}"; do
      print_msg "$RED" "  - $test"
    done
    return 1
  fi

  return 0
}

# 运行回归测试
run_regression_tests() {
  print_msg "$BLUE" ""
  print_msg "$BLUE" "运行回归测试..."

  if command -v npm &> /dev/null && [[ -f "package.json" ]]; then
    if npm test 2>&1; then
      print_msg "$GREEN" "  ✓ 回归测试通过"
      return 0
    else
      print_msg "$RED" "  ✗ 回归测试失败"
      return 1
    fi
  elif command -v pytest &> /dev/null; then
    if pytest tests/ 2>&1; then
      print_msg "$GREEN" "  ✓ 回归测试通过"
      return 0
    else
      print_msg "$RED" "  ✗ 回归测试失败"
      return 1
    fi
  fi

  print_msg "$YELLOW" "  ○ 无法运行回归测试"
  return 0
}

# ============================================================
# 主逻辑
# ============================================================

# 解析参数
while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      BASE_BRANCH="$2"
      shift 2
      ;;
    --affected-tests)
      AFFECTED_TESTS=true
      shift
      ;;
    --include-deps)
      INCLUDE_DEPS=true
      shift
      ;;
    --regression)
      REGRESSION=true
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

# 检查 git
if ! command -v git &> /dev/null || ! git rev-parse --git-dir &>/dev/null; then
  print_msg "$RED" "Error: not a git repository"
  exit 1
fi

# 获取变更文件
mapfile -t CHANGED_FILES < <(get_changed_files "$BASE_BRANCH")

if [[ ${#CHANGED_FILES[@]} -eq 0 ]]; then
  print_msg "$YELLOW" "没有检测到变更"
  exit 0
fi

print_msg "$BLUE" ""
print_msg "$BLUE" "╔═══════════════════════════════════════════════════════════════╗"
print_msg "$BLUE" "║           增量验证                                        ║"
print_msg "$BLUE" "╚═══════════════════════════════════════════════════════════════╝"

print_msg "$BLUE" ""
print_msg "$BLUE" "变更统计:"
print_msg "$BLUE" "─────────────────────────────────────────────────────────────"
print_msg "$BLUE" "比较基准: $BASE_BRANCH"
print_msg "$BLUE" "变更文件: ${#CHANGED_FILES[@]} 个"

if [[ "$VERBOSE" == "true" ]]; then
  print_msg "$BLUE" ""
  print_msg "$BLUE" "变更文件列表:"
  for file in "${CHANGED_FILES[@]}"; do
    echo "  - $file"
  done
fi

# 收集需要测试的文件
declare -a TEST_FILES=()

if [[ "$AFFECTED_TESTS" == "true" ]]; then
  print_msg "$BLUE" ""
  print_msg "$BLUE" "分析受影响的测试..."

  for file in "${CHANGED_FILES[@]}"; do
    # 跳过测试文件本身（已经在变更列表中）
    if [[ "$file" =~ \.(test|spec)\.(ts|tsx|js|jsx)$ ]]; then
      TEST_FILES+=("$file")
      continue
    fi

    # 查找对应的测试文件
    local test_file=$(find_test_for_file "$file")

    if [[ -n "$test_file" ]]; then
      TEST_FILES+=("$test_file")
      print_msg "$CYAN" "  → $file 对应测试: $test_file"
    fi

    # 分析依赖
    if [[ "$INCLUDE_DEPS" == "true" ]]; then
      local deps=$(analyze_dependencies "$file")
      while IFS= read -r dep; do
        if [[ -n "$dep" ]]; then
          local dep_test=$(find_test_for_file "$dep")
          if [[ -n "$dep_test" ]]; then
            TEST_FILES+=("$dep_test")
            print_msg "$CYAN" "  → $dep (依赖) 对应测试: $dep_test"
          fi
        fi
      done <<< "$deps"
    fi
  done

  # 去重
  IFS=$'\n' TEST_FILES=($(printf "%s\n" "${TEST_FILES[@]}" | sort -u))
  IFS=$' '
fi

# 运行增量测试
if [[ ${#TEST_FILES[@]} -gt 0 ]]; then
  if ! run_incremental_tests "${TEST_FILES[@]}"; then
    if [[ "$REGRESSION" == "true" ]]; then
      print_msg "$YELLOW" ""
      print_msg "$YELLOW" "增量测试失败，尝试运行回归测试..."
      run_regression_tests || exit 1
    else
      exit 1
    fi
  fi
fi

# 运行回归测试
if [[ "$REGRESSION" == "true" ]]; then
  run_regression_tests || exit 1
fi

print_msg "$GREEN" ""
print_msg "$GREEN" "╔═══════════════════════════════════════════════════════════════╗"
print_msg "$GREEN" "║           增量验证完成                                    ║"
print_msg "$GREEN" "╚═══════════════════════════════════════════════════════════════╝"