---
name: debug-guide
description: 常见错误诊断流程和调试方法论。
---

# Debug Guide Skill

## 使用场景

当用户报告错误、需要诊断问题、或调试代码时使用此 Skill。

## 调试流程

### 1. 收集信息

```markdown
在开始调试前，必须收集：
1. 错误信息（完整的堆栈跟踪）
2. 复现步骤（如何让错误重现）
3. 环境信息（OS、版本、配置）
4. 相关日志
```

### 2. 定位问题

```bash
# 复现问题
./script.sh

# 捕获完整输出
./script.sh 2>&1 | tee output.log

# 启用调试模式
DEBUG=1 ./script.sh
```

### 3. 分析原因

```
问题定位检查清单：
□ 错误是什么类型的？
□ 错误发生在哪一行/哪个函数？
□ 是新引入的变更导致的？
□ 同样的错误之前是否发生过？
```

## 常见错误类型

### Runtime Errors

```python
# NullPointer / NoneError
# Python
if obj is None:  # 检查
    obj = default_obj

# KeyError
data.get("key", default_value)

# IndexError
items[index] if index < len(items) else None
```

### 逻辑错误

```python
# 错误：使用了 = 而不是 ==
if x = 5:  # 错误
    ...

if x == 5:  # 正确
    ...

# 错误：浮点数比较
if price == 0.1:  # 不稳定
    ...

if abs(price - 0.1) < 0.0001:  # 正确
    ...

# 错误：循环引用
def process():
    return process()  # 无限递归
```

### 并发错误

```python
# 竞态条件
# 错误
balance = 0
def deposit():
    balance += 1  # 不是原子操作

# 正确：使用锁
balance = 0
lock = threading.Lock()

def deposit():
    with lock:
        balance += 1
```

## 调试工具

### 日志调试

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def process():
    logger.debug("Entering process()")
    logger.debug(f"Input: {data}")
    try:
        result = do_something()
        logger.debug(f"Result: {result}")
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
```

### pdb 调试

```python
import pdb

def buggy_function():
    pdb.set_trace()  # 设置断点
    # ...
    result = problematic_code()

# 常用命令
# n: next line
# s: step into
# c: continue
# p variable: print variable
# l: list code
```

### pytest 调试

```bash
# 在失败的测试处进入 pdb
pytest --pdb

# 失败时立即停止
pytest -x

# 显示局部变量
pytest --capture=no

# 对特定测试调试
pytest tests/test_specific.py::test_specific_case -xvs --pdb
```

## 日志分析

### 关键日志位置

```bash
# 系统日志
/var/log/syslog      # Linux
/var/log/system.log  # macOS

# 应用日志
./logs/app.log
./logs/error.log

# Docker
docker logs <container>

# Kubernetes
kubectl logs <pod>
```

### 日志模式识别

```bash
# 查找错误
grep -i "error\|exception\|fatal" app.log

# 查找特定时间范围
grep "2024-01-01 10:00" app.log

# 查找关联请求
grep "request-id-123" *.log

# 统计错误频率
grep -c "ERROR" app.log
```

## 性能调试

### CPU 问题

```bash
# top 查看 CPU 使用
top -c

# Python cProfile
python -m cProfile -s cumtime script.py

# 输出火焰图
py-spy record -o profile.svg -- python script.py
```

### 内存问题

```bash
# 检测内存泄漏
python -m memory_profiler script.py

# Django Debug Toolbar
INSTALLED_APPS = [
    'debug_toolbar',
    ...
]
```

### 慢查询

```sql
-- PostgreSQL EXPLAIN
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- MySQL EXPLAIN
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

## 网络调试

### HTTP 请求

```bash
# curl 调试
curl -v http://api.example.com/endpoint

# 查看请求/响应头
curl -I http://api.example.com

# 发送 JSON
curl -X POST -H "Content-Type: application/json" \
     -d '{"key": "value"}' http://api.example.com
```

### 连接问题

```bash
# 检查端口
telnet host 80

# 测试网络延迟
ping host

# 路由追踪
traceroute host

# DNS 解析
dig domain
```

## 调试检查清单

```markdown
## Debug Checklist

### 基础检查
- [ ] 错误消息是什么？
- [ ] 错误在哪里发生？（堆栈跟踪）
- [ ] 什么时候开始发生的？
- [ ] 是什么导致了这个错误？

### 环境检查
- [ ] 环境变量是否正确？
- [ ] 依赖版本是否匹配？
- [ ] 配置文件是否正确？
- [ ] 权限是否足够？

### 代码检查
- [ ] 是否有空指针/空值？
- [ ] 是否有数组越界？
- [ ] 是否有并发问题？
- [ ] 是否有资源泄漏？

### 数据检查
- [ ] 数据库连接是否正常？
- [ ] 数据是否有效？
- [ ] 是否有数据竞争？
```

## 常见问题速查

### Python

| 问题 | 解决方法 |
|------|---------|
| ImportError | 检查 PYTHONPATH 和路径 |
| ModuleNotFoundError | pip install 缺失的包 |
| AttributeError | 检查对象类型 |
| TypeError | 检查参数类型 |

### Node.js

| 问题 | 解决方法 |
|------|---------|
| ENOENT | 检查文件路径 |
| ECONNREFUSED | 检查服务是否启动 |
| Cannot find module | 检查 node_modules |
| Memory leak | 检查事件监听器 |

### 数据库

| 问题 | 解决方法 |
|------|---------|
| Connection timeout | 检查连接字符串 |
| Lock wait timeout | 检查长事务 |
| Deadlock | 检查并发事务 |
