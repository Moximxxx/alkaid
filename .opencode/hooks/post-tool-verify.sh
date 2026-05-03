#!/bin/bash
# post-tool-verify.sh — 工具调用后验证
# 触发时机：Agent 执行工具调用后
# 用途：验证返回结果、错误分类、追踪记录

set -euo pipefail

TOOL_NAME="${1:-}"
TOOL_INPUT="${2:-}"
TOOL_OUTPUT="${3:-}"
EXIT_CODE="${4:-0}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[POST-TOOL-VALIDATE]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[POST-TOOL-VALIDATE]${NC} $1"
}

log_error() {
    echo -e "${RED}[POST-TOOL-VALIDATE]${NC} $1"
}

# 获取工具目录
TOOL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TRACES_DIR="$TOOL_DIR/traces"

# 确保 traces 目录存在
mkdir -p "$TRACES_DIR"

# 记录执行追踪
record_trace() {
    local tool="$1"
    local input="$2"
    local output="$3"
    local exit_code="$4"
    local timestamp=$(date -Iseconds)
    local trace_id="trace_$(date +%s)_$$"

    cat > "$TRACES_DIR/$trace_id.json" << EOF
{
  "trace_id": "$trace_id",
  "timestamp": "$timestamp",
  "tool": "$tool",
  "input": $input,
  "output": $output,
  "exit_code": $exit_code,
  "success": $([ "$exit_code" -eq 0 ] && echo "true" || echo "false")
}
EOF

    log_info "追踪记录已保存: $trace_id"
}

# 验证输出格式
verify_output() {
    local tool="$1"
    local output="$2"

    case "$tool" in
        read_file)
            verify_read_file_output "$output"
            ;;
        write_file)
            verify_write_file_output "$output"
            ;;
        execute_command)
            verify_execute_command_output "$output"
            ;;
        *)
            return 0
            ;;
    esac
}

verify_read_file_output() {
    local output="$1"

    # 检查是否是有效 JSON
    if ! echo "$output" | jq -e . >/dev/null 2>&1; then
        log_error "read_file: 输出不是有效 JSON"
        return 1
    fi

    # 检查必需字段
    if ! echo "$output" | jq -e '.content // .error' >/dev/null 2>&1; then
        log_error "read_file: 输出缺少 content 或 error 字段"
        return 1
    fi

    log_info "read_file 输出验证通过"
    return 0
}

verify_write_file_output() {
    local output="$1"

    if ! echo "$output" | jq -e . >/dev/null 2>&1; then
        log_error "write_file: 输出不是有效 JSON"
        return 1
    fi

    # 检查成功或错误标识
    if ! echo "$output" | jq -e '.success // .error' >/dev/null 2>&1; then
        log_error "write_file: 输出缺少 success 或 error 字段"
        return 1
    fi

    log_info "write_file 输出验证通过"
    return 0
}

verify_execute_command_output() {
    local output="$1"

    if ! echo "$output" | jq -e . >/dev/null 2>&1; then
        log_error "execute_command: 输出不是有效 JSON"
        return 1
    fi

    # 检查必需字段
    if ! echo "$output" | jq -e '.stdout // .stderr // .error' >/dev/null 2>&1; then
        log_error "execute_command: 输出缺少 stdout/stderr/error 字段"
        return 1
    fi

    log_info "execute_command 输出验证通过"
    return 0
}

# 错误分类
classify_error() {
    local tool="$1"
    local output="$2"

    local error_msg=$(echo "$output" | jq -r '.error // empty')

    if [ -z "$error_msg" ]; then
        return 0
    fi

    # 文件不存在
    if [[ "$error_msg" == *"No such file"* ]] || [[ "$error_msg" == *"ENOENT"* ]]; then
        echo "FILE_NOT_FOUND"
        return 0
    fi

    # 权限拒绝
    if [[ "$error_msg" == *"Permission denied"* ]] || [[ "$error_msg" == *"EACCES"* ]]; then
        echo "PERMISSION_DENIED"
        return 0
    fi

    # 超时
    if [[ "$error_msg" == *"timeout"* ]] || [[ "$error_msg" == *"timed out"* ]]; then
        echo "TIMEOUT"
        return 0
    fi

    # 网络错误
    if [[ "$error_msg" == *"Connection refused"* ]] || [[ "$error_msg" == *"ECONNREFUSED"* ]]; then
        echo "NETWORK_ERROR"
        return 0
    fi

    # 未知错误
    echo "UNKNOWN_ERROR"
}

# 主验证逻辑
main() {
    log_info "开始验证: $TOOL_NAME (exit: $EXIT_CODE)"

    # 记录追踪
    record_trace "$TOOL_NAME" "$TOOL_INPUT" "$TOOL_OUTPUT" "$EXIT_CODE"

    # 如果工具执行失败，记录错误但不拦截
    if [ "$EXIT_CODE" -ne 0 ]; then
        local error_type=$(classify_error "$TOOL_NAME" "$TOOL_OUTPUT")
        log_warn "工具执行失败: $TOOL_NAME, 错误类型: $error_type"

        # 可以在这里添加告警逻辑
        if [ "$error_type" = "TIMEOUT" ]; then
            log_warn "检测到超时错误，建议检查命令复杂度"
        fi
    else
        # 验证成功输出的格式
        if ! verify_output "$TOOL_NAME" "$TOOL_OUTPUT"; then
            log_error "输出格式验证失败"
            # 不拦截，只记录
        fi
    fi

    log_info "验证完成"
    exit 0
}

main
