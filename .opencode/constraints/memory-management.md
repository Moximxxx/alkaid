# 记忆管理约束

> Agent 的短期记忆、长期记忆和上下文窗口管理规范。

## 概述

记忆系统是 Agent 持续执行任务的基础。良好的记忆管理确保：
- 上下文窗口不被污染
- 重要信息不被遗忘
- 推理质量保持稳定

## 记忆分类

### R-01: 记忆分为三层

| 层级 | 生命周期 | 容量 | 用途 |
|------|---------|------|------|
| **Short-term** | 单次任务 | ~8KB | 当前对话上下文 |
| **Long-term** | 跨任务 | 无限制 | 持久化知识、项目状态 |
| **Task** | 任务周期 | ~32KB | 任务状态、子目标 |

### R-02: 各层记忆职责明确

```
短期记忆（Short-term）
├── 当前用户请求
├── 对话历史
└── 工具调用结果

长期记忆（Long-term）
├── 项目上下文（AGENTS.md）
├── 约束规则
├── 技术栈知识
└── 历史任务记录

任务记忆（Task）
├── 当前任务目标
├── 子目标状态
├── 覆盖率检查清单
└── 中间结果
```

## 上下文窗口管理

### R-03: 上下文窗口使用率必须 < 80%

```python
# 检查上下文使用率
def check_context_usage(messages, max_tokens=200000):
    total_tokens = estimate_tokens(messages)
    usage = total_tokens / max_tokens

    if usage > 0.8:
        return {
            "warning": "上下文使用率超过 80%",
            "usage": f"{usage:.1%}",
            "action": "建议压缩或外化"
        }
    return {"status": "ok", "usage": f"{usage:.1%}"}
```

### R-04: 超过 60% 时主动压缩

```python
# 压缩策略
COMPRESSION_STRATEGIES = [
    "summarize_old_messages",      # 总结旧消息
    "remove_redundant_context",    # 移除冗余上下文
    "flatten_nested_structure",    # 扁平化嵌套结构
    "externalize_low_priority"      # 外化低优先级信息
]
```

### R-05: 压缩保留规则

| 信息类型 | 保留策略 |
|---------|---------|
| 用户最终目标 | 永远保留 |
| 当前任务状态 | 永远保留 |
| 已验证结果 | 永远保留 |
| 中间推理过程 | 可压缩 |
| 历史对话细节 | 可压缩 |

## 短期记忆

### R-06: 短期记忆必须包含时间戳

```json
{
  "short_term": [
    {
      "role": "user",
      "content": "帮我重构模块 A",
      "timestamp": "2024-01-01T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "我将帮您重构模块 A...",
      "timestamp": "2024-01-01T10:00:05Z",
      "tools_used": ["read_file", "analyze_code"]
    }
  ]
}
```

### R-07: 工具调用结果必须记录

```json
{
  "role": "assistant",
  "content": "正在读取文件...",
  "timestamp": "2024-01-01T10:00:10Z",
  "tool_call": {
    "name": "read_file",
    "input": { "path": "/src/main.py" },
    "output": { "content": "...", "lines": 150 }
  }
}
```

### R-08: 错误信息必须保留

```json
{
  "role": "assistant",
  "content": "编译失败",
  "timestamp": "2024-01-01T10:00:30Z",
  "error": {
    "type": "compile_error",
    "message": "SyntaxError: invalid syntax",
    "file": "/src/main.py",
    "line": 42
  }
}
```

## 长期记忆

### R-09: 长期记忆存储位置

```
{tool}/
├── memory/                    # 记忆存储目录
│   ├── short_term/           # 短期记忆（会话级别）
│   ├── long_term/            # 长期记忆
│   │   ├── project.md       # 项目上下文
│   │   ├── constraints/     # 约束知识库
│   │   └── patterns/         # 常见模式
│   └── task/                 # 任务记忆
│       └── {task_id}/
└── traces/                   # 执行追踪
```

### R-10: 项目上下文必须持久化

```markdown
# project.md

## 项目信息
- 项目名称: xxx
- 技术栈: Python + FastAPI
- 架构: 三层架构（API / Service / Repository）

## 关键约定
- 所有 API 必须返回标准响应格式
- 数据库操作必须在 Service 层
- 禁止直接 import Model

## 当前任务
- 重构模块 A
- 目标: 解耦数据库依赖
```

### R-11: 约束知识库结构

```
constraints/
├── python.md          # Python 约束
├── api_design.md      # API 设计规范
└── project_specific.md  # 项目特定规则
```

## 任务记忆

### R-12: 任务必须有唯一标识

```json
{
  "task_id": "TASK-2024-001",
  "goal": "重构用户模块",
  "created_at": "2024-01-01T10:00:00Z",
  "status": "in_progress",
  "subtasks": [
    { "id": "ST-001", "status": "completed" },
    { "id": "ST-002", "status": "in_progress" }
  ]
}
```

### R-13: 任务状态必须包含覆盖率

```json
{
  "task_id": "TASK-2024-001",
  "coverage": {
    "feature_user_create": "assert: 用户创建成功，返回 201",
    "feature_user_query": "assert: 用户查询正确",
    "error_invalid_email": "SKIP: 需要邮件服务器"
  }
}
```

## 记忆清理

### R-14: 会话结束必须清理短期记忆

```bash
# 清理短期记忆（会话结束）
cleanup_short_term() {
    local session_id="$1"

    # 保存重要信息到长期记忆
    save_to_long_term "$session_id"

    # 清理短期记忆
    rm -rf "{tool}/memory/short_term/$session_id"
}
```

### R-15: 长期记忆定期归档

```bash
# 归档旧任务记忆（> 30 天）
archive_old_tasks() {
    find "{tool}/memory/task" -type d -mtime +30 \
        -exec tar czf "{}/archives/task-$(date +%Y%m).tar.gz" {} \; \
        -exec rm -rf {} \;
}
```

## 上下文注入

### R-16: 系统提示必须包含记忆引用

```markdown
## 项目上下文
项目信息存储在: {tool}/memory/long_term/project.md
当前任务约束: {tool}/memory/task/{task_id}/

## 记忆加载规则
1. 首先加载 project.md 了解项目背景
2. 加载相关约束文件
3. 如果有进行中的任务，加载任务状态
```

### R-17: 上下文加载优先级

| 优先级 | 内容 | 加载时机 |
|--------|------|---------|
| P0 | 当前任务目标 | 始终 |
| P0 | 约束规则 | 始终 |
| P1 | 项目上下文 | 始终 |
| P1 | 当前任务历史 | 始终 |
| P2 | 相关模式知识 | 按需 |
| P3 | 历史任务归档 | 按需 |

## Token 预算

### R-18: 设置 Token 预算控制

```python
TOKEN_BUDGET = {
    "system_prompt": 2000,      # 系统提示
    "constraints": 3000,         # 约束规则
    "project_context": 2000,    # 项目上下文
    "task_state": 1500,         # 任务状态
    "conversation": 8000,       # 对话历史
    "reserved": 2000            # 保留空间
}

MAX_CONTEXT = sum(TOKEN_BUDGET.values())  # ~18.5K
```

### R-19: 超出预算时的处理策略

```python
def handle_context_overflow(context):
    if context_tokens > MAX_CONTEXT:
        strategies = [
            # 1. 压缩对话历史
            ("compress_history", lambda: compress_conversation()),
            # 2. 外化约束详情
            ("externalize_constraints", lambda: move_constraints_to_files()),
            # 3. 总结旧任务
            ("summarize_tasks", lambda: summarize_old_tasks()),
            # 4. 请求用户确认优先级
            ("ask_user", lambda: ask_user_what_to_keep())
        ]
```

## 验证方法

### R-20: 定期验证记忆完整性

```bash
# 验证记忆文件完整性
verify_memory() {
    local memory_dir="{tool}/memory"

    # 检查必要文件
    for file in project.md constraints/*.md; do
        if [ ! -f "$file" ]; then
            echo "警告: 缺少记忆文件: $file"
        fi
    done

    # 检查格式
    if ! jq empty project.md 2>/dev/null; then
        echo "错误: project.md JSON 格式错误"
    fi
}
```

## 事故案例

> 事故：Agent 在长对话中遗忘早期需求，导致最终结果不符合用户原始意图。
> 根因：上下文窗口被新内容填满，早期信息被挤出。
> 修复：实现上下文使用率监控，60% 时主动压缩，80% 时强制总结。

> 事故：Agent 在多任务切换时混淆任务状态。
> 根因：任务记忆未正确隔离。
> 修复：每个任务独立的目录，切换时正确保存/加载状态。
