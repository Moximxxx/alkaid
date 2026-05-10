---
name: logging-best-practices
description: 日志记录规范，包括日志级别、格式和敏感信息处理。
---

# Logging Best Practices Skill

## 使用场景

当用户需要设置日志系统、调试日志配置、或需要排查日志问题时使用此 Skill。

## 日志级别

### 正确使用日志级别

| 级别 | 使用场景 | 示例 |
|------|---------|------|
| `DEBUG` | 开发调试信息 | `Entering function`, `Variable values` |
| `INFO` | 正常操作信息 | `User logged in`, `Request received` |
| `WARNING` | 警告，可能有问题 | `Retrying`, `Config missing, using default` |
| `ERROR` | 错误，需要关注 | `Failed to connect`, `Invalid input` |
| `CRITICAL` | 严重错误，系统不可用 | `Database down`, `Out of memory` |

### R-01: 不要在生产环境使用 DEBUG

```python
# 错误
logger.debug(f"User data: {user_data}")  # 生产环境禁止

# 正确
logger.info(f"User logged in: {user_id}")
```

### R-02: ERROR vs WARNING 区别

```python
# WARNING: 潜在问题，但程序能继续运行
if config.get("secret") is None:
    logger.warning("API secret not configured, using test mode")

# ERROR: 功能受损，需要处理
try:
    db.execute(query)
except ConnectionError:
    logger.error("Database connection failed")
```

## 日志格式

### R-03: 结构化日志（推荐）

```python
import logging
import json

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)
```

### R-04: 日志必须包含的信息

```python
# 正确格式
logger.info(
    "Request processed",
    extra={
        "request_id": request_id,
        "user_id": user_id,
        "duration_ms": duration_ms,
        "status_code": 200
    }
)

# 输出
{
    "timestamp": "2024-01-01T10:00:00Z",
    "level": "INFO",
    "message": "Request processed",
    "request_id": "abc123",
    "user_id": "user456",
    "duration_ms": 150
}
```

### R-05: 统一时间戳格式

```python
# 使用 ISO 8601 格式
import datetime

formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%dT%H:%M:%S%z'
)
```

## 敏感信息

### R-06: 禁止记录敏感信息

```python
# 错误：记录敏感信息
logger.info(f"User login: {email}, password: {password}")
logger.debug(f"Token: {token}")
logger.info(f"Card: {credit_card_number}")

# 正确：只记录标识符
logger.info(f"User login attempt: {user_id}")
logger.debug(f"Token generated for user: {user_id[:8]}...")
```

### R-07: 日志脱敏工具

```python
import re

SENSITIVE_PATTERNS = [
    (r'password["\']?\s*[:=]\s*["\']?([^"\'\s]+)', 'password=***'),
    (r'token["\']?\s*[:=]\s*["\']?([^"\'\s]+)', 'token=***'),
    (r'Bearer\s+[^\s]+', 'Bearer ***'),
    (r'\d{16}', '****'),  # 信用卡号
]

def sanitize_log_message(message):
    for pattern, replacement in SENSITIVE_PATTERNS:
        message = re.sub(pattern, replacement, message, flags=re.IGNORECASE)
    return message
```

## 日志上下文

### R-08: 使用 MDC 传递上下文

```python
import logging
from contextvars import ContextVar

request_id_var: ContextVar[str] = ContextVar('request_id', default='')

class RequestIDFilter(logging.Filter):
    def filter(self, record):
        record.request_id = request_id_var.get()
        return True

# 设置请求上下文
def handle_request(request):
    request_id = generate_request_id()
    request_id_var.set(request_id)

    logger.info("Processing request")

# 所有日志自动包含 request_id
```

### R-09: 使用 LoggerAdapter

```python
logger = logging.getLogger(__name__)

class RequestLoggerAdapter(logging.LoggerAdapter):
    def process(self, msg, kwargs):
        return f"[{self.extra['request_id']}] {msg}", kwargs

adapter = RequestLoggerAdapter(logger, {'request_id': request_id})
adapter.info("Request processed")
```

## 日志文件管理

### R-10: 日志轮转

```python
import logging.handlers

handler = logging.handlers.RotatingFileHandler(
    'app.log',
    maxBytes=10_000_000,  # 10MB
    backupCount=5
)

handler.setFormatter(formatter)
logger.addHandler(handler)
```

### R-11: 不同级别输出到不同文件

```python
error_handler = FileHandler('errors.log')
error_handler.setLevel(ERROR)
error_handler.addFilter(lambda record: record.levelno >= ERROR)

debug_handler = FileHandler('debug.log')
debug_handler.setLevel(DEBUG)
debug_handler.addFilter(lambda record: record.levelno <= DEBUG)
```

## 异步日志

### R-12: 生产环境使用异步日志

```python
import logging
from logging.handlers import QueueHandler, QueueListener
from queue import Queue

queue = Queue()
handler = QueueHandler(queue)
logger.addHandler(handler)

listener = QueueListener(queue, file_handler, respect_handler_level=True)
listener.start()
```

## 验证命令

### R-13: 日志检查脚本

```bash
#!/bin/bash
# 检查日志中的敏感信息
grep -E "password|token|secret|key" app.log

# 统计错误频率
grep -c "ERROR" app.log

# 查看最新错误
tail -100 app.log | grep -A5 "ERROR"

# 检查日志格式
jq . app.json.log 2>/dev/null | head
```

## 配置示例

### Python (dictConfig)

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': JSONFormatter,
        },
        'simple': {
            'format': '%(asctime)s - %(levelname)s - %(message)s'
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
            'level': 'INFO',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'app.log',
            'maxBytes': 10485760,
            'backupCount': 5,
            'formatter': 'json',
            'level': 'INFO',
        },
    },
    'root': {
        'level': 'INFO',
        'handlers': ['console', 'file']
    },
}
```

### Node.js (winston)

```javascript
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

// 生产环境同时输出到控制台
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console());
}
```

## 检查清单

```markdown
- [ ] 日志级别使用正确
- [ ] 日志格式结构化
- [ ] 时间戳使用统一格式
- [ ] 敏感信息已脱敏
- [ ] 日志包含请求 ID
- [ ] 日志文件有轮转
- [ [ 生产环境 DEBUG 已关闭
- [ ] 错误日志有堆栈跟踪
```
