# Agent 体系约束

> 四角色分离：协调者(Coordinator)、构建者(Builder)、诊断者(Crash-Doctor)、复盘者(Retro)。

## 角色定义

| 角色 | 职责 | 写代码 | 触发条件 |
|------|------|--------|---------|
| Coordinator | 任务拆分、委派、验证 | 否 | **所有任务开始前必须调用** |
| Builder | 构建、部署、冒烟测试 | 否 | 修改源码后需要构建 |
| Crash-Doctor | 崩溃分析、根因定位 | 否 | CppCrash/SIGSEGV/ANR |
| Retro | 复盘、约束更新、事故记录 | 否 | 任务完成/验证失败 |

## 强制调用规则

### 所有任务必须先调用 Coordinator

无论任务大小，在执行任何代码修改、构建、调试、测试之前，**必须先调用 Coordinator**。

```
用户任务 → Coordinator 分析 → 生成合同 → 委派执行
```

**禁止**：主 agent 跳过 Coordinator 直接执行。

### 构建/部署必须调用 Builder

修改源码后需要构建/部署时，**必须调用 Builder**。

**禁止**：主 agent 直接执行 ninja/adb/hdc install。

### 崩溃/异常必须调用 Crash-Doctor

出现进程崩溃、ANR、命令异常退出时，**必须调用 Crash-Doctor**。

**禁止**：主 agent 直接读日志分析（可能误判根因）。

### 任务完成必须调用 Retro

任何任务完成后（成功或失败），**必须调用 Retro** 进行复盘。

## 交接报告

每个子任务完成后，执行者必须向 Coordinator 输出交接报告：

```markdown
### 交接报告
- 完成状态：[成功/失败/部分]
- 已修改文件：[列表]
- 验证结果：[PASS/FAIL + 脚本输出]
- 遗留问题：[如有]
```

## 工作区隔离

| Agent | 可修改文件 | 禁止操作 |
|-------|----------|---------|
| Coordinator | 无（只读+委派） | 不写代码 |
| Builder | 无（只执行脚本） | 不写代码 |
| Crash-Doctor | 无（只读日志） | 不写代码 |
| 实现者 | 合同指定的文件 | 不碰其他文件 |

## 验证方法

```bash
# 检查是否所有源码修改都有合同
for f in $(git diff --name-only | grep -E '\.(cpp|h|ets|ts)$'); do
    # 验证是否有对应合同
done
```
