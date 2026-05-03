# dep-tracker.sh — 依赖追踪脚本
# 版本: v2.0.0
# 更新: 2026-04-30
#
# 功能:
# 1. 追踪代码文件的依赖关系
# 2. 构建依赖图
# 3. 分析变更传播影响
#
# 用法:
#   bash dep-tracker.sh <file> [options]
#
# 选项:
#   --deps           显示直接依赖
#   --reverse        显示反向依赖（被谁依赖）
#   --impact FILE    分析文件变更的影响
#   --graph          输出 DOT 格式依赖图
#   --json           JSON 格式输出

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
TARGET_FILE=""
MODE="deps"  # deps | reverse | impact
OUTPUT_FORMAT="text"  # text | json | dot

# 缓存文件
readonly CACHE_DIR="${HARNESS_STATUS_DIR:-/tmp/harness-status}"
readonly CACHE_FILE="$CACHE_DIR/dep-graph.json"

# ============================================================
# 函数
# ============================================================

print_msg() {
  local color="$1"
  local msg="$2"
  echo -e "${color}${msg}${NC}"
}

# 解析 import 语句
parse_imports() {
  local file="$1"
  local ext="${file##*.}"

  if [[ ! -f "$file" ]]; then
    return
  fi

  case "$ext" in
    ts|tsx|js|jsx)
      # TypeScript/JavaScript imports
      grep -E "^import\s+" "$file" 2>/dev/null | \
        sed -E 's/.*import\s+.*from\s+['\''"]?([^'\''"]+)['\''"]?.*/\1/' | \
        grep -v "^$\|^\s*//"
      ;;
    py)
      # Python imports
      grep -E "^import\s+|^from\s+" "$file" 2>/dev/null | \
        sed -E 's/^(import\s+|from\s+)([^.]+).*/\2/' | \
        grep -v "^$\|^\s*#"
      ;;
    go)
      # Go imports
      grep -E "^\s*\"[^\"]+\"" "$file" 2>/dev/null | \
        sed -E 's/.*"([^"]+)".*/\1/'
      ;;
  esac
}

# 解析 require 语句
parse_requires() {
  local file="$1"

  grep -E "require\s*\(" "$file" 2>/dev/null | \
    sed -E 's/.*require\s*\(\s*['\''"]?([^'\''"]+)['\''"]?\s*\).*/\1/' | \
    grep -v "^$\|^\s*//"
}

# 解析依赖路径
resolve_import_path() {
  local file="$1"
  local import_path="$2"

  # 跳过外部包
  if [[ "$import_path" == @* ]] || [[ "$import_path" == *.*/* ]]; then
    # 可能是 npm 包或其他路径
    return
  fi

  local file_dir=$(dirname "$file")
  local base_dir=$(dirname "$PROJECT_ROOT")

  # 尝试多种扩展名
  for ext in "ts" "tsx" "js" "jsx" "py"; do
    local resolved="$file_dir/$import_path.$ext"
    if [[ -f "$resolved" ]]; then
      echo "${resolved#$PROJECT_ROOT/}"
      return
    fi

    resolved="$file_dir/$import_path/index.$ext"
    if [[ -f "$resolved" ]]; then
      echo "${resolved#$PROJECT_ROOT/}"
      return
    fi
  done
}

# 获取直接依赖
get_direct_deps() {
  local file="$1"
  local deps=()

  # 解析 imports
  local imports=$(parse_imports "$file")
  while IFS= read -r import_path; do
    if [[ -z "$import_path" ]]; then
      continue
    fi

    local resolved=$(resolve_import_path "$file" "$import_path")
    if [[ -n "$resolved" ]]; then
      deps+=("$resolved")
    fi
  done <<< "$imports"

  # 解析 requires
  local requires=$(parse_requires "$file")
  while IFS= read -r require_path; do
    if [[ -z "$require_path" ]]; then
      continue
    fi

    local resolved=$(resolve_import_path "$file" "$require_path")
    if [[ -n "$resolved" ]]; then
      deps+=("$resolved")
    fi
  done <<< "$requires"

  # 去重
  printf "%s\n" "${deps[@]}" | sort -u
}

# 获取反向依赖（被谁依赖）
get_reverse_deps() {
  local file="$1"
  local file_name=$(basename "$file")
  local base_name="${file_name%.*}"
  local deps=()

  # 搜索引用该文件的所有文件
  for src_file in $(find "$PROJECT_ROOT/src" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) 2>/dev/null); do
    if grep -qE "import.*from.*['\"]\./${base_name}['\"]" "$src_file" 2>/dev/null; then
      deps+=("${src_file#$PROJECT_ROOT/}")
    fi
  done

  # 去重
  printf "%s\n" "${deps[@]}" | sort -u
}

# 分析影响范围
analyze_impact() {
  local changed_file="$1"
  local visited=()
  local queue=("$changed_file")

  while [[ ${#queue[@]} -gt 0 ]]; do
    local current="${queue[0]}"
    queue=("${queue[@]:1}")

    # 检查是否已访问
    if printf "%s\n" "${visited[@]}" | grep -q "^$current$"; then
      continue
    fi
    visited+=("$current")

    # 获取直接依赖
    local deps=$(get_direct_deps "$PROJECT_ROOT/$current" 2>/dev/null)
    while IFS= read -r dep; do
      if [[ -n "$dep" ]]; then
        queue+=("$dep")
      fi
    done <<< "$deps"
  done

  # 去重并输出
  printf "%s\n" "${visited[@]}" | sort -u
}

# 构建依赖图（DOT 格式）
build_dep_graph() {
  local root_file="$1"
  local visited=()
  local queue=("$root_file")

  echo "digraph dependency_graph {"

  while [[ ${#queue[@]} -gt 0 ]]; do
    local current="${queue[0]}"
    queue=("${queue[@]:1}")

    if printf "%s\n" "${visited[@]}" | grep -q "^$current$"; then
      continue
    fi
    visited+=("$current")

    local deps=$(get_direct_deps "$PROJECT_ROOT/$current" 2>/dev/null)
    while IFS= read -r dep; do
      if [[ -n "$dep" ]]; then
        echo "  \"$current\" -> \"$dep\";"
        queue+=("$dep")
      fi
    done <<< "$deps"
  done

  echo "}"
}

# 输出文本格式
output_text() {
  local file="$1"
  local deps=("$@")

  print_msg "$BLUE" ""
  print_msg "$BLUE" "╔═══════════════════════════════════════════════════════════════╗"
  print_msg "$BLUE" "║           依赖追踪                                          ║"
  print_msg "$BLUE" "╚═══════════════════════════════════════════════════════════════╝"

  print_msg "$BLUE" ""
  print_msg "$BLUE" "文件: $file"
  print_msg "$BLUE" ""

  if [[ ${#deps[@]} -gt 0 ]]; then
    print_msg "$CYAN" "依赖 (${#deps[@]}):"
    print_msg "$CYAN" "─────────────────────────────────────────────────────────────"
    for dep in "${deps[@]}"; do
      print_msg "$GREEN" "  → $dep"
    done
  else
    print_msg "$YELLOW" "  无依赖"
  fi

  print_msg "$BLUE" ""
}

# 输出 JSON 格式
output_json() {
  local file="$1"
  shift
  local deps=("$@")

  echo "{"
  echo "  \"file\": \"$file\","
  echo "  \"dependencies\": ["

  local first=true
  for dep in "${deps[@]}"; do
    if [[ "$first" == "true" ]]; then
      first=false
    else
      echo ","
    fi
    echo -n "    \"$dep\""
  done

  echo ""
  echo "  ],"
  echo "  \"count\": ${#deps[@]}"
  echo "}"
}

# ============================================================
# 主逻辑
# ============================================================

# 解析参数
while [[ $# -gt 0 ]]; do
  case "$1" in
    --deps)
      MODE="deps"
      shift
      ;;
    --reverse)
      MODE="reverse"
      shift
      ;;
    --impact)
      MODE="impact"
      TARGET_FILE="$2"
      shift 2
      ;;
    --graph)
      MODE="graph"
      shift
      ;;
    --json)
      OUTPUT_FORMAT="json"
      shift
      ;;
    -h|--help)
      echo "用法: dep-tracker.sh <file> [options]"
      echo ""
      echo "选项:"
      echo "  --deps           显示直接依赖"
      echo "  --reverse         显示反向依赖（被谁依赖）"
      echo "  --impact FILE     分析文件变更的影响"
      echo "  --graph           输出 DOT 格式依赖图"
      echo "  --json            JSON 格式输出"
      exit 0
      ;;
    *)
      if [[ -z "$TARGET_FILE" ]]; then
        TARGET_FILE="$1"
      fi
      shift
      ;;
  esac
done

# 检查参数
if [[ -z "$TARGET_FILE" ]]; then
  echo "Error: No file specified"
  echo "用法: dep-tracker.sh <file> [options]"
  exit 1
fi

# 规范化文件路径
TARGET_FILE="${TARGET_FILE#$PROJECT_ROOT/}"

# 执行对应模式
case "$MODE" in
  deps)
    mapfile -t DEPS < <(get_direct_deps "$PROJECT_ROOT/$TARGET_FILE" 2>/dev/null || echo "")
    if [[ "$OUTPUT_FORMAT" == "json" ]]; then
      output_json "$TARGET_FILE" "${DEPS[@]}"
    else
      output_text "$TARGET_FILE" "${DEPS[@]}"
    fi
    ;;

  reverse)
    mapfile -t DEPS < <(get_reverse_deps "$PROJECT_ROOT/$TARGET_FILE" 2>/dev/null || echo "")
    if [[ "$OUTPUT_FORMAT" == "json" ]]; then
      output_json "$TARGET_FILE" "${DEPS[@]}"
    else
      output_text "$TARGET_FILE" "${DEPS[@]}"
    fi
    ;;

  impact)
    print_msg "$BLUE" "分析影响范围: $TARGET_FILE"
    mapfile -t IMPACTED < <(analyze_impact "$TARGET_FILE" 2>/dev/null || echo "")

    if [[ "$OUTPUT_FORMAT" == "json" ]]; then
      output_json "$TARGET_FILE" "${IMPACTED[@]}"
    else
      print_msg "$BLUE" ""
      print_msg "$BLUE" "影响范围 (${#IMPACTED[@]} 文件):"
      print_msg "$BLUE" "─────────────────────────────────────────────────────────────"
      for file in "${IMPACTED[@]}"; do
        print_msg "$CYAN" "  → $file"
      done
    fi
    ;;

  graph)
    build_dep_graph "$TARGET_FILE"
    ;;
esac