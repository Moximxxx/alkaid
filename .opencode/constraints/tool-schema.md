# 工具 Schema 约束

> 工具调用必须遵循 Schema 规范，确保输入输出的一致性和可验证性。

## 概述

工具（Tool）是 Agent 与外部世界交互的接口。Schema 规范确保：
- 输入参数类型安全
- 输出格式可预期
- 错误处理标准化

## Schema 格式

### R-01: 工具定义必须包含完整 Schema

**正确格式**：
```json
{
  "name": "read_file",
  "description": "读取文件内容",
  "input_schema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "文件路径"
      },
      "encoding": {
        "type": "string",
        "default": "utf-8",
        "enum": ["utf-8", "gbk", "ascii"]
      },
      "max_size": {
        "type": "integer",
        "description": "最大读取字节数",
        "minimum": 1,
        "maximum": 10485760
      }
    },
    "required": ["path"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "content": {
        "type": "string",
        "description": "文件内容"
      },
      "size": {
        "type": "integer"
      },
      "encoding": {
        "type": "string"
      }
    }
  }
}
```

## 输入验证

### R-02: 必填参数必须在 required 中声明

```json
{
  "input_schema": {
    "type": "object",
    "properties": {
      "path": { "type": "string" },
      "content": { "type": "string" }
    },
    "required": ["path", "content"]
  }
}
```

### R-03: 参数必须指定类型

```json
// 错误：缺少类型
{ "name": "param", "description": "参数" }

// 正确
{ "name": "param", "type": "string", "description": "参数" }
```

### R-04: 使用 enum 限制可选值

```json
{
  "type": "string",
  "enum": ["create", "update", "delete", "read"],
  "description": "操作类型"
}
```

### R-05: 数字参数必须设置范围

```json
{
  "type": "integer",
  "minimum": 1,
  "maximum": 100,
  "default": 10
}
```

## 输出规范

### R-06: 成功响应必须包含标准结构

```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "duration_ms": 123
  }
}
```

### R-07: 错误响应必须包含标准结构

```json
{
  "success": false,
  "error": {
    "code": "FILE_NOT_FOUND",
    "message": "文件不存在: /path/to/file",
    "details": {
      "path": "/path/to/file",
      "errno": 2
    }
  }
}
```

### R-08: 错误码必须使用大写下划线格式

| 错误码 | 含义 |
|--------|------|
| `FILE_NOT_FOUND` | 文件不存在 |
| `INVALID_PARAMETER` | 参数无效 |
| `PERMISSION_DENIED` | 权限不足 |
| `TIMEOUT` | 操作超时 |
| `NETWORK_ERROR` | 网络错误 |
| `UNKNOWN_ERROR` | 未知错误 |

## 验证规则

### R-09: 调用前必须验证输入 Schema

```bash
# 验证 JSON Schema（使用 jsonschema）
jsonschema -i input.json tool_schema.json
```

### R-10: 调用后必须验证输出 Schema

```bash
# 验证响应
jsonschema -i response.json output_schema.json
```

## Tool Calling 流程

### R-11: 标准化 Tool Calling 流程

```
1. 解析用户意图
2. 选择工具
3. 验证输入 Schema
4. 执行工具调用
5. 验证输出 Schema
6. 返回结果或标准化错误
```

### R-12: 超时必须标准化处理

```json
{
  "success": false,
  "error": {
    "code": "TIMEOUT",
    "message": "操作超时（30秒）",
    "details": {
      "operation": "http_request",
      "timeout_seconds": 30
    }
  }
}
```

## 复合工具

### R-13: 批量操作使用数组格式

```json
{
  "name": "batch_read",
  "input_schema": {
    "type": "object",
    "properties": {
      "paths": {
        "type": "array",
        "items": { "type": "string" },
        "minItems": 1,
        "maxItems": 100
      }
    },
    "required": ["paths"]
  }
}
```

### R-14: 分页查询必须返回分页元数据

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

## 安全约束

### R-15: 敏感操作需要二次确认 Schema

```json
{
  "name": "delete_file",
  "input_schema": {
    "type": "object",
    "properties": {
      "path": { "type": "string" },
      "confirm": {
        "type": "object",
        "properties": {
          "action": { "type": "string", "const": "DELETE" },
          "reason": { "type": "string", "minLength": 10 }
        },
        "required": ["action", "reason"]
      }
    },
    "required": ["path", "confirm"]
  }
}
```

## 验证脚本

### R-16: 提供 Schema 验证脚本

```bash
#!/bin/bash
# verify_tool_schema.sh

validate_input() {
    local input="$1"
    local schema="$2"

    if ! jsonschema -i "$input" "$schema" 2>/dev/null; then
        echo "输入验证失败"
        return 1
    fi
    return 0
}

validate_output() {
    local output="$1"
    local schema="$2"

    if ! jsonschema -i "$output" "$schema" 2>/dev/null; then
        echo "输出验证失败"
        return 1
    fi
    return 0
}
```

## 事故案例

> 事故：Agent 调用文件删除工具，传入 `{"path": null}` 导致崩溃。
> 根因：输入 Schema 缺少 required 验证，null 值未拦截。
> 修复：添加 `"type": "string"` 和 `"required": ["path"]`，增加 null 检查。

> 事故：Agent 解析工具输出失败，因为格式不固定。
> 根因：输出 Schema 不完整，不同错误返回不同结构。
> 修复：统一成功/失败响应格式，强制输出 Schema 验证。
