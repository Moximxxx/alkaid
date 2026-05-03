# 合同机制约束

> 所有源码修改必须先通过协调者生成任务合同，Hook 拦截无合同的修改。

## 机制说明

### 什么是任务合同

任务合同是一个 JSON 文件，位于 `.opencode/contracts/` 目录，定义：
- 任务目标和范围
- 需要修改的文件
- 涉及的约束规则
- 功能覆盖清单
- 验证标准

### 合同生命周期

```
创建 → (in_progress) → 完成 → (completed)
         ↑
         └── 30分钟超时，需重新创建
```

### 合同格式

```json
{
  "task_id": "unique_task_identifier",
  "timestamp": 1234567890,
  "goal": "任务目标描述",
  "files_to_modify": ["file1.cpp", "file2.h"],
  "constraints": ["arch-layering", "contract-mechanism"],
  "tech_stack_constraints": ["cpp.md"],
  "verification": ["verify_arch.sh"],
  "coverage_checklist": {
    "feature_a": "assert: 验证 A 功能正常",
    "feature_b": "assert: 验证 B 功能正常",
    "edge_case": "SKIP: 需要特定环境"
  },
  "status": "in_progress"
}
```

## 规则

### R-01: 源码修改前必须先有合同

Edit/Write 操作会触发 `coordinator-guard.sh` 检查：
- 无有效合同 → **拦截**
- 合同过期（>30分钟）→ **拦截**

### R-02: 合同必须覆盖所有修改文件

`files_to_modify` 列出的文件是唯一允许修改的范围。

### R-03: 覆盖率闭环

`coverage_checklist` 中每个功能点必须：
- **assert:描述** — 已测试且有断言
- **SKIP:原因** — 不可测试，已标注原因
- 不允许空白或 TODO

### R-04: 任务完成后更新状态

将 `status` 从 `in_progress` 改为 `completed`。

## 验证方法

```bash
# 检查是否有有效合同
ls -t .opencode/contracts/*.json | head -1 | xargs stat -c %Y
# 如果输出时间距今超过 30 分钟，合同已过期

# 检查覆盖率是否有 TODO
grep -c "TODO" .opencode/contracts/*.json
# 非零表示有未完成项
```

## 事故案例

> 事故：主 agent 跳过协调者直接修改源码，导致多个任务并行修改同一文件，产生冲突。
> 根因：无合同机制，无协调，无文件锁。
> 修复：Hook 拦截 + 协调者委派 + 合同文件锁。
