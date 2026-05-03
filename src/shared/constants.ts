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
  provider: 'doubao' as const,
  apiKey: '',
  model: 'doubao-1.5-thinking-vision-pro',
}

export const DEFAULT_AI_CONFIG = {
  provider: 'openai' as const,
  apiKey: '',
  model: 'gpt-4.1',
  baseUrl: '',
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
  glm: [
    { value: "glm-4.5", label: "GLM-4.5" },
    { value: "glm-4-plus", label: "GLM-4-Plus" },
    { value: "glm-z1-32b", label: "GLM-Z1-32B" },
    { value: "glm-4v-plus", label: "GLM-4V-Plus" },
  ],
  minimax: [
    { value: "minimax-m2.1", label: "MiniMax-M2.1" },
    { value: "minimax-text-01", label: "MiniMax-Text-01" },
  ],
  xiaomi: [
    { value: "mimo-v2-pro", label: "MiMo-V2-Pro" },
    { value: "mimo-v2-flash", label: "MiMo-V2-Flash" },
  ],
  kimi: [
    { value: "kimi-k2", label: "Kimi K2" },
    { value: "kimi-k2-thinking", label: "Kimi K2 Thinking" },
    { value: "kimi-1.5", label: "Kimi k1.5" },
  ],
  deepseek: [
    { value: "deepseek-v3-0324", label: "DeepSeek V3-0324" },
    { value: "deepseek-r1", label: "DeepSeek R1" },
  ],
}

// AI服务提供商列表
export const AI_PROVIDERS = [
  { value: "doubao", label: "豆包", type: "vision" },
  { value: "openai", label: "OpenAI", type: "text" },
  { value: "glm", label: "GLM", type: "text" },
  { value: "minimax", label: "MiniMax", type: "text" },
  { value: "xiaomi", label: "Xiaomi MiMo", type: "text" },
  { value: "kimi", label: "Kimi", type: "text" },
  { value: "deepseek", label: "DeepSeek", type: "text" },
  { value: "claude", label: "Claude", type: "text" },
]

// 视觉模型列表
export const VISION_MODELS = [
  { value: "doubao-1.5-thinking-vision-pro", label: "豆包 1.5 视觉思考" },
  { value: "doubao-1.6-vision", label: "豆包 1.6 视觉" },
]

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
