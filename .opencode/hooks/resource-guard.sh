#!/bin/bash
# resource-guard.sh — 资源监控
# 版本: v2.0.0
# 更新: 2026-04-30
#
# 功能:
# 1. 监控 Token 使用
# 2. 监控循环迭代次数
# 3. 监控内存使用
# 4. 触发熔断机制
#
# 用法:
#   source resource-guard.sh
#   # 然后调用以下函数:
#   check_token_limit <current_tokens>
#   check_loop_iteration <iteration_count> <operation>
#   check_memory_limit
#   get_resource_status
#
# 配置常量 (可在外部覆盖):
#   MAX_TOKENS=180000
#   MAX_LOOP_ITERATIONS=200
#   MAX_MEMORY_MB=2048
#   TOKEN_WARNING_PERCENT=80
#   LOOP_WARNING_COUNT=150

# ============================================================
# 配置
# ============================================================

# 资源限制
readonly MAX_TOKENS="${MAX_TOKENS:-180000}"
readonly MAX_LOOP_ITERATIONS="${MAX_LOOP_ITERATIONS:-200}"
readonly MAX_MEMORY_MB="${MAX_MEMORY_MB:-2048}"
readonly MAX_TASK_DURATION_MINUTES="${MAX_TASK_DURATION_MINUTES:-30}"
readonly MAX_TOOL_CALLS="${MAX_TOOL_CALLS:-500}"

# 警告阈值
readonly TOKEN_WARNING_PERCENT="${TOKEN_WARNING_PERCENT:-80}"
readonly LOOP_WARNING_COUNT="${LOOP_WARNING_COUNT:-150}"
readonly MEMORY_WARNING_PERCENT="${MEMORY_WARNING_PERCENT:-80}"

# 状态文件
readonly STATUS_DIR="${HARNESS_STATUS_DIR:-/tmp/harness-status}"
readonly STATUS_FILE="$STATUS_DIR/resource-status.json"

# ============================================================
# 状态管理
# ============================================================

# 初始化状态
init_resource_status() {
  mkdir -p "$STATUS_DIR"
  if [[ ! -f "$STATUS_FILE" ]]; then
    cat > "$STATUS_FILE" << EOF
{
  "token_usage": 0,
  "token_warning_issued": false,
  "loop_iterations": 0,
  "loop_warning_issued": false,
  "memory_usage_mb": 0,
  "tool_calls": 0,
  "task_start_time": $(date +%s),
  "circuit_breaker_triggered": false,
  "last_reset": $(date +%s)
}
EOF
  fi
}

# 读取状态
read_status() {
  if [[ ! -f "$STATUS_FILE" ]]; then
    init_resource_status
  fi
  cat "$STATUS_FILE"
}

# 更新状态
update_status() {
  local key="$1"
  local value="$2"
  local status=$(read_status)

  # 使用 jq 更新 JSON（如果可用）
  if command -v jq &> /dev/null; then
    echo "$status" | jq --argjson val "$value" ".$key = \$val" > "$STATUS_FILE.tmp"
    mv "$STATUS_FILE.tmp" "$STATUS_FILE"
  else
    # 简单文本替换
    sed -i "s/\"$key\": [0-9]*/\"$key\": $value/" "$STATUS_FILE"
  fi
}

# 获取状态值
get_status() {
  local key="$1"
  local status=$(read_status)

  if command -v jq &> /dev/null; then
    echo "$status" | jq -r ".$key"
  else
    grep "\"$key\":" "$STATUS_FILE" | sed 's/.*: *//' | tr -d ','
  fi
}

# ============================================================
# Token 监控
# ============================================================

# 检查 Token 限制
# 用法: check_token_limit <current_tokens>
# 返回: 0 通过, 1 超限, 2 警告
check_token_limit() {
  local current_tokens=${1:-0}
  local max_tokens=$MAX_TOKENS
  local warning_threshold=$((max_tokens * TOKEN_WARNING_PERCENT / 100))
  local compression_threshold=$((max_tokens * 92 / 100))

  # 更新状态
  update_status "token_usage" "$current_tokens"

  # 检查是否超限
  if [[ $current_tokens -ge $max_tokens ]]; then
    echo ""
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│  🚨  Token 限制超限                                         │"
    echo "├─────────────────────────────────────────────────────────────┤"
    echo "│                                                             │"
    echo "│  当前使用: $current_tokens / $max_tokens tokens              │"
    echo "│  百分比: $((current_tokens * 100 / max_tokens))%                                  │"
    echo "│                                                             │"
    echo "│  操作选项:                                                  │"
    echo "│  [c] 继续执行（触发上下文压缩）                             │"
    echo "│  [q] 退出任务                                              │"
    echo "│                                                             │"
    echo -n "│  请输入选择: _                                              │"
    echo ""
    echo "└─────────────────────────────────────────────────────────────┘"
    echo ""

    read -r response
    case "$response" in
      c|C|continue|Continue)
        echo "继续执行，将触发上下文压缩"
        return 2
        ;;
      *)
        echo "任务已终止"
        return 1
        ;;
    esac
  fi

  # 检查是否达到警告阈值
  if [[ $current_tokens -ge $warning_threshold ]]; then
    local token_warning_issued=$(get_status "token_warning_issued")

    if [[ "$token_warning_issued" != "true" ]]; then
      update_status "token_warning_issued" "true"
      echo ""
      echo "┌─────────────────────────────────────────────────────────────┐"
      echo "│  ⚠️  Token 使用警告                                         │"
      echo "├─────────────────────────────────────────────────────────────┤"
      echo "│                                                             │"
      echo "│  当前使用: $current_tokens / $max_tokens tokens              │"
      echo "│  百分比: $((current_tokens * 100 / max_tokens))%                                  │"
      echo "│  警告阈值: $TOKEN_WARNING_PERCENT%                               │"
      echo "│                                                             │"
      echo "│  建议: 考虑触发上下文压缩以释放空间                            │"
      echo "│                                                             │"
      echo "│  提示: 输入 /compact 可手动触发压缩                           │"
      echo "│                                                             │"
      echo "└─────────────────────────────────────────────────────────────┘"
      echo ""
    fi

    # 检查是否接近压缩阈值
    if [[ $current_tokens -ge $compression_threshold ]]; then
      echo "⚠️  警告: 上下文使用已达 $((current_tokens * 100 / max_tokens))%，接近压缩阈值 (92%)"
    fi

    return 2
  fi

  return 0
}

# ============================================================
# 循环迭代监控
# ============================================================

# 检查循环迭代次数
# 用法: check_loop_iteration <iteration_count> <operation>
# 返回: 0 正常, 1 熔断, 2 警告
check_loop_iteration() {
  local iteration=${1:-0}
  local operation="${2:-unknown}"
  local max_iterations=$MAX_LOOP_ITERATIONS
  local warning_count=$LOOP_WARNING_COUNT

  # 更新状态
  update_status "loop_iterations" "$iteration"

  # 检查是否触发熔断
  if [[ $iteration -ge $max_iterations ]]; then
    update_status "circuit_breaker_triggered" "true"

    echo ""
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│  🚨  熔断触发: 循环迭代超限                                  │"
    echo "├─────────────────────────────────────────────────────────────┤"
    echo "│                                                             │"
    echo "│  当前迭代: $iteration / $max_iterations                           │"
    echo "│  检测到重复操作: $operation                                │"
    echo "│                                                             │"
    echo "│  可能原因:                                                  │"
    echo "│  1. 任务陷入死循环                                          │"
    echo "│  2. 相同的失败操作被重复执行                                  │"
    echo "│  3. 任务过于复杂                                            │"
    echo "│                                                             │"
    echo "│  操作选项:                                                  │"
    echo "│  [r] 重新开始任务                                          │"
    echo "│  [c] 跳过此步骤继续执行                                     │"
    echo "│  [q] 退出任务                                              │"
    echo "│                                                             │"
    echo -n "│  请输入选择: _                                              │"
    echo ""
    echo "└─────────────────────────────────────────────────────────────┘"
    echo ""

    read -r response
    case "$response" in
      r|R|restart|Restart)
        echo "正在重新开始任务..."
        reset_resource_status
        return 1
        ;;
      c|C|continue|Continue)
        echo "跳过此步骤继续执行"
        return 2
        ;;
      *)
        echo "任务已终止"
        return 1
        ;;
    esac
  fi

  # 检查是否达到警告阈值
  if [[ $iteration -ge $warning_count ]]; then
    local loop_warning_issued=$(get_status "loop_warning_issued")

    if [[ "$loop_warning_issued" != "true" ]]; then
      update_status "loop_warning_issued" "true"
      echo ""
      echo "┌─────────────────────────────────────────────────────────────┐"
      echo "│  ⚠️  循环迭代警告                                         │"
      echo "├─────────────────────────────────────────────────────────────┤"
      echo "│                                                             │"
      echo "│  当前迭代: $iteration / $max_iterations                           │"
      echo "│  检测到操作: $operation                                  │"
      echo "│                                                             │"
      echo "│  警告: 迭代次数接近上限，请检查是否存在循环问题              │"
      echo "│                                                             │"
      echo "└─────────────────────────────────────────────────────────────┘"
      echo ""
    fi

    return 2
  fi

  return 0
}

# ============================================================
# 内存监控
# ============================================================

# 检查内存限制
# 用法: check_memory_limit
# 返回: 0 正常, 1 超限, 2 警告
check_memory_limit() {
  local max_memory=$MAX_MEMORY_MB
  local warning_threshold=$((max_memory * MEMORY_WARNING_PERCENT / 100))

  # 获取当前进程内存使用 (KB)
  local current_memory_kb=$(ps aux | grep "$$" | awk '{print $6}')
  local current_memory_mb=$((current_memory_kb / 1024))

  # 更新状态
  update_status "memory_usage_mb" "$current_memory_mb"

  # 检查是否超限
  if [[ $current_memory_mb -ge $max_memory ]]; then
    echo "错误: 内存限制超限 ($current_memory_mb MB / $max_memory MB)"
    return 1
  fi

  # 检查是否达到警告阈值
  if [[ $current_memory_mb -ge $warning_threshold ]]; then
    echo "警告: 内存使用较高 ($current_memory_mb MB / $max_memory MB)"
    return 2
  fi

  return 0
}

# ============================================================
# 工具调用监控
# ============================================================

# 记录工具调用
# 用法: track_tool_call <tool_name>
track_tool_call() {
  local tool_name="${1:-unknown}"
  local current_calls=$(get_status "tool_calls")
  local new_calls=$((current_calls + 1))

  update_status "tool_calls" "$new_calls"

  # 检查是否超限
  if [[ $new_calls -ge $MAX_TOOL_CALLS ]]; then
    echo ""
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│  🚨  工具调用限制超限                                      │"
    echo "├─────────────────────────────────────────────────────────────┤"
    echo "│                                                             │"
    echo "│  当前调用: $new_calls / $MAX_TOOL_CALLS                          │"
    echo "│                                                             │"
    echo "│  操作选项:                                                  │"
    echo "│  [c] 继续执行                                              │"
    echo "│  [q] 退出任务                                              │"
    echo "│                                                             │"
    echo -n "│  请输入选择: _                                              │"
    echo ""
    echo "└─────────────────────────────────────────────────────────────┘"
    echo ""

    read -r response
    case "$response" in
      c|C|continue|Continue)
        return 0
        ;;
      *)
        return 1
        ;;
    esac
  fi

  return 0
}

# ============================================================
# 状态管理
# ============================================================

# 重置资源状态
reset_resource_status() {
  init_resource_status
  update_status "token_usage" 0
  update_status "loop_iterations" 0
  update_status "tool_calls" 0
  update_status "token_warning_issued" "false"
  update_status "loop_warning_issued" "false"
  update_status "circuit_breaker_triggered" "false"
  update_status "last_reset" "$(date +%s)"
}

# 获取资源状态摘要
get_resource_status() {
  local status=$(read_status)

  local token_usage=$(get_status "token_usage")
  local loop_iterations=$(get_status "loop_iterations")
  local tool_calls=$(get_status "tool_calls")
  local memory_usage=$(get_status "memory_usage_mb")
  local task_start=$(get_status "task_start_time")
  local elapsed=$(( $(date +%s) - task_start ))

  echo ""
  echo "┌─────────────────────────────────────────────────────────────┐"
  echo "│  📊 资源使用状态                                          │"
  echo "├─────────────────────────────────────────────────────────────┤"
  echo "│                                                             │"
  printf "│  Token:    %-6d / %-6d (%d%%)                      │\n" \
    "$token_usage" "$MAX_TOKENS" "$(( token_usage * 100 / MAX_TOKENS ))"
  printf "│  循环:     %-6d / %-6d                              │\n" \
    "$loop_iterations" "$MAX_LOOP_ITERATIONS"
  printf "│  工具调用: %-6d / %-6d                              │\n" \
    "$tool_calls" "$MAX_TOOL_CALLS"
  printf "│  内存:     %-6d MB / %-6d MB                        │\n" \
    "$memory_usage" "$MAX_MEMORY_MB"
  printf "│  运行时间: %-6d 秒                                    │\n" \
    "$elapsed"
  echo "│                                                             │"
  echo "└─────────────────────────────────────────────────────────────┘"
  echo ""
}

# ============================================================
# 初始化
# ============================================================

# 自动初始化
init_resource_status

# 如果直接执行此脚本，显示状态
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "Resource Guard Status:"
  get_resource_status
fi
