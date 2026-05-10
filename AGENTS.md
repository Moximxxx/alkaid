# AGENTS.md — 摇光 (Alkaid)

> 摄像头 AI 对话助手 — Electron + React + TypeScript 项目
> 多 Agent 协同开发规范入口。详细约束见 `instructions` 引用的文件。

## **R-0: 语言强制规范 — 所有思考过程与输出必须使用简体中文**

**所有 Agent（含主 Agent 与所有子 Agent）的思考过程、分析、回答、代码注释、文档编写、交接报告，必须使用简体中文。**

唯一例外：代码标识符（变量名、函数名、类型名）、英文术语、命令行指令、JSON 字段名 / YAML 键名可使用英文。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Electron 33 |
| 前端 | React 18 + TypeScript 5 |
| 构建 | Vite 5 + tsc |
| 样式 | Tailwind CSS 3 |
| AI SDK | LangChain |
| 测试 | Vitest + @testing-library/react |
| 包管理 | bun |

---

## 常用命令

```bash
bun run dev              # 启动 Vite 开发服务器
bun run dev:electron      # 启动 Vite + Electron 开发模式
bun run build             # tsc 编译 + Vite 打包
bun run lint              # ESLint 检查
bun run typecheck         # TypeScript 类型检查
bun run test              # Vitest 运行测试
bun run electron:build    # electron-builder 构建桌面安装包
```

---

## Agent 工作流

```pseudo
// ================================================================
// coordinator 是唯一的主 Agent，一切任务的入口与出口
// ================================================================
FUNCTION main(user_task):
    // ---------- Phase 1: 分析 ----------
    contract = coordinator.analyze(user_task)
    // contract 对象包含: goal, estimated_subagent, constraints 引用

    // ---------- Phase 2: 生成合同 ----------
    contract = coordinator.generate_contract(contract)
    // 写入 .opencode/contracts/{task_id}.json
    contract.status = pending
    // 合同必填: task_id, timestamp, goal, files_to_modify,
    //          constraints, verification, coverage_checklist, status

    // ---------- Phase 3: 验证合同 ----------
    validation = validate_contract(contract)
    // validate_contract 读取 contract-schema.json 做 JSON Schema 校验
    // 返回值: { valid: bool, errors: string[] }
    IF validation.result == FAIL:
        // 合同不规范，打回给 coordinator 修正
        coordinator.fix_contract(contract, validation.errors)
        GOTO validation

    // ---------- Phase 4: 委派 plan 分析 ----------
    // plan 子 Agent 只读分析、评估影响范围、推荐子 Agent、判断是否需构建
    plan = coordinator.delegate(plan, contract)

    // ---------- Phase 5: 委派执行 ----------
    contract.status = active
    // 根据 plan.recommended_subagent 决定委派目标:
    //   - 代码修改 → task-executor
    //   - 纯构建   → builder
    result = coordinator.delegate(plan.recommended_subagent, contract)
    // result 结构: { success: bool, handoff: report, files_modified: string[] }

    // ---------- Phase 6: 执行结果判断 ----------
    IF result.success == false:
        contract.status = failed
        crash = coordinator.delegate(crash-doctor, result.errors)
        // crash 诊断事故根因
        coordinator.handle_failure(result.handoff, crash)
        GOTO retro_phase

    // ---------- Phase 7: 代码审查（条件触发）----------
    IF contract.type == code_modification:
        review = coordinator.delegate(code-reviewer, {
            contract: contract,
            modified_files: result.files_modified
        })
        // code-reviewer 对照 constraints 逐文件审查
        // review 结构: { pass: bool, issues: [{severity, file, line, message}] }
        IF review.pass == false:
            // 问题回传给 task-executor 修复
            fix_contract = coordinator.create_fix_contract(contract, review.issues)
            fix_result = coordinator.delegate(task-executor, fix_contract)
            IF fix_result.success == false:
                contract.status = failed
                GOTO retro_phase

    // ---------- Phase 8: 构建验证（条件触发）----------
    IF plan.requires_build == true:
        build_result = coordinator.delegate(builder, contract)
        IF build_result.success == false:
            contract.status = failed
            crash = coordinator.delegate(crash-doctor, build_result.errors)
            coordinator.handle_failure(build_result.handoff, crash)
            GOTO retro_phase

    // ---------- Phase 9: 完成 ----------
    contract.status = completed
    // coordinator 汇总所有子 Agent 的交接报告

    // ---------- Phase 10: 复盘（强制，R-6）----------
    label retro_phase:
    retro = coordinator.delegate(retro, {
        contract: contract,
        plan: plan,
        execution_result: result,
        review: review,            // 可能为 null
        build_result: build_result  // 可能为 null
    })
    // retro 输出:
    //   1. 落盘复盘报告 → .opencode/retros/{task_id}.md
    //   2. 如有事故 → 写入 .opencode/incidents/INC-YYYY-MMDD-NNN.md
    //   3. 如有新约束 → 更新 AGENTS.md + .opencode/constraints/
    //   4. 返回复盘结论: PENDING / NO_ACTION / NEW_CONSTRAINT / UPDATE_CONSTRAINT

    RETURN coordinator.generate_handoff(
        contract, plan, result, review, build_result, retro
    )
```

### Agent 列表

| Agent | 类型 | 模型 | 职责 | 提示词文件 |
|-------|------|------|------|-----------|
| coordinator | primary | V4 Pro | 任务入口与出口：拆分、合同、委派、验证 | `agents/coordinator.md` |
| plan | subagent | V4 Flash | 只读分析、方案评审 | `agents/plan.md` |
| task-executor | subagent | V4 Flash | 代码编写（合同范围内） | `agents/task-executor.md` |
| builder | subagent | V4 Flash | 构建、部署、冒烟测试 | `agents/builder.md` |
| code-reviewer | subagent | V4 Flash | 代码审查 | `agents/code-reviewer.md` |
| crash-doctor | subagent | V4 Pro | 崩溃诊断 | `agents/crash-doctor.md` |
| retro | subagent | V4 Pro | 复盘、约束更新 | `agents/retro.md` |

---

## 核心规则

### R-0: 语言强制规范 — 所有思考过程与输出必须使用简体中文
→ 见本文件开头详细说明

### R-7: 禁止跳过 Coordinator
一切任务（含代码修改、构建、诊断、复盘、查询分析）必须通过 Coordinator 生成合同并委派给子 Agent 执行。禁止主 agent 绕过 Coordinator 直接执行 Edit / Write / Bash / Task。

### R-8: 合同必须
Task-Executor 仅能修改合同 `files_to_modify` 指定的文件，合同有效期 30 分钟。

### R-6: 完整工作流闭环
每个任务必须走完：Coordinator → Plan → Task-Executor → Builder → Retro。

### R-9: 网络搜索时间戳
网络搜索前必须先执行 `date` 获取当前时间，将时间加入搜索关键词。

### R-10: Builder 构建前工作区洁净检查
Builder 执行构建前必须检查 `git status --porcelain`，如有未提交的源码变更需报告 WARNING。
→ 详细事故: INC-2026-0506-001 (`.opencode/incidents/INC-2026-0506-001.md`)

### P-01: 模型列表一致性
AI 模型列表需在以下文件保持一致：`src/shared/constants.ts`、`src/renderer/pages/Welcome.tsx`、`src/renderer/pages/Settings.tsx`、`src/renderer/services/ai.ts`。
→ 详细事故: INC-2026-0503-002 (`.opencode/incidents/INC-2026-0503-002.md`)

---

## 约束文档

详细约束规则通过 `opencode.json` 的 `instructions` 字段引用，位于 `.opencode/constraints/` 目录：
- `agent-system.md` — Agent 角色分离与工作区隔离
- `arch-layering.md` — 三层架构依赖规则
- `contract-mechanism.md` — 合同机制与生命周期
- `tech-stack/typescript.md` — TypeScript 约束
- `tech-stack/react.md` — React 编码约束

合同模板：`.opencode/contracts/contract-schema.json`

验证工具：`tools/validate-contract`（OpenCode 原生工具）

---

