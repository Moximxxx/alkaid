# 摇光 - 摄像头AI对话助手

[English](./README_EN.md) | 中文

## 简介

摇光是一个基于 Electron 的 Windows 桌面应用，集成了摄像头实时视频流、图像识别和 AI 对话功能。支持多种 AI 模型，包括 OpenAI、Claude 和豆包，可实现实时场景识别和智能对话。

## 功能特性

- 📹 **实时视频流** - 使用浏览器原生 MediaDevices API 获取摄像头画面
- 🔍 **图像识别** - 支持 Azure Computer Vision 和 Google Cloud Vision
- 🤖 **多模型 AI 对话** - 支持 OpenAI、Claude 和豆包大模型
- 📸 **拍照识别** - 支持手动拍照进行场景分析
- 💬 **智能对话** - 基于识别结果与 AI 进行自然语言对话
- 🎥 **视频通话模式** - 实时分析摄像头画面，AI 自动识别并回答问题
- 🧪 **单元测试** - 完整的测试覆盖，确保代码质量

## 技术栈

- **框架**: Electron
- **语言**: TypeScript
- **UI**: React + TailwindCSS
- **构建**: Vite
- **测试**: Vitest
- **包管理**: npm / Bun

## 项目结构

```
alkaid/
├── src/
│   ├── main/                         # 主进程
│   │   ├── services/
│   │   │   ├── camera.ts            # 摄像头服务
│   │   │   ├── vision.ts            # 图像识别服务
│   │   │   ├── ai.ts                # AI对话服务
│   │   │   └── __tests__/           # 服务测试
│   │   ├── config.ts                # 配置管理
│   │   ├── index.ts                 # Web入口
│   │   └── electron.ts            # Electron桌面入口
│   ├── renderer/                     # 渲染进程
│   │   ├── components/
│   │   │   ├── VideoStream.tsx      # 视频流组件
│   │   │   ├── Recognition.tsx      # 识别结果
│   │   │   ├── Chat.tsx             # 对话界面
│   │   │   └── VideoChat.tsx        # 视频通话组件
│   │   ├── hooks/
│   │   │   ├── useCamera.ts         # 摄像头Hook
│   │   │   ├── useAI.ts             # AI对话Hook
│   │   │   └── useVideoChat.ts      # 视频通话Hook
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── shared/                       # 共享类型
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── __tests__/               # 常量测试
│   └── test/                         # 测试配置
│       └── setup.ts
├── vitest.config.ts                  # 测试配置
├── package.json
├── tsconfig.json
└── README.md
```

## 快速开始

### 安装依赖

```bash
# 使用 npm (推荐，Windows 兼容性更好)
npm install

# 或使用 bun
bun install
```

### 配置

在应用设置中配置以下信息：

1. **图像识别服务**
   - 选择 Azure 或 Google Cloud
   - 填入 API Key 和 Endpoint

2. **AI 对话服务**
   - 选择 OpenAI、Claude 或豆包
   - 填入 API Key

### 运行开发环境

```bash
# Web 模式
npm run dev

# Electron 桌面模式
npm run dev:electron
```

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 构建应用

```bash
npm run build
```

## 使用说明

### 普通模式

1. 启动应用后，摄像头会自动开启
2. 点击"拍照"按钮捕获当前画面
3. 系统会自动识别画面中的物体、人脸和场景
4. 点击"询问AI关于这个场景"按钮，AI 会基于识别结果进行对话
5. 也可以在对话框中直接输入问题

### 视频通话模式

1. 点击右上角"进入视频通话"按钮
2. 摄像头开启后，AI 会每3秒自动分析画面
3. 在对话框输入问题，AI 会结合画面内容回答
4. 点击"手动分析"可立即分析当前画面

## AI 模型支持

### OpenAI

- GPT-4 Vision
- GPT-4o
- GPT-4o Mini

### Claude

- Claude 3 Opus
- Claude 3 Sonnet
- Claude 3 Haiku

### 豆包 (字节跳动)

- **doubao-1.5-vision-pro-32k** - 图片理解
- **doubao-seed-2.0** - 视频理解（实时视频流分析）
- **doubao-1.5-pro-32k** - 纯文本对话

**豆包 API 配置**：
- 端点: `https://ark.cn-beijing.volces.com/api/v3`
- API Key: 在 [火山引擎控制台](https://console.volcengine.com/ark) 获取

## 配置说明

### Azure Computer Vision

- Endpoint: `https://<your-resource>.cognitiveservices.azure.com`
- API Key: 在 Azure 门户中获取

### Google Cloud Vision

- Endpoint: `https://vision.googleapis.com/v1`
- API Key: 在 Google Cloud Console 中获取

## 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Web 开发服务器 |
| `npm run dev:electron` | 启动 Electron 桌面应用 |
| `npm test` | 运行单元测试 |
| `npm run test:watch` | 监听模式运行测试 |
| `npm run test:coverage` | 生成测试覆盖率报告 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run build` | 构建项目 |

## 开发计划

- [x] 支持多摄像头切换
- [x] 添加豆包大模型支持
- [x] 实现视频通话模式
- [x] 添加单元测试
- [ ] 支持视频录制
- [ ] 添加快捷键支持
- [ ] 支持导出识别结果
- [ ] 添加本地模型支持

## 许可证

MIT License
