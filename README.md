# 摇光 - 摄像头AI对话助手

[English](./README_EN.md) | 中文

## 简介

摇光是一个基于 Electrobun 的 Windows 桌面应用，集成了摄像头实时视频流、图像识别和 AI 对话功能。

## 功能特性

- 📹 **实时视频流** - 使用浏览器原生 MediaDevices API 获取摄像头画面
- 🔍 **图像识别** - 支持 Azure Computer Vision 和 Google Cloud Vision
- 🤖 **AI 对话** - 支持 OpenAI 和 Claude 多种大模型
- 📸 **拍照识别** - 支持手动拍照进行场景分析
- 💬 **智能对话** - 基于识别结果与 AI 进行自然语言对话

## 技术栈

- **框架**: Electrobun (首选) / Electron (备选)
- **语言**: TypeScript
- **UI**: React + TailwindCSS
- **构建**: Vite
- **包管理**: Bun

## 项目结构

```
camera-ai-assistant/
├── src/
│   ├── main/                    # 主进程
│   │   ├── services/
│   │   │   ├── camera.ts       # 摄像头服务
│   │   │   ├── vision.ts       # 图像识别服务
│   │   │   └── ai.ts           # AI对话服务
│   │   ├── config.ts           # 配置管理
│   │   └── index.ts            # 主入口
│   ├── renderer/               # 渲染进程
│   │   ├── components/
│   │   │   ├── VideoStream.tsx # 视频流组件
│   │   │   ├── Recognition.tsx # 识别结果
│   │   │   └── Chat.tsx        # 对话界面
│   │   ├── hooks/
│   │   │   ├── useCamera.ts    # 摄像头Hook
│   │   │   └── useAI.ts        # AI对话Hook
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── shared/                 # 共享类型
│       ├── types.ts
│       └── constants.ts
├── package.json
├── tsconfig.json
└── README.md
```

## 快速开始

### 安装依赖

```bash
bun install
```

### 配置

在应用设置中配置以下信息：

1. **图像识别服务**
   - 选择 Azure 或 Google Cloud
   - 填入 API Key 和 Endpoint

2. **AI 对话服务**
   - 选择 OpenAI 或 Claude
   - 填入 API Key

### 运行开发环境

```bash
bun run dev
```

### 构建应用

```bash
bun run build
```

## 使用说明

1. 启动应用后，摄像头会自动开启
2. 点击"拍照"按钮捕获当前画面
3. 系统会自动识别画面中的物体、人脸和场景
4. 点击"询问AI关于这个场景"按钮，AI 会基于识别结果进行对话
5. 也可以在对话框中直接输入问题

## 配置说明

### Azure Computer Vision

- Endpoint: `https://<your-resource>.cognitiveservices.azure.com`
- API Key: 在 Azure 门户中获取

### Google Cloud Vision

- Endpoint: `https://vision.googleapis.com/v1`
- API Key: 在 Google Cloud Console 中获取

### OpenAI

- API Key: 在 OpenAI 官网获取
- 支持模型: GPT-4 Vision, GPT-4o, GPT-4o Mini

### Claude

- API Key: 在 Anthropic 官网获取
- 支持模型: Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku

## 开发计划

- [ ] 支持多摄像头切换
- [ ] 添加本地模型支持
- [ ] 支持视频录制
- [ ] 添加快捷键支持
- [ ] 支持导出识别结果

## 许可证

MIT License
