# 架构分层约束

> 强制三层架构依赖单向，禁止反向或平层交叉。

## 架构事实

本项目三层架构：

```
Layer 3: 前端/UI      — React 18 + React Router (renderer 进程)
Layer 2: 业务逻辑     — Electron 33 main 进程 + LangChain API 服务
Layer 1: 运行时       — Node.js / TypeScript 编译后运行时
```

## 核心规则

### R-01: 禁止反向依赖

```
✓ 正确：Layer 3 → Layer 2 → Layer 1
✗ 错误：Layer 1 → Layer 2（运行时不能调用业务逻辑）
✗ 错误：Layer 2 → Layer 3（业务逻辑不能直接调用 UI）
✗ 错误：Layer 3 → Layer 1（前端不能直接调用运行时）
```

### R-02: 跨层通信必须通过接口

| 跨层场景 | 正确方式 |
|---------|---------|
| Layer 3 调用 Layer 2 | Electron IPC (contextBridge + ipcRenderer/ipcMain) |
| Layer 2 调用 Layer 3 | 回调函数 / 事件推送 |
| Layer 3 调用 Layer 1 | 间接通过 Layer 2 |

### R-03: 禁止循环依赖

```
✓ 正确：A → B → C
✗ 错误：A → B → C → A
```

## 验证方法

```bash
# 检查 renderer 是否直接调用了 Node.js API
grep -rn "require('electron')" src/renderer/ 2>/dev/null
grep -rn "fs\.\|process\.\|path\." src/renderer/ 2>/dev/null
```
