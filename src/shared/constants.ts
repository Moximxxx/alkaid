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
  openai: [
    { id: 'gpt-4-vision-preview', name: 'GPT-4 Vision' },
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  ],
  claude: [
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
  ],
  doubao: [
    { id: 'doubao-1.5-vision-pro-32k', name: '豆包 Vision Pro 32K' },
    { id: 'doubao-seed-2.0', name: '豆包 Seed 2.0 (视频理解)' },
    { id: 'doubao-1.5-pro-32k', name: '豆包 Pro 32K (文本)' },
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
