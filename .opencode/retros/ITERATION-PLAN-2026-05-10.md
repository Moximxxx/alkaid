# 摇光 (Alkaid) 完整迭代计划

> 目标：构建一个完整的、可用的 AI 实时音视频通话桌面应用
> 创建日期：2026-05-10 | 当前状态：Batch 2 待执行

---

## 迭代总览

| 批次 | 合同 | 类型 | 目标 | 风险 | 状态 |
|:----:|:----:|:----:|------|:----:|:----:|
| 1a | FEAT-001 | 模型+测试框架 | 更新AI模型列表 + Playwright E2E测试框架 | ⚪低 | ✅ 完成 |
| 1b | FIX-002 | 修复 | 修复代码审查问题（ai.ts/provider、类型补充） | ⚪低 | ✅ 完成 |
| 2 | FEAT-002 | 架构重构 | LangChain SDK 统一重构 AI 服务层 | 🔴高 | ⏳ 待执行 |
| 3 | FEAT-003 | 功能增强 | Google Gemini 完整集成 + 多模态视觉 | 🟡中 | ⏳ 待执行 |
| 4 | FEAT-004 | 功能增强 | 实时视频帧分析 + AI 连续视觉对话 | 🟡中 | ⏳ 待执行 |
| 5 | FEAT-005 | 功能增强 | 语音输入(STT) + 语音输出(TTS) 实现全双工 | 🟡中 | ⏳ 待执行 |
| 6 | FEAT-006 | 完善 | UI美化 + 完整E2E冒烟测试（截图+日志+点击） | ⚪低 | ⏳ 待执行 |

---

## Batch 2: LangChain 架构重构统一 (FEAT-002)

### 现状问题
当前 AI 服务有三套互不联通的实现：
1. `electron/main.cjs` — 内联 proxy server（CJS，实际在工作）
2. `src/main/services/ai.ts` — AIService class（TS，死代码未使用）
3. `src/renderer/services/ai.ts` — 手写 fetch + SSE 解析

LangChain 包已安装但零引用：`langchain@^1.4.0`, `@langchain/core@^1.1.44`, `@langchain/openai@^1.4.5`

### 目标架构
```
渲染进程 useAI hook → IPC invoke('ai:chat')
    ↓
Electron 主进程 (main.cjs → LangChain 统一)
    ├─ ChatOpenAI / ChatAnthropic / ChatGoogleGenerativeAI
    ├─ Streaming callback handler
    └─ 保持 HTTP proxy 向后兼容
```

### 修改文件
| 文件 | 改动 |
|------|------|
| `electron/main.cjs` | 引入 LangChain SDK 替代手写 fetch |
| `src/main/services/ai.ts` | 用 LangChain 重写 AIService |
| `src/main/langchain/provider-factory.ts` | 新建：供应商工厂 |
| `src/main/langchain/streaming-handler.ts` | 新建：流处理器 |
| `src/renderer/services/ai.ts` | 可选简化 |
| `package.json` | 补充 LangChain 包 |

### 验证
- `bun run typecheck` ✅
- `bun run test` ✅
- `bun run build` ✅
- smoke-tester 启动应用验证聊天功能

---

## Batch 3: Google Gemini 完整集成 (FEAT-003)

### 目标
在 Batch 2 基础上端到端集成 Gemini（文本+视觉）

### 关键能力
- Gemini 2.5 Pro 文本对话
- Gemini 2.5 Pro Vision 图像分析
- Gemini 2.5 Flash 轻量推理

### 修改文件
| 文件 | 改动 |
|------|------|
| `src/main/langchain/provider-factory.ts` | 添加 ChatGoogleGenerativeAI |
| `electron/main.cjs` | 添加 Gemini 路由 |

### 验证
- smoke-tester 验证 Gemini 对话
- 截图验证 UI 中 Gemini 可选

---

## Batch 4: 实时视频帧分析 (FEAT-004)

### 目标
实现摄像头画面的连续 AI 视觉分析

### 关键能力
- 自动定期发送视频帧给 AI 分析
- 帧率/间隔可配置
- 多供应商视觉支持（GPT-4.1 Vision、Claude Vision、Gemini Vision、豆包 Vision）

### 修改文件
| 文件 | 改动 |
|------|------|
| `src/renderer/hooks/useVideoChat.ts` | 启用帧分析代码 |
| `src/renderer/pages/VideoChat.tsx` | 自动分析开关 UI |
| `src/main/services/vision.ts` | 多供应商视觉支持 |

### 验证
- smoke-tester 启动视频页面截图
- 验证帧分析开关 UI

---

## Batch 5: 语音输入 + 语音输出 (FEAT-005)

### 目标
实现全双工 AI 音视频通话体验

### 关键能力
- **STT**: Web Speech API / 供应商语音识别
- **TTS**: Web Speech Synthesis / 供应商语音合成
- 语音+视频+文本三模态输入

### 修改文件
| 文件 | 改动 |
|------|------|
| `src/renderer/hooks/useSpeech.ts` | 新建：语音输入 hook |
| `src/renderer/hooks/useTTS.ts` | 新建：语音输出 hook |
| `src/renderer/pages/VideoChat.tsx` | 集成语音控制 |
| `package.json` | 可能新增依赖 |

### 验证
- smoke-tester 验证语音相关 UI 元素
- 截图确认按钮存在

---

## Batch 6: UI美化 + 完整E2E冒烟测试 (FEAT-006)

### 目标
全面美化 UI 并执行最终 E2E 验证

### 关键能力
- UI 响应式优化
- 深色模式
- 完整 E2E 冒烟测试（截图+日志+UI 分析+模拟点击）
- 最终复盘

### 修改文件
| 文件 | 改动 |
|------|------|
| `src/renderer/pages/VideoChat.tsx` | UI 美化 |
| `src/renderer/components/` | 组件优化 |
| `scripts/e2e/smoke.test.ts` | 增强测试 |
| `scripts/e2e/electron-fixture.ts` | 增强夹具 |

### 验证
- smoke-tester 完整 E2E 测试
- 所有批次功能回归验证

---

## 工作流循环

每次迭代执行以下完整流程：

```
Coordinator → Plan(分析) → Task-Executor(编码) 
  → Code-Reviewer(审查) → FIX(如需修复) 
  → Builder(构建) → Smoke-Tester(E2E测试) 
  → Retro(复盘) → 下一批次
```

真实 E2E 测试规格（每次必须执行）：
1. ✅ 后台启动 Vite 开发服务器
2. ✅ 轮询等待就绪（10秒间隔，2分钟超时）
3. ✅ 使用 Playwright 启动 Electron 应用
4. ✅ 截图4张（启动→交互前→点击后→最终）
5. ✅ 捕获控制台日志
6. ✅ 分析 UI 元素（至少找出所有交互元素）
7. ✅ 模拟点击测试
8. ✅ 安全清理后台进程（按 PID，严禁无差别杀进程）
