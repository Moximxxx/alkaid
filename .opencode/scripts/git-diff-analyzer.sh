# git-diff-analyzer.sh — Git 变更分析脚本
# 版本: v2.0.0
# 更新: 2026-04-30
#
# 功能:
# 1. 分析 git diff，提取变更文件
# 2. 识别变更类型（新增/修改/删除）
# 3. 分析变更统计
# 4. 生成变更影响报告
#
# 用法:
#   bash git-diff-analyzer.sh [options]
#
# 选项:
#   --base BASE        比较的基础分支（默认: main）
#   --since SINCE      变更起始时间
#   --until UNTIL      变更结束时间
#   --author AUTHOR    按作者过滤
#   --stat            只显示统计信息
#   --files           只显示文件列表
#   --json            JSON 格式输出
#   --impact          生成影响分析

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

# 默认参数
BASE_BRANCH="${BASE_BRANCH:-main}"
SINCE=""
UNTIL=""
AUTHOR=""
STAT_ONLY=false
FILES_ONLY=false
JSON_OUTPUT=false
IMPACT_ANALYSIS=false

# ============================================================
# 函数
# ============================================================

print_msg() {
  local color="$1"
  local msg="$2"
  echo -e "${color}${msg}${NC}"
}

# 获取变更文件列表
get_changed_files() {
  local base="$1"
  local since="$2"
  local until="$3"
  local author="$4"

  local cmd="git diff --name-only"
  local range="HEAD"

  if [[ -n "$base" ]]; then
    # 比较指定分支
    if git rev-parse "$base" &>/dev/null; then
      range="$base...HEAD"
    fi
  fi

  cmd="$cmd $range"

  if [[ -n "$since" ]]; then
    cmd="$cmd --since='$since'"
  fi

  if [[ -n "$until" ]]; then
    cmd="$cmd --until='$until'"
  fi

  if [[ -n "$author" ]]; then
    cmd="$cmd --author='$author'"
  fi

  eval "$cmd" 2>/dev/null || echo ""
}

# 获取变更统计
get_change_stats() {
  local base="$1"

  local range="$base...HEAD"
  if [[ -z "$base" ]]; then
    range="HEAD"
  fi

  git diff --numstat "$range" 2>/dev/null | awk '
    {
      additions += $1
      deletions += $2
      files++
    }
    END {
      print files, additions, deletions
    }
  '
}

# 获取变更类型
get_change_type() {
  local file="$1"
  local base="$2"

  if ! git ls-files --error-unmatch "$file" &>/dev/null 2>&1; then
    echo "deleted"
    return
  fi

  local range="$base...HEAD"
  if [[ -z "$base" ]]; then
    range="HEAD"
  fi

  if git diff --cached --quiet "$range" -- "$file" 2>/dev/null; then
    if git diff --quiet "$range" -- "$file" 2>/dev/null; then
      echo "modified"
    else
      echo "staged"
    fi
  else
    echo "staged"
  fi
}

# 获取文件变更状态
get_file_status() {
  local file="$1"

  if ! git ls-files --error-unmatch "$file" &>/dev/null 2>&1; then
    echo "D"  # deleted in index
    return
  fi

  git status --porcelain -- "$file" 2>/dev/null | head -c2
}

# 获取变更的文件分类
classify_changes() {
  local file="$1"
  local ext="${file##*.}"
  local dir=$(dirname "$file")

  case "$ext" in
    ts|tsx|js|jsx)
      if [[ "$dir" == *"test"* ]] || [[ "$file" =~ \.(test|spec)\.(ts|tsx|js|jsx)$ ]]; then
        echo "test"
      else
        echo "source"
      fi
      ;;
    py)
      if [[ "$dir" == *"test"* ]] || [[ "$file" =~ _test\.py$ ]] || [[ "$file" =~ test_\.py$ ]]; then
        echo "test"
      else
        echo "source"
      fi
      ;;
    go)
      if [[ "$file" =~ _test\.go$ ]]; then
        echo "test"
      else
        echo "source"
      fi
      ;;
    md|mdx|txt|rst)
      echo "docs"
      ;;
    json|yaml|yml|toml|ini|conf)
      echo "config"
      ;;
    css|scss|sass|less)
      echo "style"
      ;;
    png|jpg|jpeg|gif|svg|ico)
      echo "asset"
      ;;
    *)
      if [[ -d "$file" ]] || [[ "$file" == "Makefile" ]] || [[ "$file" == "Dockerfile" ]]; then
        echo "build"
      else
        echo "other"
      fi
      ;;
  esac
}

# 生成影响分析
generate_impact_analysis() {
  local files=("$@")
  local source_files=()
  local test_files=()
  local config_files=()
  local docs_files=()

  for file in "${files[@]}"; do
    local category=$(classify_changes "$file")
    case "$category" in
      source)
        source_files+=("$file")
        ;;
      test)
        test_files+=("$file")
        ;;
      config)
        config_files+=("$file")
        ;;
      docs)
        docs_files+=("$file")
        ;;
    esac
  done

  print_msg "$BLUE" ""
  print_msg "$BLUE" "影响分析:"
  print_msg "$BLUE" "─────────────────────────────────────────────────────"

  if [[ ${#source_files[@]} -gt 0 ]]; then
    print_msg "$CYAN" "源代码文件 (${#source_files[@]}):"
    for file in "${source_files[@]}"; do
      echo "  - $file"
    done
  fi

  if [[ ${#test_files[@]} -gt 0 ]]; then
    print_msg "$GREEN" "测试文件 (${#test_files[@]}):"
    for file in "${test_files[@]}"; do
      echo "  - $file"
    done
  fi

  if [[ ${#config_files[@]} -gt 0 ]]; then
    print_msg "$YELLOW" "配置文件 (${#config_files[@]}):"
    for file in "${config_files[@]}"; do
      echo "  - $file"
    done
  fi

  if [[ ${#docs_files[@]} -gt 0 ]]; then
    print_msg "$BLUE" "文档文件 (${#docs_files[@]}):"
    for file in "${docs_files[@]}"; do
      echo "  - $file"
    done
  fi
}

# 生成 JSON 输出
generate_json() {
  local files=("$@")
  local base="$1"

  echo "{"
  echo "  \"base\": \"$base\","
  echo "  \"timestamp\": \"$(date -Iseconds)\","
  echo "  \"changes\": ["

  local first=true
  for file in "${files[@]}"; do
    local status=$(get_file_status "$file")
    local category=$(classify_changes "$file")
    local additions=$(git diff --numstat HEAD -- "$file" 2>/dev/null | awk '{print $1}' || echo "0")
    local deletions=$(git diff --numstat HEAD -- "$file" 2>/dev/null | awk '{print $2}' || echo "0")

    if [[ "$first" == "true" ]]; then
      first=false
    else
      echo ","
    fi

    echo -n "    {"
    echo -n "\"file\": \"$file\", "
    echo -n "\"status\": \"$status\", "
    echo -n "\"category\": \"$category\", "
    echo -n "\"additions\": $additions, "
    echo -n "\"deletions\": $deletions"
    echo -n "}"
  done

  echo ""
  echo "  ],"

  # 统计
  local stats=$(get_change_stats "$base")
  read -r file_count additions deletions <<< "$stats"

  echo "  \"stats\": {"
  echo "    \"total_files\": $file_count,"
  echo "    \"total_additions\": $additions,"
  echo "    \"total_deletions\": $deletions"
  echo "  }"
  echo "}"
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
    --since)
      SINCE="$2"
      shift 2
      ;;
    --until)
      UNTIL="$2"
      shift 2
      ;;
    --author)
      AUTHOR="$2"
      shift 2
      ;;
    --stat)
      STAT_ONLY=true
      shift
      ;;
    --files)
      FILES_ONLY=true
      shift
      ;;
    --json)
      JSON_OUTPUT=true
      shift
      ;;
    --impact)
      IMPACT_ANALYSIS=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# 检查 git
if ! command -v git &> /dev/null; then
  print_msg "$RED" "Error: git not found"
  exit 1
fi

if ! git rev-parse --git-dir &>/dev/null; then
  print_msg "$RED" "Error: not a git repository"
  exit 1
fi

# 获取变更文件
mapfile -t CHANGED_FILES < <(get_changed_files "$BASE_BRANCH" "$SINCE" "$UNTIL" "$AUTHOR")

# 检查是否有变更
if [[ ${#CHANGED_FILES[@]} -eq 0 ]]; then
  print_msg "$YELLOW" "No changes found"
  exit 0
fi

# 只显示文件列表
if [[ "$FILES_ONLY" == "true" ]]; then
  for file in "${CHANGED_FILES[@]}"; do
    echo "$file"
  done
  exit 0
fi

# 只显示统计
if [[ "$STAT_ONLY" == "true" ]]; then
  local stats=$(get_change_stats "$BASE_BRANCH")
  read -r file_count additions deletions <<< "$stats"

  print_msg "$BLUE" "变更统计:"
  print_msg "$BLUE" "─────────────────────────────────────────────────────"
  print_msg "$BLUE" "总文件数: $file_count"
  print_msg "$GREEN" "新增行数: +$additions"
  print_msg "$RED" "删除行数: -$deletions"
  exit 0
fi

# JSON 输出
if [[ "$JSON_OUTPUT" == "true" ]]; then
  generate_json "${CHANGED_FILES[@]}"
  exit 0
fi

# 完整报告
print_msg "$BLUE" ""
print_msg "$BLUE" "╔═══════════════════════════════════════════════════════════════╗"
print_msg "$BLUE" "║           Git 变更分析                                      ║"
print_msg "$BLUE" "╚═══════════════════════════════════════════════════════════════╝"

# 变更统计
local stats=$(get_change_stats "$BASE_BRANCH")
read -r file_count additions deletions <<< "$stats"

print_msg "$BLUE" ""
print_msg "$BLUE" "变更统计:"
print_msg "$BLUE" "─────────────────────────────────────────────────────────────"
print_msg "$BLUE" "比较基准: $BASE_BRANCH"
print_msg "$BLUE" "总文件数: $file_count"
print_msg "$GREEN" "新增行数: +$additions"
print_msg "$RED" "删除行数: -$deletions"

# 变更文件列表
print_msg "$BLUE" ""
print_msg "$BLUE" "变更文件:"
print_msg "$BLUE" "─────────────────────────────────────────────────────────────"

for file in "${CHANGED_FILES[@]}"; do
  local status=$(get_file_status "$file")
  local category=$(classify_changes "$file")

  local status_symbol=""
  local status_color="$NC"

  case "$status" in
    "A") status_symbol="[+]" ; status_color="$GREEN" ;;
    "M") status_symbol="[M]" ; status_color="$BLUE" ;;
    "D") status_symbol="[-]" ; status_color="$RED" ;;
    "R") status_symbol="[R]" ; status_color="$YELLOW" ;;
    *) status_symbol="[?]" ;;
  esac

  printf "  ${status_color}%s${NC} %-50s ${CYAN}(%s)${NC}\n" \
    "$status_symbol" "$file" "$category"
done

# 影响分析
if [[ "$IMPACT_ANALYSIS" == "true" ]]; then
  generate_impact_analysis "${CHANGED_FILES[@]}"
fi

print_msg "$BLUE" ""
print_msg "$BLUE" "─────────────────────────────────────────────────────────────"
print_msg "$BLUE" "分析完成: $(date '+%Y-%m-%d %H:%M:%S')"