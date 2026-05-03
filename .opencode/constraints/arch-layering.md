# 架构分层约束

> 强制三层架构依赖单向，禁止反向或平层交叉。

## 架构事实

典型的三层架构：

```
Layer 3: 前端/UI        — ArkTS HAP / React / Vue / Android UI
Layer 2: 业务逻辑/本地库 — C++ .so / Java jar / Python 模块
Layer 1: 运行时/编译器  — MiKTeX / Node.js / JVM / Python 运行时
```

## 核心规则

### R-01: 禁止反向依赖

```
✓ 正确：Layer 3 → Layer 2 → Layer 1
✗ 错误：Layer 1 → Layer 2（后端不能调用前端）
✗ 错误：Layer 2 → Layer 3（业务逻辑不能直接调用 UI）
✗ 错误：Layer 3 → Layer 1（前端不能直接调用后端运行时）
```

### R-02: 跨层通信必须通过接口

| 跨层场景 | 正确方式 |
|---------|---------|
| Layer 3 调用 Layer 2 | NAPI / FFI / RPC |
| Layer 2 调用 Layer 3 | 信号文件 / 回调函数 / 事件 |
| Layer 3 调用 Layer 1 | 间接通过 Layer 2 |

### R-03: 禁止循环依赖

```
✓ 正确：A → B → C
✗ 错误：A → B → C → A
```

## 验证方法

```bash
# 检查是否有反向依赖
grep -rn "include.*layer3.*\.h" layer1/ layer2/ 2>/dev/null
grep -rn "import.*from.*layer3" layer1/ layer2/ 2>/dev/null
```

## 事故案例

> 事故：Layer 2 (C++) 直接调用 Layer 3 (ArkTS) 的 UI API，导致跨线程崩溃。
> 根因：违反 R-01，C++ 跨线程操作 UI 对象。
> 修复：通过信号文件通知 ArkTS 宿主执行 UI 操作。
