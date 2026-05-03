#!/bin/bash
# pre-tool-validate.sh — 工具调用前验证
# 触发时机：Agent 执行工具调用前
# 用途：验证输入参数 Schema、权限检查

set -euo pipefail

TOOL_NAME="${1:-}"
TOOL_INPUT="${2:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[PRE-TOOL-VALIDATE]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[PRE-TOOL-VALIDATE]${NC} $1"
}

log_error() {
    echo -e "${RED}[PRE-TOOL-VALIDATE]${NC} $1"
}

# 检查工具名称
if [ -z "$TOOL_NAME" ]; then
    log_error "工具名称不能为空"
    exit 1
fi

# 获取工具定义路径
TOOL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCHEMAS_DIR="$TOOL_DIR/schemas"

log_info "验证工具: $TOOL_NAME"

# 验证函数
validate_tool_input() {
    local tool="$1"
    local input="$2"

    case "$tool" in
        read_file)
            validate_read_file "$input"
            ;;
        write_file)
            validate_write_file "$input"
            ;;
        execute_command)
            validate_execute_command "$input"
            ;;
        search_code)
            validate_search_code "$input"
            ;;
        *)
            log_info "未知工具类型，跳过验证: $tool"
            return 0
            ;;
    esac
}

validate_read_file() {
    local input="$1"

    # 提取 path 参数
    local path=$(echo "$input" | jq -r '.path // empty')

    if [ -z "$path" ]; then
        log_error "read_file: path 参数缺失"
        return 1
    fi

    # 检查路径安全（防止路径穿越）
    if [[ "$path" == *".."* ]]; then
        log_error "read_file: 禁止使用 '..' 路径穿越"
        return 1
    fi

    # 检查是否在允许的目录内
    local allowed_dirs="${ALLOWED_READ_DIRS:-.}"
    local in_allowed=0
    for dir in $allowed_dirs; do
        if [[ "$path" == "$dir"* ]]; then
            in_allowed=1
            break
        fi
    done

    if [ "$in_allowed" -eq 0 ]; then
        log_error "read_file: 路径不在允许范围内: $path"
        return 1
    fi

    log_info "read_file 验证通过: $path"
    return 0
}

validate_write_file() {
    local input="$1"

    local path=$(echo "$input" | jq -r '.path // empty')

    if [ -z "$path" ]; then
        log_error "write_file: path 参数缺失"
        return 1
    fi

    # 检查路径安全
    if [[ "$path" == *".."* ]]; then
        log_error "write_file: 禁止使用 '..' 路径穿越"
        return 1
    fi

    # 检查文件扩展名（防止写入危险文件）
    local dangerous_exts="${DANGEROUS_EXTENSIONS:-.sh .bat .exe}"
    for ext in $dangerous_exts; do
        if [[ "$path" == *"$ext" ]]; then
            log_warn "write_file: 写入危险文件类型: $ext"
            # 可以选择拦截或警告后放行
        fi
    done

    log_info "write_file 验证通过: $path"
    return 0
}

validate_execute_command() {
    local input="$1"

    local command=$(echo "$input" | jq -r '.command // empty')

    if [ -z "$command" ]; then
        log_error "execute_command: command 参数缺失"
        return 1
    fi

    # 检查是否包含危险命令
    local dangerous_commands="${DANGEROUS_COMMANDS:-rm -rf chown chmod}"
    for cmd in $dangerous_commands; do
        if [[ "$command" == *"$cmd"* ]]; then
            log_error "execute_command: 禁止执行危险命令: $cmd"
            return 1
        fi
    done

    # 检查命令长度
    if [ ${#command} -gt 1000 ]; then
        log_error "execute_command: 命令过长 (${#command} > 1000)"
        return 1
    fi

    log_info "execute_command 验证通过"
    return 0
}

validate_search_code() {
    local input="$1"

    local pattern=$(echo "$input" | jq -r '.pattern // empty')

    if [ -z "$pattern" ]; then
        log_error "search_code: pattern 参数缺失"
        return 1
    fi

    # 检查正则表达式语法（简单检查）
    if [[ "$pattern" == *"<script>"* ]] || [[ "$pattern" == *"javascript:"* ]]; then
        log_error "search_code: 禁止搜索危险模式"
        return 1
    fi

    log_info "search_code 验证通过"
    return 0
}

# 主验证逻辑
main() {
    log_info "开始验证: $TOOL_NAME"

    if ! validate_tool_input "$TOOL_NAME" "$TOOL_INPUT"; then
        log_error "验证失败，工具调用被拦截"
        exit 1
    fi

    log_info "验证通过"
    exit 0
}

main
