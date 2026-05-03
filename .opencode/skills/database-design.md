---
name: database-design
description: 数据库设计规范，包括索引、事务、SQL 安全性。
---

# Database Design Skill

## 使用场景

当用户需要设计数据库、审查 SQL 查询、或需要优化数据库性能时使用此 Skill。

## 设计原则

### R-01: 遵循三范式

| 范式 | 要求 |
|------|------|
| 1NF | 字段原子性，不可再分 |
| 2NF | 非主键字段完全依赖主键 |
| 3NF | 非主键字段之间无传递依赖 |

### R-02: 主键选择

```sql
-- 优先使用 UUID 或自增 ID
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- 或
    id BIGSERIAL PRIMARY KEY
);

-- 避免使用复合主键作为外键
-- 正确
SELECT * FROM orders WHERE user_id = 123;

-- 错误（使用复合主键关联）
SELECT * FROM orders o
JOIN order_items oi ON o.user_id = oi.user_id AND o.id = oi.order_id;
```

## 命名规范

### R-03: 表和字段命名

| 对象 | 规范 | 示例 |
|------|------|------|
| 表名 | 复数名词，下划线分隔 | `user_accounts` |
| 列名 | 蛇形，下划线分隔 | `created_at` |
| 主键 | `id` | `id` |
| 外键 | `{table}_id` | `user_id` |
| 索引 | `idx_{table}_{columns}` | `idx_users_email` |
| 唯一约束 | `uq_{table}_{columns}` | `uq_users_email` |

### R-04: 避免保留字

```sql
-- 错误：使用保留字
CREATE TABLE user (
    order VARCHAR(100),
    group VARCHAR(50)
);

-- 正确：转义或重命名
CREATE TABLE "user" (
    "order" VARCHAR(100),
    "group" VARCHAR(50)
);
```

## 字段设计

### R-05: 使用合适的类型

```sql
-- 字符串
VARCHAR(255)  -- 短文本
TEXT          -- 长文本
CHAR(36)      -- UUID

-- 数字
BOOLEAN       -- 布尔值
SMALLINT      -- -32768 到 32767
INTEGER       -- 常用整数
BIGINT        -- 大整数
DECIMAL(10,2) -- 精确小数（金额）

-- 日期时间
TIMESTAMP WITH TIME ZONE  -- 带时区的timestamp
DATE              -- 仅日期
TIME              -- 仅时间

-- 避免
FLOAT    -- 不精确
DOUBLE   -- 不精确
DATETIME -- 无时区信息
```

### R-06: NOT NULL 约束

```sql
-- 正确：明确指定 NOT NULL
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 错误：允许 NULL
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255),  -- 允许 NULL
    name VARCHAR(100)
);
```

### R-07: 默认值

```sql
-- 正确：提供默认值
created_at TIMESTAMP NOT NULL DEFAULT NOW(),
updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
is_active BOOLEAN NOT NULL DEFAULT TRUE,
status VARCHAR(20) NOT NULL DEFAULT 'pending'
```

## 索引设计

### R-08: 为查询创建索引

```sql
-- 常见查询模式
CREATE INDEX idx_users_email ON users(email);           -- WHERE email = ?
CREATE INDEX idx_orders_user_id ON orders(user_id);    -- WHERE user_id = ?
CREATE INDEX idx_orders_created_at ON orders(created_at); -- ORDER BY created_at

-- 复合索引（按查询顺序排列）
CREATE INDEX idx_orders_user_status ON orders(user_id, status);  -- WHERE user_id = ? AND status = ?
```

### R-09: 索引命名规范

```sql
-- 格式：idx_{table}_{columns}
idx_users_email
idx_orders_user_id_created_at
idx_products_category_price
```

### R-10: 避免过多索引

```sql
-- 错误：索引过多
CREATE TABLE orders (
    ...
);
CREATE INDEX idx_orders_1 ON orders(col1);
CREATE INDEX idx_orders_2 ON orders(col2);
CREATE INDEX idx_orders_3 ON orders(col3);
-- ...

-- 正确：只创建必要的索引
-- 根据实际查询模式创建索引
```

## 外键约束

### R-11: 使用外键维护引用完整性

```sql
-- 正确：使用外键
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    ...
);

-- 外键选项
ON DELETE RESTRICT    -- 禁止删除有关联记录的父记录
ON DELETE CASCADE     -- 级联删除
ON DELETE SET NULL    -- 设置为 NULL
ON DELETE NO ACTION   -- 不采取行动（检查延迟）
```

### R-12: 索引外键列

```sql
-- 外键列必须建立索引
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id)
);

-- 创建索引
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

## 事务

### R-13: 事务边界清晰

```sql
-- 正确：明确事务边界
BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
UPDATE transfers SET status = 'completed' WHERE id = 1;

COMMIT;

-- 错误：过长的事务
BEGIN;
-- 大量操作
COMMIT;
```

### R-14: 事务隔离级别

```sql
-- READ COMMITTED（默认）：防止脏读
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- REPEATABLE READ：防止不可重复读
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- SERIALIZABLE：最高隔离级别，性能影响大
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

## SQL 安全性

### R-15: 防止 SQL 注入

```python
# 错误：字符串拼接
query = f"SELECT * FROM users WHERE id = {user_id}"

# 正确：参数化查询
query = "SELECT * FROM users WHERE id = %s"
cursor.execute(query, (user_id,))
```

### R-16: 禁止使用字符串拼接构建 SQL

```python
# 错误
query = "INSERT INTO users (name) VALUES ('" + name + "')"

# 正确：使用参数化
query = "INSERT INTO users (name) VALUES (%s)"
cursor.execute(query, (name,))
```

### R-17: 限制 SQL 查询返回

```sql
-- 始终指定返回列
SELECT id, name, email FROM users;  -- 正确

SELECT * FROM users;  -- 错误

-- 限制结果数量
SELECT * FROM logs LIMIT 1000;
```

## 性能优化

### R-18: 避免 SELECT *

```sql
-- 错误
SELECT * FROM users WHERE id = 1;

-- 正确
SELECT id, name, email FROM users WHERE id = 1;
```

### R-19: 使用 EXPLAIN 分析查询

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders
WHERE user_id = 123
ORDER BY created_at DESC
LIMIT 20;
```

### R-20: 批量操作优于循环

```sql
-- 错误：循环插入
INSERT INTO users (name) VALUES ('name1');
INSERT INTO users (name) VALUES ('name2');

-- 正确：批量插入
INSERT INTO users (name) VALUES
('name1'),
('name2'),
('name3');
```

## 审计字段

### R-21: 添加审计字段

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,

    -- 审计字段
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by BIGINT REFERENCES users(id),
    deleted_at TIMESTAMP,  -- 软删除
    deleted_by BIGINT REFERENCES users(id)
);
```

## 迁移

### R-22: 使用迁移工具

```bash
# Alembic (Python)
alembic revision --autogenerate -m "add users table"
alembic upgrade head

# Flyway (Java)
flyway migrate

# Knex.js
npx knex migrate:latest
```

### R-23: 迁移命名规范

```
YYYYMMDDHHMMSS_create_users_table.js
YYYYMMDDHHMMSS_add_email_to_users.js
YYYYMMDDHHMMSS_create_indexes_for_users.js
```

## 检查清单

```markdown
- [ ] 表名使用复数形式
- [ ] 主键使用 UUID 或自增 ID
- [ ] 字段有 NOT NULL 约束
- [ ] 字段有合适的默认值
- [ ] 外键列有索引
- [ ] 常用查询有索引
- [ ] 使用参数化查询
- [ ] 避免 SELECT *
- [ ] 添加审计字段
```
