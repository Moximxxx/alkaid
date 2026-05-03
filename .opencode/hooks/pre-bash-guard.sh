#!/bin/bash
# pre-bash-guard.sh — 增强版 Bash 命令拦截
# 版本: v2.0.0
# 更新: 2026-04-30
#
# 功能:
# 1. 危险命令直接拦截
# 2. 写操作拦截并等待确认
# 3. 支持危险模式提示
#
# 用法:
#   pre-bash-guard.sh <command>
#   返回 0 表示允许执行
#   返回 1 表示拒绝执行
#
# 环境变量:
#   HARNESS_SKIP_CONFIRM=1  # 跳过确认，直接放行（危险模式）
#   HARNESS_TOOL_NAME       # 当前工具名称

set -euo pipefail

# ============================================================
# 配置
# ============================================================

# 危险命令库（直接拦截）
readonly DANGEROUS_PATTERNS=(
  # 文件系统危险操作 - 绝对禁止
  "rm\s+-rf\s+/"
  "rm\s+-rf\s+\$HOME"
  "rm\s+-rf\s+\.\./"
  "rm\s+-rf\s+/home"
  "rm\s+-rf\s+/etc"
  "rm\s+-rf\s+/var"
  "rm\s+-rf\s+/usr"
  "rm\s+-rf\s+/bin"
  "rm\s+-rf\s+/sbin"
  "rm\s+-rf\s+/sys"
  "rm\s+-rf\s+/proc"
  "rm\s+-rf\s+/dev"
  "rm\s+-rf\s+/boot"
  "rm\s+-rf\s+/opt"

  # 系统危险操作 - 绝对禁止
  "mkfs"
  "mkfs\."
  "dd\s+if=.*of=/dev/"
  "dd\s+if=.*of=/dev/sd"
  "dd\s+if=.*of=/dev/hd"
  "shutdown"
  "reboot"
  "init\s+0"
  "init\s+6"
  "systemctl\s+poweroff"
  "systemctl\s+reboot"
  "halt"
  "poweroff"

  # 进程危险操作
  "kill\s+-9\s+-1"
  "kill\s+-9\s+1"
)

# 写操作模式（需要确认）
readonly WRITE_PATTERNS=(
  # 文件写入
  ">\s*/"           # 输出重定向到根目录
  ">>\s*/"          # 追加到根目录
  "tee\s+"          # tee 命令
  "cat\s+.*\s+>"   # cat 写入
  "echo\s+.*>"     # echo 写入
  "printf\s+.*>"   # printf 写入

  # 删除操作
  "rm\s+-rf"
  "rm\s+-r"
  "rm\s+-f"
  "rmdir"

  # 移动/复制操作
  "mv\s+.*\s+/"    # 移动到根目录
  "cp\s+.*\s+/"    # 复制到根目录

  # 安装命令
  "npm\s+install"
  "npm\s+uninstall"
  "pip\s+install"
  "pip\s+uninstall"
  "cargo\s+install"
  "cargo\s+uninstall"
  "apt-get\s+install"
  "apt-get\s+remove"
  "yum\s+install"
  "yum\s+remove"

  # Git 写操作
  "git\s+push"
  "git\s+commit"
  "git\s+merge"
  "git\s+rebase"
  "git\s+checkout\s+-f"
  "git\s+reset\s+--hard"

  # Docker 操作
  "docker\s+rm"
  "docker\s+rmi"
  "docker\s+stop"
  "docker\s+kill"
  "docker\s+rmi\s+-f"

  # 修改权限
  "chmod\s+777"
  "chmod\s+-R\s+777"
  "chown\s+.*\s+-R\s+777"
)

# 危险命令模式（需要确认）
readonly DANGEROUS_WRITE_PATTERNS=(
  "curl.*\|.*sh"
  "wget.*\|.*sh"
  "curl.*>\s*.*\.sh"
  "wget.*>\s*.*\.sh"
  "python.*-m\s+pip\s+install\s+--user"
  "npm\s+install\s+-g"
  "yarn\s+global\s+add"
  "chmod\s+[0-9][0-9][0-9]"
  "git\s+push\s+.*--force"
  "git\s+push\s+.*-f"
)

# 危险命令提示信息
declare -A DANGEROUS_MESSAGES=(
  ["rm\\s+-rf\\s+/"]="危险：尝试删除根目录"
  ["rm\\s+-rf\\s+\$HOME"]="危险：尝试删除主目录"
  ["rm\\s+-rf\\s+/home"]="危险：尝试删除所有用户目录"
  ["mkfs"]="危险：尝试格式化文件系统"
  ["dd\\s+if=.*of=/dev/"]="危险：尝试直接写入设备"
  ["shutdown"]="危险：尝试关闭系统"
  ["reboot"]="危险：尝试重启系统"
  ["kill\\s+-9\\s+-1"]="危险：尝试杀死所有进程"
)

# ============================================================
# 函数
# ============================================================

# 打印警告框
print_warning() {
  local title="$1"
  local message="$2"
  cat << EOF
==========================================
BLOCKED: $title
==========================================

$message

==========================================
EOF
}

# 打印决策确认框
print_decision_prompt() {
  local operation="$1"
  local command="$2"
  local reason="$3"

  cat << EOF
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  操作确认                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  操作: $operation                                            │
│  命令: $command                                              │
│  原因: $reason                                              │
│                                                             │
│  风险提示:                                                  │
│  - 此操作可能会修改文件或系统状态                            │
│  - 请确认这是预期行为                                       │
│                                                             │
│  操作选项:                                                  │
│  [y] 确认执行                                              │
│  [n] 取消操作                                              │
│  [v] 查看详情                                              │
│                                                             │
│  请输入选择: _
EOF
}

# 检查命令是否匹配模式
match_pattern() {
  local command="$1"
  local pattern="$2"

  echo "$command" | grep -qE "$pattern" 2>/dev/null
}

# 检查是否是危险命令
check_dangerous() {
  local command="$1"

  for pattern in "${DANGEROUS_PATTERNS[@]}"; do
    if match_pattern "$command" "$pattern"; then
      local msg="${DANGEROUS_MESSAGES[$pattern]:-危险命令匹配: $pattern}"
      echo "DANGEROUS|$pattern|$msg"
      return 0
    fi
  done

  return 1
}

# 检查是否是写操作
check_write_operation() {
  local command="$1"

  for pattern in "${WRITE_PATTERNS[@]}"; do
    if match_pattern "$command" "$pattern"; then
      echo "WRITE|$pattern"
      return 0
    fi
  done

  return 1
}

# 检查是否是危险写操作（需要更强警告）
check_dangerous_write() {
  local command="$1"

  for pattern in "${DANGEROUS_WRITE_PATTERNS[@]}"; do
    if match_pattern "$command" "$pattern"; then
      echo "DANGEROUS_WRITE|$pattern"
      return 0
    fi
  done

  return 1
}

# 获取操作描述
get_operation_description() {
  local command="$1"

  if [[ "$command" =~ ^rm\s ]]; then
    echo "删除文件/目录"
  elif [[ "$command" =~ ^git\s+push ]]; then
    echo "Git 推送"
  elif [[ "$command" =~ ^git\s+commit ]]; then
    echo "Git 提交"
  elif [[ "$command" =~ ^npm\s+install ]]; then
    echo "安装 npm 包"
  elif [[ "$command" =~ ^pip\s+install ]]; then
    echo "安装 Python 包"
  elif [[ "$command" =~ ^curl.*\| ]]; then
    echo "执行远程脚本"
  elif [[ "$command" =~ ^wget.*\| ]]; then
    echo "下载并执行脚本"
  elif [[ "$command" =~ ^docker\s+ ]]; then
    echo "Docker 操作"
  elif [[ "$command" =~ ^chmod ]]; then
    echo "修改权限"
  else
    echo "写操作"
  fi
}

# 获取危险原因
get_dangerous_reason() {
  local pattern="$1"

  case "$pattern" in
    *rm*)
      echo "递归删除可能永久丢失数据"
      ;;
    *curl*|*wget*)
      echo "执行远程脚本可能导致安全问题"
      ;;
    *chmod*)
      echo "全权限设置可能导致安全风险"
      ;;
    *git\s+push*)
      echo "强制推送可能覆盖他人代码"
      ;;
    *docker\s+rm*)
      echo "删除容器/镜像可能是不可逆操作"
      ;;
    *)
      echo "此操作具有潜在风险"
      ;;
  esac
}

# ============================================================
# 主逻辑
# ============================================================

COMMAND="$*"

# 空命令直接放行
if [[ -z "$COMMAND" ]]; then
  exit 0
fi

# 1. 首先检查绝对危险命令（直接拦截，不确认）
dangerous_result=$(check_dangerous "$COMMAND")
if [[ $? -eq 0 ]]; then
  IFS='|' read -r level pattern message <<< "$dangerous_result"
  print_warning "$message" "此命令被系统拦截，如需执行请手动在终端中操作。"
  exit 1
fi

# 2. 检查是否是危险写操作（需要确认）
dangerous_write_result=$(check_dangerous_write "$COMMAND")
if [[ $? -eq 0 ]]; then
  IFS='|' read -r level pattern <<< "$dangerous_write_result"
  operation=$(get_operation_description "$COMMAND")
  reason=$(get_dangerous_reason "$pattern")

  # 如果设置了跳过确认模式（危险模式），直接拦截
  if [[ "${HARNESS_SKIP_CONFIRM:-0}" == "1" ]]; then
    print_warning "危险操作" "命令: $COMMAND\n\n$reason\n\n因 HARNESS_SKIP_CONFIRM=1，已跳过确认，但命令被拦截。"
    exit 1
  fi

  echo ""
  echo "┌─────────────────────────────────────────────────────────────┐"
  echo "│  🚨 危险操作警告                                             │"
  echo "├─────────────────────────────────────────────────────────────┤"
  echo "│                                                             │"
  echo "│  命令: $COMMAND                                              │"
  echo "│  操作: $operation                                            │"
  echo "│  原因: $reason                                              │"
  echo "│                                                             │"
  echo "│  风险等级: 高                                                │"
  echo "│                                                             │"
  echo "│  操作选项:                                                  │"
  echo "│  [y] 确认执行 (输入 y 或 yes)                               │"
  echo "│  [n] 取消操作 (输入 n 或 no)                               │"
  echo "│  [v] 查看详情 (输入 v 或 view)                              │"
  echo "│                                                             │"
  echo -n "│  请输入选择: _                                              │"
  echo ""
  echo "└─────────────────────────────────────────────────────────────┘"
  echo ""

  read -r response
  case "$response" in
    y|Y|yes|Yes|YES)
      exit 0
      ;;
    v|V|view|View)
      echo ""
      echo "详情:"
      echo "--------"
      echo "此命令匹配危险写操作模式: $pattern"
      echo ""
      echo "建议:"
      echo "- 如果是删除操作，确认是否真的要删除"
      echo "- 如果是 git 操作，考虑是否可以使用非强制版本"
      echo "- 如果是安装操作，确认包来源可信"
      echo ""
      exit 1
      ;;
    *)
      echo "操作已取消"
      exit 1
      ;;
  esac
fi

# 3. 检查普通写操作（需要确认）
write_result=$(check_write_operation "$COMMAND")
if [[ $? -eq 0 ]]; then
  IFS='|' read -r level pattern <<< "$write_result"
  operation=$(get_operation_description "$COMMAND")
  reason="此操作可能会修改文件或系统状态"

  # 如果设置了跳过确认模式，直接放行（写操作比危险操作风险低）
  if [[ "${HARNESS_SKIP_CONFIRM:-0}" == "1" ]]; then
    exit 0
  fi

  echo ""
  echo "┌─────────────────────────────────────────────────────────────┐"
  echo "│  ⚠️  操作确认                                              │"
  echo "├─────────────────────────────────────────────────────────────┤"
  echo "│                                                             │"
  echo "│  操作: $operation                                            │"
  echo "│  命令: $COMMAND                                              │"
  echo "│                                                             │"
  echo "│  操作选项:                                                  │"
  echo "│  [y] 确认执行 (输入 y 或 yes)                               │"
  echo "│  [n] 取消操作 (输入 n 或 no)                               │"
  echo "│  [v] 查看详情 (输入 v 或 view)                              │"
  echo "│                                                             │"
  echo -n "│  请输入选择: _                                              │"
  echo ""
  echo "└─────────────────────────────────────────────────────────────┘"
  echo ""

  read -r response
  case "$response" in
    y|Y|yes|Yes|YES)
      exit 0
      ;;
    v|V|view|View)
      echo ""
      echo "详情:"
      echo "--------"
      echo "此命令匹配写操作模式: $pattern"
      echo ""
      echo "如果是预期的开发操作（如保存文件、安装依赖），请确认执行。"
      echo ""
      exit 1
      ;;
    *)
      echo "操作已取消"
      exit 1
      ;;
  esac
fi

# 4. 所有检查通过，放行
exit 0
