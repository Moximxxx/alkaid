#!/bin/bash
set -e

INCIDENTS_DIR="incidents"
RETRO_MARKER="/tmp/opencode/.retro_required"

mkdir -p "$INCIDENTS_DIR"

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
RETRO_FILE="${INCIDENTS_DIR}/$(date +"%Y-%m-%d")_retro.md"

if [ ! -f "$RETRO_FILE" ]; then
    cat > "$RETRO_FILE" << 'EOF'
# 复盘报告

**日期**：[日期时间]
**任务**：[任务描述]
**执行者**：[执行者名称]
**耗时**：[耗时]
**结果**：[成功/失败]
**触发条件**：[触发本次复盘的条件]

## 执行过程

1. 
2. 
3. 

## 问题分析（如有）

- **问题1**：[描述]
- **根因**：[分析]

## 约束更新（如有）

- [需要添加/修改的约束]

## 经验教训

- 

## 下次改进

- 
EOF
    echo "已创建复盘报告: $RETRO_FILE"
else
    echo "复盘报告已存在: $RETRO_FILE"
fi

if [ -f "$RETRO_MARKER" ]; then
    rm -f "$RETRO_MARKER"
    echo "已清除 retro_required 标记"
fi

echo "Retro 复盘流程完成"
