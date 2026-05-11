#!/bin/bash
# secret-leak-scan.sh — 密钥泄露扫描（post_task 钩子）
# 用途：扫描修改文件中是否包含硬编码凭证
# 协议：RESULT: PASS/BLOCK/WARN
# 触发时机：task-executor 返回后，进入 code-review 之前
# 参数：$@ = 修改的文件列表（空格分隔）
#
# 扫描模式：
#   - API Key 模式 (api_key, apikey)
#   - OpenAI Key (sk-...)
#   - AWS Access Key (AKIA...)
#   - 密码赋值 (password = "...")
#   - 私钥块 (-----BEGIN...)
#
# 设计理由（Harness Engineering 安全护栏）：
#  硬编码密钥是最高频的 AI 生成代码安全问题之一

set -euo pipefail

FILES=("$@")
LEAKS=""

if [ ${#FILES[@]} -eq 0 ]; then
    echo "RESULT: WARN 未提供文件列表，跳过 secret-leak-scan"
    exit 2
fi

for FILE in "${FILES[@]}"; do
    # 排除 test 文件和 fixture 文件
    case "$FILE" in
        *__tests__*|*.test.*|*.spec.*|*fixture*|*mock*)
            continue
            ;;
    esac

    # 只检查文本文件
    case "$FILE" in
        *.ts|*.tsx|*.js|*.jsx|*.json|*.yml|*.yaml|*.env|*.config.*)
            ;;
        *)
            continue
            ;;
    esac

    # API Key 模式
    if grep -nE '(api_key|apikey|api-key|APPI_KEY)\s*[:=]\s*["'"'"'][^"'"'"'"]{8,}' "$FILE" 2>/dev/null | grep -v 'example\|placeholder\|your_\|YOUR_\|dummy\|xxx' > /dev/null 2>&1; then
        LEAKS="$LEAKS\n  [凭证泄露] $FILE 包含疑似 API Key 赋值"
    fi

    # OpenAI Key
    if grep -nE 'sk-[A-Za-z0-9]{16,}' "$FILE" 2>/dev/null | grep -v 'example\|your-sk' > /dev/null 2>&1; then
        LEAKS="$LEAKS\n  [凭证泄露] $FILE 包含疑似 OpenAI Key"
    fi

    # AWS Access Key
    if grep -nE 'AKIA[0-9A-Z]{16}' "$FILE" 2>/dev/null | grep -v 'example\|YOUR_' > /dev/null 2>&1; then
        LEAKS="$LEAKS\n  [凭证泄露] $FILE 包含疑似 AWS Access Key"
    fi

    # 密码赋值
    if grep -nE 'password\s*[:=]\s*["'"'"'][^"'"'"'"]{4,}' "$FILE" 2>/dev/null | grep -v 'example\|placeholder\|your_\|YOUR_\|dummy\|xxx\|password_hash\|hashed_password\|encrypted' > /dev/null 2>&1; then
        LEAKS="$LEAKS\n  [凭证泄露] $FILE 包含疑似密码硬编码"
    fi

    # 私钥块
    if grep -nE '-----BEGIN (RSA|EC|DSA|OPENSSH|PRIVATE) KEY-----' "$FILE" 2>/dev/null > /dev/null 2>&1; then
        LEAKS="$LEAKS\n  [凭证泄露] $FILE 包含私钥块"
    fi
done

if [ -n "$LEAKS" ]; then
    echo "RESULT: BLOCK 检测到硬编码凭证，请移除或使用环境变量:$LEAKS"
    exit 1
fi

echo "RESULT: PASS 未检测到硬编码凭证（${#FILES[@]} 个文件）"
exit 0
