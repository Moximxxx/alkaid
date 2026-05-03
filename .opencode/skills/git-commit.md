---
name: git-commit
description: 规范化 Git 提交信息，使用 Conventional Commits 标准。
---

# Git Commit Skill

## 使用场景

当用户要求提交代码、编写 commit message、或需要生成 changelog 时使用此 Skill。

## Conventional Commits 标准

### 格式

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: add user login` |
| `fix` | Bug 修复 | `fix: resolve login timeout` |
| `docs` | 文档变更 | `docs: update README` |
| `style` | 代码格式（不影响功能） | `style: format code` |
| `refactor` | 重构（不是新功能或修复） | `refactor: extract user service` |
| `perf` | 性能优化 | `perf: improve query speed` |
| `test` | 测试相关 | `test: add user login tests` |
| `build` | 构建系统或依赖变更 | `build: upgrade webpack` |
| `ci` | CI 配置变更 | `ci: add github actions` |
| `chore` | 其他变更 | `chore: update dependencies` |
| `revert` | 回滚 | `revert: revert previous commit` |

### Scope（可选）

表示变更影响的模块：

```
feat(auth): add OAuth2 login
feat(api): add user endpoint
fix(database): resolve connection leak
```

## Commit 消息规范

### 正确示例

```
feat(users): add password reset functionality

Implement password reset flow with:
- Email verification
- Token generation
- Secure password update

Closes #123
```

```
fix(auth): resolve token refresh race condition

When multiple requests attempt to refresh token simultaneously,
the second request would fail with 401.

Added mutex lock to prevent concurrent refresh.

Fixes #456
```

### 错误示例

```
# 错误：描述模糊
fixed bug
update code
changes

# 正确
fix: resolve login timeout for expired sessions
docs: add API authentication guide
```

## Commit 规则

### R-01: 每条 commit 应该有单一职责

```bash
# 错误：一个 commit 多个无关变更
git commit -m "feat: add login and fix sidebar bug"

# 正确：分开提交
git commit -m "feat: add user login"
git commit -m "fix: resolve sidebar layout issue"
```

### R-02: 描述应该清晰简洁

| 错误 | 正确 |
|------|------|
| `update` | `add`, `remove`, `fix`, `improve` |
| `fix bug` | `fix: resolve null pointer in user service` |
| `changes` | `refactor: extract authentication logic` |

### R-03: Body 应该解释为什么

```bash
git commit -m "refactor: move auth to separate service

The auth logic was mixed with business logic, making it
hard to test and reuse.

This change extracts auth into its own service, improving
modularity and testability."
```

### R-04: Footer 引用相关 Issue

```
Closes #123
Fixes #456
Related to #789
```

## Branch 命名规范

| 类型 | 格式 | 示例 |
|------|------|------|
| Feature | `feature/{issue-id}-{short-desc}` | `feature/123-user-login` |
| Bugfix | `bugfix/{issue-id}-{short-desc}` | `bugfix/456-login-timeout` |
| Hotfix | `hotfix/{issue-id}-{short-desc}` | `hotfix/789-critical-security` |
| Release | `release/v{version}` | `release/v1.2.0` |
| Chore | `chore/{short-desc}` | `chore/update-deps` |

## Tag 规范

```
v{MAJOR}.{MINOR}.{PATCH}
  │      │      │
  │      │      └─ Patch: Bug fixes
  │      └─ Minor: 新功能（向后兼容）
  └─ Major: 破坏性变更
```

## 自动化工具

### commitlint

```bash
# 安装
npm install -D @commitlint/cli @commitlint/config-conventional

# commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional']
};
```

### husky

```bash
# 安装
npm install -D husky

# 启用 commit-msg hook
npx husky add .husky/commit-msg 'npx commitlint --edit $1'
```

## 生成 Changelog

```bash
# 使用 conventional-changelog
npx conventional-changelog -p angular -i CHANGELOG.md -s
```

### Changelog 格式

```markdown
# Changelog

## [1.2.0] - 2024-01-01

### Features
- **auth**: add OAuth2 login support (#123)
- **api**: add user profile endpoint (#124)

### Bug Fixes
- **auth**: resolve token refresh race condition (#125)

### Breaking Changes
- **api**: rename `/users` to `/api/users`
```

## 验证命令

```bash
# 检查 commit 格式
npx commitlint --from HEAD~1

# 检查 branch 命名
git branch --list "feature/*" | while read b; do
    if ! [[ $b =~ ^(feature|bugfix|hotfix|release|chore)/ ]]; then
        echo "Invalid branch name: $b"
    fi
done
```
