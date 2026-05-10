---
name: ci-cd-pipeline
description: CI/CD 流水线规范，包括测试阶段、部署策略和质量门槛。
---

# CI/CD Pipeline Skill

## 使用场景

当用户需要配置 CI/CD 流水线、审查部署流程、或需要优化自动化构建时使用此 Skill。

## 流水线阶段

### R-01: 标准流水线阶段

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  BUILD  │ -> │   TEST  │ -> │   LINT  │ -> │  DEPLOY │ -> │ VERIFY  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

| 阶段 | 说明 | 失败策略 |
|------|------|---------|
| BUILD | 构建应用 | 阻塞 |
| TEST | 运行测试 | 阻塞 |
| LINT | 代码检查 | 警告 |
| DEPLOY | 部署环境 | 阻塞 |
| VERIFY | 验证部署 | 阻塞 |

## GitHub Actions

### R-02: 基础工作流

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/
```

### R-03: 测试阶段

```yaml
  test:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: build

      - name: Run tests
        run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### R-04: 部署阶段

```yaml
  deploy:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://example.com

    steps:
      - uses: actions/checkout@v4

      - name: Deploy
        run: ./deploy.sh production
```

## 质量门槛

### R-05: 测试覆盖率门槛

```yaml
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Run tests with coverage
        run: npm test -- --coverage

      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80%"
            exit 1
          fi
```

### R-06: 门禁检查

```yaml
  gate:
    runs-on: ubuntu-latest
    outputs:
      passed: ${{ steps.checks.outputs.passed }}
    steps:
      - id: checks
        run: |
          # 必须全部通过
          ./scripts/gate-check.sh
          echo "passed=true" >> $GITHUB_OUTPUT
```

## 分支策略

### R-07: 分支保护规则

```yaml
# .github/workflows/protect.yml
name: Branch Protection

on:
  push:
    branches:
      - main

jobs:
  protect:
    runs-on: ubuntu-latest
    steps:
      - name: Check PR status
        run: |
          # 确保 main 分支只能通过 PR 合并
          # 强制检查：
          # 1. 所有测试通过
          # 2. 至少 2 人 review
          # 3. 没有冲突
```

### R-08: 环境分支策略

```
main        → 生产环境 (production)
develop     → 预发布环境 (staging)
feature/*   → 开发环境 (preview)
hotfix/*    → 热修复分支
```

## 测试策略

### R-09: 测试分层

```yaml
jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - name: Unit tests
        run: npm run test:unit

  integration-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - name: Integration tests
        run: npm run test:integration

  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - name: E2E tests
        run: npm run test:e2e
```

### R-10: 矩阵构建

```yaml
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
        node-version: [16, 18, 20]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - name: Run tests
        run: npm test
```

## 部署策略

### R-11: 蓝绿部署

```yaml
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to blue
        if: github.ref == 'refs/heads/main'
        run: |
          kubectl set image deployment/app-blue app=myapp:blue
          kubectl rollout status deployment/app-blue

      - name: Smoke test blue
        run: |
          curl -f https://blue.example.com/health

      - name: Switch to blue
        run: |
          kubectl patch service/app -p '{"spec":{"selector":{"version":"blue"}}}'
```

### R-12: 金丝雀发布

```yaml
  deploy-canary:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy canary (10%)
        run: |
          kubectl set image deployment/app app=myapp:new
          kubectl scale deployment/app --replicas=1

      - name: Monitor canary
        run: ./scripts/monitor-canary.sh

      - name: Full rollout
        if: success()
        run: |
          kubectl scale deployment/app --replicas=10
```

## 安全

### R-13: 依赖扫描

```yaml
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Scan dependencies
        run: |
          npm audit --audit-level=high
          # 或使用 Snyk
          snyk test

      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
```

### R-14: 镜像安全

```yaml
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Scan image
        run: |
          trivy image --severity HIGH,CRITICAL myapp:${{ github.sha }}
```

## 缓存

### R-15: 依赖缓存

```yaml
  build:
    steps:
      - name: Cache npm packages
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-npm-

      - name: Cache pip packages
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
```

## 通知

### R-16: 流水线状态通知

```yaml
  ci:
    runs-on: ubuntu-latest
    steps:
      - name: Notify on failure
        if: failure()
        uses: 8398a2/action-slack@v3
        with:
          status: ${{ job.status }}
          fields: repo,message,commit,author,workflow
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## 验证命令

### R-17: 本地验证

```bash
# 验证 GitHub Actions 语法
npx @github-actions/cli validate

# 本地运行 action（使用 act）
act -l  # 列出所有 jobs
act -j build  # 运行特定 job

# Docker Compose 测试
docker compose up --abort-on-container-exit
```

## 检查清单

```markdown
## CI/CD Pipeline Checklist

- [ ] 流水线阶段完整
- [ ] 测试覆盖率门槛
- [ ] 分支保护规则
- [ ] 门禁检查
- [ ] 部署策略（金丝雀/蓝绿）
- [ ] 安全扫描
- [ ] 依赖缓存
- [ ] 失败通知
- [ ] 回滚机制
```
