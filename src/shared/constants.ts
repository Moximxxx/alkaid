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
  provider: 'doubao_vision' as const,
  apiKey: '',
  model: 'doubao-2.0-vision-pro',
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
  doubao_vision: [
    { value: "doubao-2.0-vision-pro", label: "豆包 2.0 视觉专业版" },
    { value: "doubao-1.5-thinking-vision-pro", label: "豆包 1.5 视觉思考" },
  ],
  doubao_text: [
    { value: "doubao-seed-2.0-pro", label: "Doubao-Seed-2.0-Pro（国内综合第一）" },
    { value: "doubao-2.0-pro", label: "Doubao-2.0-Pro" },
    { value: "doubao-2.0-lite", label: "Doubao-2.0-Lite" },
  ],
  openai: [
    { value: "gpt-5", label: "GPT-5" },
    { value: "gpt-4.5", label: "GPT-4.5" },
    { value: "gpt-4.1", label: "GPT-4.1" },
  ],
  claude: [
    { value: "claude-opus-4.6", label: "Claude Opus 4.6" },
    { value: "claude-sonnet-4.6", label: "Claude Sonnet 4.6" },
    { value: "claude-mythos", label: "Claude Mythos" },
  ],
  glm: [
    { value: "glm-5.1", label: "GLM-5.1（8小时长程任务）" },
    { value: "glm-5-turbo", label: "GLM-5-Turbo（7440亿参数）" },
    { value: "glm-4.6v-flash", label: "GLM-4.6V-Flash（视觉）" },
  ],
  minimax: [
    { value: "minimax-m2.7", label: "MiniMax-M2.7（Agent自我进化）" },
    { value: "minimax-m2.5", label: "MiniMax-M2.5" },
    { value: "minimax-music-2.5-plus", label: "MiniMax-Music-2.5+（音乐）" },
  ],
  xiaomi: [
    { value: "mimo-v2.5-pro", label: "MiMo-V2.5-Pro（100万上下文）" },
    { value: "mimo-v2.5", label: "MiMo-V2.5（全模态）" },
    { value: "mimo-v2-pro", label: "MiMo-V2-Pro（旗舰）" },
    { value: "mimo-v2-flash", label: "MiMo-V2-Flash（轻量）" },
  ],
  kimi: [
    { value: "kimi-k2.6", label: "Kimi-K2.6（代码对标GPT-5.4）" },
    { value: "kimi-k2.5", label: "Kimi-K2.5（多模态旗舰）" },
    { value: "kimi-k2.1", label: "Kimi-K2.1" },
  ],
  deepseek: [
    { value: "deepseek-v4-pro", label: "DeepSeek-V4-Pro（1.6T参数）" },
    { value: "deepseek-r1-0528", label: "DeepSeek-R1-0528（推理升级）" },
    { value: "deepseek-v3.1", label: "DeepSeek-V3.1（思考模式切换）" },
  ],
}

// AI服务提供商列表
export const AI_PROVIDERS = [
  { value: "doubao_vision", label: "豆包视觉", type: "vision" },
  { value: "doubao", label: "豆包", type: "text" },
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
  { value: "doubao-2.0-vision-pro", label: "豆包 2.0 视觉专业版" },
  { value: "doubao-1.5-thinking-vision-pro", label: "豆包 1.5 视觉思考" },
]

// System Prompt
export const SYSTEM_PROMPT = '你是一个能够理解和分析图像的AI助手。请用中文回复。'

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
