#!/bin/bash
# decision-gate.sh — 关键决策拦截
# 版本: v2.0.0
# 更新: 2026-04-30
#
# 功能:
# 在关键操作执行前拦截，等待用户确认
# 针对写操作、危险命令等关键决策点
#
# 用法:
#   decision-gate.sh <operation> <target> [options]
#   返回 0 表示允许执行
#   返回 1 表示拒绝执行
#
# 环境变量:
#   HARNESS_SKIP_GATE=1  # 跳过决策门

set -euo pipefail

# ============================================================
# 配置
# ============================================================

# 操作类型
readonly OPERATION="$1"
readonly TARGET="${2:-}"
readonly OPTIONS="${3:-}"

# 决策点配置
readonly DECISION_POINTS=(
  "file_create"
  "file_modify"
  "file_delete"
  "dir_create"
  "dir_delete"
  "git_commit"
  "git_push"
  "git_force_push"
  "git_reset"
  "install_package"
  "uninstall_package"
  "execute_script"
  "modify_permission"
  "docker_operation"
  "dangerous_command"
)

# ============================================================
# 函数
# ============================================================

# 打印决策提示
print_decision_prompt() {
  local operation="$1"
  local target="$2"
  local preview="${3:-}"

  echo ""
  echo "┌─────────────────────────────────────────────────────────────┐"
  echo "│  ⚠️  决策确认                                              │"
  echo "├─────────────────────────────────────────────────────────────┤"
  echo "│                                                             │"
  echo "│  操作: $operation                                            │"
  echo "│  目标: $target                                              │"
  echo "│                                                             │"

  if [[ -n "$preview" ]]; then
    echo "│  预览:                                                      │"
    echo "$preview" | head -5 | while IFS= read -r line; do
      echo "│    $line" | cut -c1-58
    done
    echo "│    ..."
  fi

  echo "│                                                             │"
  echo "│  操作选项:                                                  │"
  echo "│  [y] 确认执行                                              │"
  echo "│  [n] 取消操作                                              │"
  echo "│  [v] 查看详情                                              │"
  echo "│                                                             │"
  echo -n "│  请输入选择: _                                              │"
  echo ""
  echo "└─────────────────────────────────────────────────────────────┘"
  echo ""
}

# 获取操作描述
get_operation_description() {
  local operation="$1"

  case "$operation" in
    file_create)
      echo "创建文件"
      ;;
    file_modify)
      echo "修改文件"
      ;;
    file_delete)
      echo "删除文件"
      ;;
    dir_create)
      echo "创建目录"
      ;;
    dir_delete)
      echo "删除目录"
      ;;
    git_commit)
      echo "Git 提交"
      ;;
    git_push)
      echo "Git 推送"
      ;;
    git_force_push)
      echo "Git 强制推送"
      ;;
    git_reset)
      echo "Git 重置"
      ;;
    install_package)
      echo "安装包"
      ;;
    uninstall_package)
      echo "卸载包"
      ;;
    execute_script)
      echo "执行脚本"
      ;;
    modify_permission)
      echo "修改权限"
      ;;
    docker_operation)
      echo "Docker 操作"
      ;;
    dangerous_command)
      echo "危险命令"
      ;;
    *)
      echo "未知操作"
      ;;
  esac
}

# 获取风险级别
get_risk_level() {
  local operation="$1"

  case "$operation" in
    file_delete|dir_delete|git_force_push|git_reset)
      echo "high"
      ;;
    git_push|install_package|docker_operation)
      echo "medium"
      ;;
    file_create|file_modify|git_commit)
      echo "low"
      ;;
    *)
      echo "low"
      ;;
  esac
}

# 检查是否需要拦截
should_intercept() {
  local operation="$1"

  # 高风险操作必须拦截
  local high_risk_ops=(
    "file_delete"
    "dir_delete"
    "git_force_push"
    "git_reset"
    "dangerous_command"
  )

  for op in "${high_risk_ops[@]}"; do
    if [[ "$operation" == "$op" ]]; then
      return 0
    fi
  done

  # 中风险操作默认拦截
  local medium_risk_ops=(
    "git_push"
    "install_package"
    "uninstall_package"
    "docker_operation"
    "execute_script"
    "modify_permission"
  )

  for op in "${medium_risk_ops[@]}"; do
    if [[ "$operation" == "$op" ]]; then
      return 0
    fi
  done

  # 低风险操作也可以配置为拦截
  return 1
}

# 验证目标路径
validate_target() {
  local target="$1"

  # 检查是否是受限路径
  local restricted_paths=(
    "/etc"
    "/usr"
    "/bin"
    "/sbin"
    "/sys"
    "/proc"
    "/dev"
    "/boot"
    "/var"
    "\$HOME/.ssh"
    "\$HOME/.gnupg"
  )

  for path in "${restricted_paths[@]}"; do
    if [[ "$target" == $path* ]]; then
      echo "RESTRICTED|$path"
      return 0
    fi
  done

  return 1
}

# ============================================================
# 主逻辑
# ============================================================

# 检查是否跳过决策门
if [[ "${HARNESS_SKIP_GATE:-0}" == "1" ]]; then
  exit 0
fi

# 空操作直接放行
if [[ -z "$OPERATION" ]]; then
  exit 0
fi

# 验证操作类型
valid_operation=false
for op in "${DECISION_POINTS[@]}"; do
  if [[ "$OPERATION" == "$op" ]]; then
    valid_operation=true
    break
  fi
done

if [[ "$valid_operation" == "false" ]]; then
  echo "Unknown operation: $OPERATION" >&2
  exit 1
fi

# 检查目标路径
if [[ -n "$TARGET" ]]; then
  validate_result=$(validate_target "$TARGET")
  if [[ $? -eq 0 ]]; then
    IFS='|' read -r status path <<< "$validate_result"
    echo ""
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│  🚨  受限路径警告                                           │"
    echo "├─────────────────────────────────────────────────────────────┤"
    echo "│                                                             │"
    echo "│  目标: $TARGET                                              │"
    echo "│  原因: 此路径包含系统或敏感文件                              │"
    echo "│                                                             │"
    echo "│  操作选项:                                                  │"
    echo "│  [y] 强制执行 (不推荐)                                     │"
    echo "│  [n] 取消操作                                              │"
    echo "│                                                             │"
    echo -n "│  请输入选择: _                                              │"
    echo ""
    echo "└─────────────────────────────────────────────────────────────┘"
    echo ""

    read -r response
    case "$response" in
      y|Y|yes|Yes|YES)
        echo "警告: 正在对受限路径执行操作"
        ;;
      *)
        echo "操作已取消"
        exit 1
        ;;
    esac
  fi
fi

# 检查是否需要拦截
if ! should_intercept "$OPERATION"; then
  exit 0
fi

# 获取操作信息
description=$(get_operation_description "$OPERATION")
risk_level=$(get_risk_level "$OPERATION")

# 打印决策提示
echo ""
if [[ "$risk_level" == "high" ]]; then
  echo "┌─────────────────────────────────────────────────────────────┐"
  echo "│  🚨  高风险操作确认                                          │"
  echo "├─────────────────────────────────────────────────────────────┤"
  echo "│                                                             │"
  echo "│  操作: $description                                          │"
  echo "│  目标: $TARGET                                              │"
  echo "│  风险: 高                                                   │"
  echo "│                                                             │"
  echo "│  警告: 此操作可能导致数据丢失或不可逆的变更                    │"
  echo "│                                                             │"
  echo "│  操作选项:                                                  │"
  echo "│  [y] 确认执行                                              │"
  echo "│  [n] 取消操作                                              │"
  echo "│                                                             │"
  echo -n "│  请输入选择: _                                              │"
  echo ""
  echo "└─────────────────────────────────────────────────────────────┘"
else
  print_decision_prompt "$description" "$TARGET"
fi

echo ""
read -r response

case "$response" in
  y|Y|yes|Yes|YES)
    exit 0
    ;;
  n|N|no|No|NO)
    echo "操作已取消"
    exit 1
    ;;
  v|V|view|View)
    echo ""
    echo "详情:"
    echo "--------"
    echo "操作类型: $OPERATION"
    echo "操作描述: $description"
    echo "目标: $TARGET"
    echo "风险级别: $risk_level"
    echo ""
    echo "已拒绝此操作，如需执行请重新发起。"
    exit 1
    ;;
  *)
    echo "无效选择，操作已取消"
    exit 1
    ;;
esac
