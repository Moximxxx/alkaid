// 应用常量
export const APP_NAME = '摇光'
export const APP_VERSION = '0.1.0'
export const APP_DESCRIPTION = '摄像头AI对话助手'

// 默认配置
export const DEFAULT_CAMERA_CONFIG = {
  width: 1280,
  height: 720,
  fps: 30,
}

export const DEFAULT_VISION_CONFIG = {
  provider: 'azure' as const,
  apiKey: '',
  endpoint: '',
}

export const DEFAULT_AI_CONFIG = {
  provider: 'openai' as const,
  apiKey: '',
  model: 'gpt-4-vision-preview',
}

export const DEFAULT_APP_CONFIG = {
  camera: DEFAULT_CAMERA_CONFIG,
  vision: DEFAULT_VISION_CONFIG,
  ai: DEFAULT_AI_CONFIG,
  language: 'zh-CN',
  autoRecognize: false,
  recognizeInterval: 5000,
}

// AI模型列表
export const AI_MODELS = {
  doubao: [
    { value: "doubao-seed-1.6-thinking", label: "豆包 Seed 1.6 深度思考" },
    { value: "doubao-seed-1.6-flash", label: "豆包 Seed 1.6 极速版" },
    { value: "doubao-1.6-thinking", label: "豆包 1.6 深度思考" },
    { value: "doubao-1.6-flash", label: "豆包 1.6 极速版" },
    { value: "doubao-1.5-thinking-vision-pro", label: "豆包 1.5 视觉思考" },
  ],
  openai: [
    { value: "gpt-4.1", label: "GPT-4.1" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    { value: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
    { value: "gpt-4.5", label: "GPT-4.5" },
    { value: "gpt-5", label: "GPT-5" },
  ],
  claude: [
    { value: "claude-opus-4-20250514", label: "Claude Opus 4" },
    { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    { value: "claude-3-7-sonnet-20250224", label: "Claude 3.7 Sonnet" },
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
  ],
}

// 图像识别服务列表
export const VISION_SERVICES = {
  azure: {
    name: 'Azure Computer Vision',
    endpoint: 'https://<your-resource>.cognitiveservices.azure.com',
  },
  google: {
    name: 'Google Cloud Vision',
    endpoint: 'https://vision.googleapis.com/v1',
  },
}
