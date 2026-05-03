# P-01: 模型列表一致性约束

> 本文档定义 AI 模型列表在多文件间保持一致的强制规则。

## 背景

AI 模型列表在项目中分散在多个文件中，用于不同的功能场景：
- **共享常量** (`src/shared/constants.ts`)：提供统一的模型定义
- **欢迎页** (`src/renderer/pages/Welcome.tsx`)：新用户首次配置时选择模型
- **设置页** (`src/renderer/pages/Settings.tsx`)：用户随时更改模型
- **AI 服务** (`src/renderer/services/ai.ts`)：实际 API 调用时使用的模型标识

当模型列表更新时，必须同时更新所有文件，以确保一致性。

## 一致性要求

### 1. 模型标识符一致

每个模型的唯一标识符（`value` 或 `id`）必须在所有文件中保持相同。

**示例**：
```typescript
// ✅ 一致
{ value: "gpt-4.1", label: "GPT-4.1" }  // Welcome.tsx
{ id: "gpt-4.1", name: "GPT-4.1" }       // constants.ts

// ❌ 不一致
{ value: "gpt-4.1", label: "GPT-4.1" }  // Welcome.tsx
{ id: "gpt-4o", name: "GPT-4o" }         // constants.ts
```

### 2. 模型数量一致

每个 provider 下的模型数量必须在所有文件中保持相同。

### 3. 默认模型一致

每个文件的默认模型选择必须协调，通常指向该 provider 的第一个模型。

## 需要同步的文件清单

| 文件 | 用途 | 同步内容 |
|------|------|---------|
| `src/shared/constants.ts` | 共享常量 | `AI_MODELS` 对象 |
| `src/renderer/pages/Welcome.tsx` | 欢迎页 | `MODELS` 对象 |
| `src/renderer/pages/Settings.tsx` | 设置页 | `MODELS` 对象 |
| `src/renderer/services/ai.ts` | AI 服务 | `MODEL_CONFIG.model` |

## 更新检查清单

当执行模型列表更新任务时，必须逐项确认：

- [ ] `src/shared/constants.ts` 中的 `AI_MODELS` 已更新
- [ ] `src/renderer/pages/Welcome.tsx` 中的 `MODELS` 已更新
- [ ] `src/renderer/pages/Settings.tsx` 中的 `MODELS` 已更新
- [ ] `src/renderer/services/ai.ts` 中的 `MODEL_CONFIG.model` 已更新
- [ ] `src/renderer/hooks/useSettings.ts` 中的 `DEFAULT_SETTINGS.model` 已更新
- [ ] 所有文件中同 provider 的模型数量一致
- [ ] 所有文件中的默认模型一致

## 违规处理

当发现模型列表不一致时：
1. **立即停止**当前任务
2. **回滚**所有未同步的更改
3. **强制同步**所有相关文件
4. **重新验证**后再继续

## 验证脚本

运行以下命令进行自动化检查：

```bash
bash scripts/verify_arch.sh
```

该脚本应包含对模型列表一致性的检查。

## 相关事故

- INC-2026-0503-001：模型列表更新遗漏共享常量和 AI 服务配置
