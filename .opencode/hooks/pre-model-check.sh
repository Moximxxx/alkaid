#!/bin/bash
# pre-model-check.sh — 模型调用前检查
# 触发时机：Agent 调用 LLM 前
# 用途：上下文长度检查、Token 预算控制、优先级判断

set -euo pipefail

MAX_CONTEXT_TOKENS="${MAX_CONTEXT_TOKENS:-200000}"
MAX_PROMPT_TOKENS="${MAX_PROMPT_TOKENS:-180000}"
WARN_THRESHOLD="${WARN_THRESHOLD:-0.8}"
CRITICAL_THRESHOLD="${CRITICAL_THRESHOLD:-0.9}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[PRE-MODEL-CHECK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[PRE-MODEL-CHECK]${NC} $1"
}

log_error() {
    echo -e "${RED}[PRE-MODEL-CHECK]${NC} $1"
}

# Token 估算（简单实现，实际应使用 tiktoken 或类似库）
estimate_tokens() {
    local text="$1"
    # 粗略估算：每 4 个字符约等于 1 个 token
    echo "$text" | wc -c | awk '{printf "%.0f", $1 / 4}'
}

# 计算当前上下文使用率
calculate_context_usage() {
    local context="$1"

    local total_tokens=$(estimate_tokens "$context")
    local usage=$(awk "BEGIN {printf \"%.2f\", $total_tokens / $MAX_CONTEXT_TOKENS}")

    echo "$usage"
}

# 检查上下文使用率
check_context_usage() {
    local context="$1"

    local usage=$(calculate_context_usage "$context")
    local usage_percent=$(awk "BEGIN {printf \"%.0f\", $usage * 100}")

    log_info "上下文使用率: ${usage_percent}%"

    # 检查是否超过 90%
    local critical=$(awk "BEGIN {print ($usage >= $CRITICAL_THRESHOLD) ? 1 : 0}")
    if [ "$critical" -eq 1 ]; then
        log_error "上下文使用率超过 ${CRITICAL_THRESHOLD}%，必须压缩"
        return 1
    fi

    # 检查是否超过 80%
    local warn=$(awk "BEGIN {print ($usage >= $WARN_THRESHOLD) ? 1 : 0}")
    if [ "$warn" -eq 1 ]; then
        log_warn "上下文使用率超过 ${WARN_THRESHOLD}%，建议压缩"
    fi

    return 0
}

# 压缩策略
apply_compression() {
    local context="$1"
    local strategy="${2:-summarize}"

    log_info "应用压缩策略: $strategy"

    case "$strategy" in
        summarize)
            # 总结旧消息
            log_info "策略: 总结旧消息"
            # 实现总结逻辑
            ;;
        truncate)
            # 截断旧消息
            log_info "策略: 截断旧消息"
            # 实现截断逻辑
            ;;
        externalize)
            # 外化低优先级信息
            log_info "策略: 外化到文件"
            # 实现外化逻辑
            ;;
        *)
            log_error "未知压缩策略: $strategy"
            return 1
            ;;
    esac

    return 0
}

# 优先级判断
check_priority() {
    local task_type="$1"

    case "$task_type" in
        critical|urgent)
            echo "HIGH"
            ;;
        feature|bugfix)
            echo "MEDIUM"
            ;;
        refactor|cleanup)
            echo "LOW"
            ;;
        *)
            echo "MEDIUM"
            ;;
    esac
}

# Token 预算控制
check_token_budget() {
    local messages="$1"

    # 估算总 token
    local total_tokens=$(estimate_tokens "$messages")
    local prompt_tokens=$(estimate_tokens "$messages")

    log_info "总 Token 估算: $total_tokens"
    log_info "Prompt Token 估算: $prompt_tokens"

    # 检查是否超过 Prompt 预算
    if [ "$prompt_tokens" -gt "$MAX_PROMPT_TOKENS" ]; then
        log_error "Prompt 超过预算 ($prompt_tokens > $MAX_PROMPT_TOKENS)"
        return 1
    fi

    return 0
}

# 安全检查
security_check() {
    local content="$1"

    # 检查是否包含敏感信息
    if echo "$content" | grep -qi "password\|secret\|api_key\|token"; then
        log_warn "检测到可能包含敏感信息"
        # 不拦截，只警告
    fi

    # 检查 prompt 注入
    if echo "$content" | grep -qi "ignore previous instructions\|ignore all commands"; then
        log_error "检测到潜在的 prompt 注入攻击"
        return 1
    fi

    return 0
}

# 主检查逻辑
main() {
    local context="${1:-}"
    local task_type="${2:-feature}"

    log_info "开始模型调用前检查"
    log_info "任务类型: $task_type"
    log_info "优先级: $(check_priority "$task_type")"

    # 安全检查
    if ! security_check "$context"; then
        log_error "安全检查失败"
        exit 1
    fi

    # Token 预算检查
    if ! check_token_budget "$context"; then
        log_error "Token 预算检查失败"
        exit 1
    fi

    # 上下文使用率检查
    if ! check_context_usage "$context"; then
        log_warn "上下文使用率过高，尝试压缩..."

        # 根据任务类型选择压缩策略
        local priority=$(check_priority "$task_type")
        local strategy="summarize"

        if [ "$priority" = "LOW" ]; then
            strategy="truncate"
        elif [ "$priority" = "HIGH" ]; then
            strategy="externalize"
        fi

        if ! apply_compression "$context" "$strategy"; then
            log_error "压缩失败"
            exit 1
        fi

        # 重新检查
        if ! check_context_usage "$context"; then
            log_error "压缩后仍然超出限制"
            exit 1
        fi
    fi

    log_info "所有检查通过"
    exit 0
}

main "$@"
