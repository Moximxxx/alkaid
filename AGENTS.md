# AGENTS.md — 项目规则定义

> 本文件定义了项目的工作流约束、Agent 角色和验证规则。
> 所有任务必须遵守这些规则。
>
> **版本**: v2.0.0

## Agent 角色

| 角色 | 触发条件 | 职责 |
|------|---------|------|
| **Coordinator** | 所有任务开始前 | 任务拆分、委派、验证 |
| **Builder** | 修改源码后需构建 | 构建、部署、冒烟测试 |
| **Crash-Doctor** | CppCrash/SIGSEGV/ANR | 崩溃分析、根因定位 |
| **Retro** | 任务完成/验证失败 | 复盘、约束更新、事故记录 |

## 强制规则

### R-Contract: 源码修改必须先有合同

Edit/Write 操作会触发 `coordinator-guard.sh` 检查：
- 无有效合同 → **拦截**
- 合同过期（>30分钟）→ **拦截**

### R-Decision: 写操作必须通过决策门

Edit/Write/Delete 操作会触发 `decision-gate.sh` 检查：
- 高风险操作 → **拦截并提示确认**
- 中风险操作 → **记录并放行**

### R-Builder: 构建必须调用 Builder

修改源码后需要构建/部署时，**必须调用 Builder**。

**禁止**：主 agent 直接执行 ninja/adb/hdc install。

### R-Crash: 崩溃必须调用 Crash-Doctor

出现进程崩溃、ANR、命令异常退出时，**必须调用 Crash-Doctor**。

### R-Verify: 验证必须双重校验

Edit/Write 操作后会触发双重校验：
1. Agent 自验
2. 工具独立校验 (`post-edit-verify.sh`)

不一致时 → **质疑 Agent 结果**

## 危险命令处理

| 类别 | 模式 | 处理 |
|------|------|------|
| **绝对拦截** | `rm -rf /`, `mkfs`, `shutdown` | 直接拒绝 |
| **提示确认** | `rm `, `curl.*\|`, `chmod `, `dd` | 显示警告，等待确认 |
| **条件放行** | `git `, `npm `, `python ` | 检查参数后放行 |

## 资源限制

| 资源 | 限制 |
|------|------|
| Token/任务 | 180,000 |
| 工具调用/任务 | 500 |
| 循环迭代 | 200 |
| 任务时长 | 30 分钟 |
| 内存 | 2 GB |

## 自迭代闭环

验证失败时自动触发四阶段闭环：

1. **错误分析** (`incident-analyzer.sh`) - 根因定位
2. **依赖追踪** (`dep-tracker.sh`) - 影响范围
3. **约束更新** - 添加新约束或修改现有约束
4. **验证复验** - 确保修复有效

## 约束引用

| 类别 | 约束文档 |
|------|---------|
| 六层架构 | `constraints/harness-layers.md` |
| 上下文管理 | `constraints/context-management.md` |
| 工具编排 | `constraints/tool-orchestration.md` |
| 执行循环 | `constraints/execution-loop.md` |
| 决策点 | `constraints/decision-points.md` |
| 操作边界 | `constraints/operation-boundary.md` |
| 资源限制 | `constraints/resource-limits.md` |
| 安全护栏 | `constraints/guardrails.md` |
| 错误恢复 | `constraints/error-recovery.md` |
| 自迭代 | `constraints/self-improvement-loop.md` |
| 评估观测 | `constraints/evaluation.md` |
| 可观测性 | `constraints/observability.md` |

## 技术栈约束

| 技术栈 | 约束文档 |
|--------|---------|
| C++ | `constraints/tech-stack/cpp.md` |
| Qt | `constraints/tech-stack/qt.md` |
| HarmonyOS | `constraints/tech-stack/harmonyos.md` |
| ArkTS | `constraints/tech-stack/arktx.md` |
| Python | `constraints/tech-stack/python.md` |
| TypeScript | `constraints/tech-stack/typescript.md` |
| Go | `constraints/tech-stack/golang.md` |
| Java | `constraints/tech-stack/java.md` |
| Rust | `constraints/tech-stack/rust.md` |
| Node.js | `constraints/tech-stack/nodejs.md` |
| React | `constraints/tech-stack/react.md` |
| Vue3 | `constraints/tech-stack/vue3.md` |

## 验证脚本

| 脚本 | 用途 |
|------|------|
| `bash scripts/auto-verify.sh` | 完整验证 |
| `bash scripts/incremental-verify.sh` | 增量验证 |
| `bash scripts/git-diff-analyzer.sh` | 变更分析 |
| `bash scripts/verify_arch.sh` | 架构规则验证 |

## 工作流

```
用户任务 → Coordinator 分析 → 生成合同 → 委派执行
                                          ↓
                                    实现者写代码
                                          ↓
                              ┌───────────┴───────────┐
                              ↓                       ↓
                      decision-gate              pre-bash-guard
                      (决策拦截)                  (危险检查)
                              ↓                       ↓
                        写操作校验               双重校验
                        (双重校验)                (post-edit-verify)
                              ↓                       ↓
                        验证通过                   验证通过
                              ↓                       ↓
                              └───────────┬───────────┘
                                          ↓
                                    Builder 构建
                                          ↓
                                    冒烟测试
                                          ↓
                                    自迭代闭环
                                    (如需修复)
                                          ↓
                                    Retro 复盘
                                          ↓
                                    交接报告
```

## 事故记录

所有事故记录在 `${TOOL_DIR}/retros/incident_log.md`。

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.0.0 | 2026-04-30 | 全面升级：增加决策门、资源护栏、双重校验、自迭代闭环 |
| v1.0.0 | 2026-04-29 | 初始版本 |
