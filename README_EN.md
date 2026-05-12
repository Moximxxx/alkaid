# Alkaid - Camera AI Conversation Assistant

[English](./README_EN.md) | [中文](./README.md)

## Introduction

Alkaid is an Electron-based Windows desktop application that integrates real-time camera video streaming, image recognition, and AI conversation capabilities. It supports multiple AI models including OpenAI, Claude, and Doubao, enabling real-time scene recognition and intelligent dialogue.

## Features

- 📹 **Real-time Video Streaming** - Capture camera feed using the browser-native MediaDevices API
- 🔍 **Image Recognition** - Supports Azure Computer Vision and Google Cloud Vision
- 🤖 **Multi-model AI Conversations** - Supports OpenAI, Claude, and Doubao LLMs
- 📸 **Photo Recognition** - Manual photo capture for scene analysis
- 💬 **Intelligent Conversations** - Natural language dialogue with AI based on recognition results
- 🎥 **Video Call Mode** - Real-time camera analysis with AI auto-recognition and Q&A
- 🧪 **Unit Tests** - Comprehensive test coverage ensuring code quality

## Tech Stack

- **Framework**: Electron
- **Language**: TypeScript
- **UI**: React + TailwindCSS
- **Build**: Vite
- **Testing**: Vitest
- **Package Manager**: npm / Bun

## Project Structure

```
alkaid/
├── src/
│   ├── main/                         # Main process
│   │   ├── services/
│   │   │   ├── camera.ts            # Camera service
│   │   │   ├── vision.ts            # Image recognition service
│   │   │   ├── ai.ts                # AI conversation service
│   │   │   └── __tests__/           # Service tests
│   │   ├── config.ts                # Configuration management
│   │   ├── index.ts                 # Web entry point
│   │   └── electron.ts            # Electron desktop entry
│   ├── renderer/                     # Renderer process
│   │   ├── components/
│   │   │   ├── VideoStream.tsx      # Video stream component
│   │   │   ├── Recognition.tsx      # Recognition results
│   │   │   ├── Chat.tsx             # Chat interface
│   │   │   └── VideoChat.tsx        # Video call component
│   │   ├── hooks/
│   │   │   ├── useCamera.ts         # Camera hook
│   │   │   ├── useAI.ts             # AI conversation hook
│   │   │   └── useVideoChat.ts      # Video call hook
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── shared/                       # Shared types
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── __tests__/               # Constants tests
│   └── test/                         # Test configuration
│       └── setup.ts
├── vitest.config.ts                  # Test configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Quick Start

### Install Dependencies

```bash
# Using npm (recommended for better Windows compatibility)
npm install

# Or using bun
bun install
```

### Configuration

Configure the following in the application settings:

1. **Image Recognition Service**
   - Choose Azure or Google Cloud
   - Enter API Key and Endpoint

2. **AI Conversation Service**
   - Choose OpenAI, Claude, or Doubao
   - Enter API Key

### Run Development Environment

```bash
# Web mode
npm run dev

# Electron desktop mode
npm run dev:electron
```

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Build Application

```bash
npm run build
```

## Usage

### Normal Mode

1. After launching the app, the camera will start automatically
2. Click the "Capture" button to capture the current frame
3. The system will automatically recognize objects, faces, and scenes
4. Click the "Ask AI about this scene" button for AI dialogue based on recognition results
5. You can also type questions directly in the chat input

### Video Call Mode

1. Click the "Enter Video Call" button in the top-right corner
2. Once the camera starts, AI will analyze the scene every 3 seconds
3. Type questions in the chat input, and AI will respond with context from the video feed
4. Click "Manual Analysis" to analyze the current frame immediately

## AI Model Support

### OpenAI

- GPT-4 Vision
- GPT-4o
- GPT-4o Mini

### Claude

- Claude 3 Opus
- Claude 3 Sonnet
- Claude 3 Haiku

### Doubao (ByteDance)

- **doubao-1.5-vision-pro-32k** - Image understanding
- **doubao-seed-2.0** - Video understanding (real-time video stream analysis)
- **doubao-1.5-pro-32k** - Text-only conversation

**Doubao API Configuration**:
- Endpoint: `https://ark.cn-beijing.volces.com/api/v3`
- API Key: Obtain from [Volcengine Console](https://console.volcengine.com/ark)

## Configuration Guide

### Azure Computer Vision

- Endpoint: `https://<your-resource>.cognitiveservices.azure.com`
- API Key: Obtain from the Azure Portal

### Google Cloud Vision

- Endpoint: `https://vision.googleapis.com/v1`
- API Key: Obtain from the Google Cloud Console

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Web development server |
| `npm run dev:electron` | Start Electron desktop app |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage report |
| `npm run typecheck` | TypeScript type checking |
| `npm run build` | Build the project |

## Roadmap

- [x] Multi-camera switching support
- [x] Doubao LLM support
- [x] Video call mode
- [x] Unit tests
- [ ] Video recording support
- [ ] Keyboard shortcut support
- [ ] Export recognition results
- [ ] Local model support

## License

MIT License
