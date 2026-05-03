---
name: docker-best-practices
description: Docker 最佳实践，包括 Dockerfile 规范、多阶段构建和安全配置。
---

# Docker Best Practices Skill

## 使用场景

当用户需要编写 Dockerfile、审查 Docker 配置、或需要优化镜像构建时使用此 Skill。

## Dockerfile 规范

### R-01: 使用官方基础镜像

```dockerfile
# 正确
FROM node:18-alpine
FROM python:3.11-slim
FROM eclipse-temurin:17-jre-alpine

# 错误
FROM ubuntu
FROM centos:7
FROM node:latest
```

### R-02: 使用特定版本标签

```dockerfile
# 错误：latest 标签
FROM node:latest
FROM python:3.11

# 正确：特定版本
FROM node:18.17.0-alpine3.18
FROM python:3.11.7-slim-bookworm
FROM eclipse-temurin:17.0.8_10-jre-alpine
```

### R-03: 指定用户运行（安全）

```dockerfile
# 创建应用用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 使用非 root 用户
USER appuser

# 错误：以 root 运行
# 不要这样做
```

## 多阶段构建

### R-04: 使用多阶段构建减小镜像

```dockerfile
# 阶段1：构建
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# 阶段2：运行
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
CMD ["node", "dist/index.js"]
```

### R-05: Python 多阶段构建

```dockerfile
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --target=/app/deps -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /app/deps /usr/local/lib/python3.11/site-packages
COPY . .
USER python
CMD ["python", "app.py"]
```

## 层缓存

### R-06: 优化层缓存

```dockerfile
# 正确：先复制依赖文件
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

# 错误：每次修改代码都会重新安装依赖
COPY . .
RUN pip install -r requirements.txt
```

### R-07: 使用 .dockerignore

```
# 排除不需要的文件
node_modules
.git
.env
*.log
*.md
tests/
docs/
```

## 健康检查

### R-08: 添加 HEALTHCHECK

```dockerfile
# HTTP 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 或脚本检查
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD node /app/healthcheck.js
```

## 安全配置

### R-09: 不存储敏感信息

```dockerfile
# 错误：硬编码密钥
ENV API_KEY=sk-1234567890
COPY . .

# 正确：通过运行时注入
ENV API_KEY_FILE=/run/secrets/api_key
# 使用 docker run -e 或 secret mount
```

### R-10: 限制资源

```dockerfile
# 限制 CPU 和内存
# 在 docker-compose.yml 或运行时设置
# 不要在 Dockerfile 中硬编码资源限制
```

### R-11: 使用最小权限用户

```dockerfile
# 创建应用用户
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# 复制文件
COPY --chown=appuser:appgroup . .

USER appuser
```

## 镜像优化

### R-12: 减小镜像体积

```dockerfile
# 正确
FROM alpine:3.18
RUN apk add --no-cache nodejs npm

# 错误
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y nodejs npm
RUN apt-get clean && rm -rf /var/lib/apt/lists/*
```

### R-13: 合并 RUN 指令

```dockerfile
# 正确：合并相关操作
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        git \
        ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 错误：多个 RUN
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get clean
```

### R-14: 使用 COPY 而非 ADD

```dockerfile
# 优先使用 COPY
COPY requirements.txt /app/
COPY package*.json /app/

# ADD 用于 URL 或 tar 提取
ADD https://example.com/file.tar.gz /app/
ADD archive.tar.gz /app/
```

## 环境变量

### R-15: 环境变量配置

```dockerfile
# 设置默认值
ENV NODE_ENV=production
ENV PORT=3000

# 或在运行时覆盖
# docker run -e PORT=8080 myapp
```

### R-16: 使用 ENV 用于易变配置

```dockerfile
# 正确
ENV APP_VERSION=1.0.0
ENV GIT_COMMIT=$(git rev-parse HEAD)

# 错误：不要在镜像中存储密钥
ENV SECRET_KEY=my-secret-key
```

## 入口点

### R-17: 正确使用 ENTRYPOINT 和 CMD

```dockerfile
# 可执行文件形式
ENTRYPOINT ["node", "app.js"]
CMD ["--port", "3000"]

# Shell 形式（难以捕获信号）
# ENTRYPOINT node app.js
# CMD --port 3000
```

### R-18: 使用 exec 格式

```dockerfile
# 正确：exec 格式
ENTRYPOINT ["python", "app.py"]
CMD ["--host", "0.0.0.0"]

# 错误：shell 格式
ENTRYPOINT python app.py
CMD --host 0.0.0.0
```

## 构建优化

### R-19: 并行构建

```bash
docker build \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    --progress=plain \
    -t myapp:latest .
```

### R-20: 使用 BuildKit

```bash
# 启用 BuildKit
export DOCKER_BUILDKIT=1

# 或使用 docker compose
docker compose build
```

## Docker Compose

### R-21: Docker Compose 规范

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    user: "1001:1001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: myapp
    restart: unless-stopped

volumes:
  postgres_data:
```

## 验证命令

### R-22: 安全扫描

```bash
# Trivy 扫描
trivy image myapp:latest

# Hadolint 检查 Dockerfile
hadolint Dockerfile

# Docker Scout
docker scout cves myapp:latest
```

### R-23: 镜像大小检查

```bash
# 查看镜像大小
docker images | grep myapp

# 分层大小
docker history myapp:latest
```

## 检查清单

```markdown
## Docker Best Practices Checklist

- [ ] 使用官方基础镜像
- [ ] 使用特定版本标签
- [ ] 非 root 用户运行
- [ ] 多阶段构建
- [ ] 层缓存优化
- [ ] 使用 .dockerignore
- [ ] 添加 HEALTHCHECK
- [ ] 不存储敏感信息
- [ ] 使用 COPY 而非 ADD
- [ ] 合并 RUN 指令
- [ ] 减小镜像体积
```
