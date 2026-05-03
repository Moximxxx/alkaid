---
name: security-checklist
description: 安全检查清单，包括依赖审计、密钥管理和常见漏洞防护。
---

# Security Checklist Skill

## 使用场景

当用户需要进行安全审查、审查代码安全性、或需要修复安全问题时使用此 Skill。

## 认证与授权

### R-01: 认证机制

```markdown
- [ ] 使用强密码策略（长度、复杂度）
- [ ] 密码哈希存储（bcrypt/argon2）
- [ ] 多因素认证（MFA/2FA）
- [ ] 会话超时机制
- [ ] 登录失败限制（防暴力破解）
- [ ] 安全的会话 ID 生成
```

### R-02: 授权检查

```python
# 错误：前端验证
if is_admin(user):  # 前端检查，可绕过
    show_admin_panel()

# 正确：后端验证
@require_admin
def admin_panel():
    # 后端验证
    pass

# 或
def admin_panel(user):
    if not user.is_admin:
        raise ForbiddenError()
```

### R-03: 基于角色的访问控制（RBAC）

```python
# 定义角色权限
PERMISSIONS = {
    'admin': ['read', 'write', 'delete'],
    'user': ['read'],
    'guest': []
}

def check_permission(role, action):
    return action in PERMISSIONS.get(role, [])
```

## 输入验证

### R-04: 所有输入必须验证

```python
# 正确：参数验证
from pydantic import BaseModel, validator

class UserInput(BaseModel):
    email: str
    age: int

    @validator('email')
    def validate_email(cls, v):
        if '@' not in v:
            raise ValueError('Invalid email')
        return v

    @validator('age')
    def validate_age(cls, v):
        if v < 0 or v > 150:
            raise ValueError('Invalid age')
        return v
```

### R-05: SQL 注入防护

```python
# 错误：字符串拼接
query = f"SELECT * FROM users WHERE id = {user_id}"

# 正确：参数化查询
query = "SELECT * FROM users WHERE id = %s"
cursor.execute(query, (user_id,))
```

### R-06: XSS 防护

```html
<!-- 输出编码 -->
<!-- 错误：直接输出 -->
<div>{{ user_input }}</div>

<!-- 正确：自动编码 -->
<div>{{ user_input | escape }}</div>

<!-- React 自动编码，但需注意 dangerouslySetInnerHTML -->
<div dangerouslySetInnerHTML={{ __html: content }} />  <!-- 谨慎使用 -->
```

## 敏感数据

### R-07: 敏感数据处理

```python
# 不在日志中记录敏感信息
logger.info(f"User login: {user_id}")  # 正确
logger.info(f"User login: {password}")  # 错误

# 不在错误信息中暴露敏感数据
# 错误
return {"error": f"Password for {email} is incorrect"}

# 正确
return {"error": "Invalid credentials"}
```

### R-08: 密钥管理

```bash
# 错误：硬编码密钥
API_KEY = "sk-1234567890"

# 正确：环境变量
import os
API_KEY = os.environ.get('API_KEY')

# 或使用密钥管理服务
# AWS Secrets Manager, HashiCorp Vault
```

### R-09: 环境变量配置

```python
# .env.example（不包含实际值）
DATABASE_URL=postgresql://user:password@localhost/db
API_KEY=your-api-key-here

# .env.local（本地开发，添加到 .gitignore）
DATABASE_URL=postgresql://user:secret@localhost/db
API_KEY=sk-xxx

# 生产：使用 secret 管理
```

## 依赖安全

### R-10: 依赖审计

```bash
# Python
pip audit
safety check

# Node.js
npm audit
npm audit --audit-level=high

# Go
go list -json -m all | nancy sleuth

# Ruby
bundle audit
```

### R-11: 依赖更新策略

```bash
# 定期检查过时依赖
# Python
pip list --outdated

# Node.js
npm outdated

# 自动化更新（测试后）
dependabot 或 Renovate
```

## HTTPS

### R-12: 强制 HTTPS

```nginx
# Nginx
server {
    listen 80;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000" always;
}
```

### R-13: 安全 Cookie

```http
Set-Cookie: session_id=abc123; Secure; HttpOnly; SameSite=Strict
```

## CSRF

### R-14: CSRF 防护

```python
# Flask-WTF
from flask_wtf.csrf import CSRFProtect
csrf = CSRFProtect(app)

# 表单
<form method="POST">
    <input type="hidden" name="csrf_token" value="{{ csrf_token() }}">
</form>

# API：使用 Authorization 头
Authorization: Bearer <token>
```

## CORS

### R-15: CORS 配置

```python
# 正确：明确指定允许的源
ALLOWED_ORIGINS = ['https://example.com']

@app.after_request
def add_cors(response):
    origin = request.headers.get('Origin')
    if origin in ALLOWED_ORIGINS:
        response.headers['Access-Control-Allow-Origin'] = origin
    return response
```

## 安全Headers

### R-16: 安全响应头

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

### R-17: CSP 配置

```http
Content-Security-Policy: \
    default-src 'self'; \
    script-src 'self' 'nonce-random123'; \
    style-src 'self' 'nonce-random123'; \
    img-src 'self' data: https:; \
    font-src 'self'; \
    connect-src 'self' https://api.example.com
```

## 加密

### R-18: 密码加密

```python
# 使用 bcrypt 或 argon2
import bcrypt

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())
```

### R-19: 传输加密

```python
# 强制 HTTPS
from urllib3.util import make_headers
import urllib3

http = urllib3.PoolManager(
    cert_reqs='CERT_REQUIRED',
    ca_certs='/path/to/ca-bundle.crt'
)
```

## 审计日志

### R-20: 安全审计日志

```python
# 记录所有安全相关事件
AUDIT_LOG.info({
    "event": "user_login",
    "user_id": user_id,
    "ip": request.remote_addr,
    "success": True,
    "timestamp": datetime.utcnow().isoformat()
})

# 必须记录
# - 登录尝试（成功/失败）
# - 权限变更
# - 敏感操作
# - 配置变更
```

## 常见漏洞防护

### R-21: 文件上传

```python
# 验证文件类型
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 验证文件内容（MIME type）
from PIL import Image
img = Image.open(file)
if img.format not in ['PNG', 'JPEG', 'GIF']:
    raise ValueError('Invalid image format')
```

### R-22: 命令注入

```python
# 错误：用户输入直接用于命令
import os
os.system(f"ls {user_input}")

# 正确：使用 subprocess
import subprocess
result = subprocess.run(
    ['ls', user_input],  # 参数作为列表传递
    capture_output=True,
    text=True,
    check=False
)
```

## 检查清单

```markdown
## Security Checklist

### 认证与授权
- [ ] 强密码策略
- [ ] 密码哈希存储
- [ ] MFA/2FA
- [ ] 会话管理
- [ ] RBAC 实现

### 输入验证
- [ ] 参数验证
- [ ] SQL 注入防护
- [ ] XSS 防护
- [ ] 命令注入防护

### 敏感数据
- [ ] 密钥管理
- [ ] 环境变量
- [ ] 日志脱敏
- [ ] 传输加密

### 依赖安全
- [ ] 依赖审计
- [ ] 定期更新
- [ ] 已知漏洞检查

### 基础设施
- [ ] HTTPS 强制
- [ ] 安全 Headers
- [ ] CORS 配置
- [ ] CSRF 防护

### 监控
- [ ] 安全审计日志
- [ ] 异常检测
- [ ] 入侵检测
```

## 验证命令

```bash
# 依赖安全扫描
pip audit
npm audit

# 静态代码分析
bandit -r .
semgrep --config=security .

# 密钥检测
trufflehog3 .
git secrets --scan
```
