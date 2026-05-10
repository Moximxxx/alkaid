---
name: api-design
description: REST API 设计规范，包括命名、版本管理、错误响应格式。
---

# API Design Skill

## 使用场景

当用户需要设计新 API、审查 API 实现、或需要编写 API 文档时使用此 Skill。

## REST 基础

### 资源命名

| 规则 | 正确 | 错误 |
|------|------|------|
| 使用名词 | `/users` | `/getUsers` |
| 复数形式 | `/users` | `/user` |
| 小写字母 | `/user-profiles` | `/userProfiles` |
| 嵌套资源 | `/users/{id}/orders` | `/users/{id}/getOrders` |

### R-01: 使用标准 HTTP 方法

| 方法 | 用途 | 示例 |
|------|------|------|
| `GET` | 查询资源 | `GET /users` |
| `POST` | 创建资源 | `POST /users` |
| `PUT` | 完整更新 | `PUT /users/{id}` |
| `PATCH` | 部分更新 | `PATCH /users/{id}` |
| `DELETE` | 删除资源 | `DELETE /users/{id}` |

### R-02: 使用正确的状态码

| 状态码 | 含义 | 使用场景 |
|--------|------|---------|
| 200 | OK | 成功查询/更新 |
| 201 | Created | 成功创建 |
| 204 | No Content | 成功删除 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 |
| 422 | Unprocessable | 验证失败 |
| 429 | Too Many Requests | 请求限流 |
| 500 | Internal Error | 服务器错误 |

## URL 设计

### R-03: URL 结构规范

```
https://api.example.com/v1/{resource}/{id}/{sub-resource}

正确示例：
GET    /users/123/orders        # 用户 123 的订单
GET    /users/123/orders/456   # 用户 123 的订单 456
POST   /users/123/orders      # 为用户 123 创建订单

错误示例：
GET /getUserOrders/123
GET /users/123/orders/456/items  # 嵌套太深
```

### R-04: 过滤、排序、分页参数

```
# 过滤
GET /users?status=active&role=admin

# 排序
GET /users?sort=created_at&order=desc

# 分页
GET /users?page=2&per_page=20

# 组合
GET /users?status=active&sort=name&order=asc&page=1&per_page=20
```

### R-05: 避免动词在 URL 中

```bash
# 错误
POST /users/create
GET  /users/get/123
POST /users/update
POST /users/delete/123

# 正确
POST   /users           # 创建用户
GET    /users/123        # 获取用户
PUT    /users/123        # 更新用户
DELETE /users/123        # 删除用户
```

## 请求格式

### R-06: 请求体使用 JSON

```http
POST /users HTTP/1.1
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```

### R-07: 请求验证

```json
{
  "email": "not-an-email",
  "age": -5
}

{
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "age",
      "message": "Must be a positive integer"
    }
  ]
}
```

## 响应格式

### R-08: 标准成功响应

```json
{
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### R-09: 列表响应

```json
{
  "data": [
    { "id": "1", "name": "User 1" },
    { "id": "2", "name": "User 2" }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

### R-10: 错误响应格式

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "request_id": "abc123"
}
```

### R-11: 错误码规范

```python
ERROR_CODES = {
    # 客户端错误 4xx
    "VALIDATION_ERROR": 400,
    "UNAUTHORIZED": 401,
    "FORBIDDEN": 403,
    "NOT_FOUND": 404,
    "CONFLICT": 409,
    "RATE_LIMITED": 429,

    # 服务端错误 5xx
    "INTERNAL_ERROR": 500,
    "SERVICE_UNAVAILABLE": 503
}
```

## 版本管理

### R-12: URL 版本控制

```
# 正确
GET /api/v1/users
GET /api/v2/users

# 错误
GET /api/users?version=2
GET /api/users/headers
```

### R-13: 版本兼容性

```
v1 -> v2 兼容规则：
- 添加新字段（可选）
- 添加新的端点
- 不能删除或重命名字段
- 不能改变字段类型
- 不能改变语义
```

### R-14: 弃用策略

```json
{
  "deprecated": {
    "version": "v1",
    "sunset_date": "2024-12-31",
    "message": "v1 API will be discontinued on 2024-12-31. Please migrate to v2."
  }
}
```

## 分页

### R-15: Cursor 分页（适合大数据集）

```json
// 请求
GET /users?cursor=eyJpZCI6MTAwfQ&limit=20

// 响应
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6MTIwfQ",
    "has_more": true
  }
}
```

### R-16: Offset 分页（适合小数据集）

```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

## 认证

### R-17: 使用标准认证头

```http
Authorization: Bearer <token>

# 或

Authorization: Basic <credentials>
```

### R-18: 认证错误响应

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}

HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="api"
```

## CORS

### R-19: CORS 头配置

```http
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

## 速率限制

### R-20: 速率限制响应

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704067200
Retry-After: 3600

{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Retry after 3600 seconds."
  }
}
```

## 文档

### R-21: API 文档必须包含

```markdown
# API 文档

## 端点列表
- [ ] 每个端点的描述
- [ ] 请求参数（类型、必填/可选、约束）
- [ ] 请求示例
- [ ] 响应格式
- [ ] 响应示例
- [ ] 错误码列表
- [ ] 认证方式

## 示例
### GET /users/{id}

获取指定用户信息

**参数**
| 名称 | 类型 | 位置 | 必填 | 说明 |
|------|------|------|------|------|
| id   | string | path | 是   | 用户 ID |

**响应**
| 状态码 | 说明 |
|--------|------|
| 200   | 成功 |
| 404   | 用户不存在 |

**示例**
```bash
curl -X GET /users/123 \
  -H "Authorization: Bearer token"
```
```
```

## 验证命令

### R-22: API 测试脚本

```bash
#!/bin/bash
# api-test.sh

BASE_URL="https://api.example.com/v1"

# 测试健康检查
curl -X GET "$BASE_URL/health"

# 测试认证
curl -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"xxx"}'

# 测试 CRUD
curl -X POST "$BASE_URL/users" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test"}'

curl -X GET "$BASE_URL/users/1" \
  -H "Authorization: Bearer $TOKEN"
```
