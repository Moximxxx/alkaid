// 摄像头配置
export interface CameraConfig {
  width: number
  height: number
  fps: number
  deviceId?: string
}

// 图像识别结果
export interface RecognitionResult {
  objects: DetectedObject[]
  faces: DetectedFace[]
  scene: SceneDescription
  timestamp: number
}

// 检测到的物体
export interface DetectedObject {
  name: string
  confidence: number
  boundingBox: BoundingBox
}

// 检测到的人脸
export interface DetectedFace {
  age?: number
  gender?: string
  emotion?: string
  boundingBox: BoundingBox
}

// 场景描述
export interface SceneDescription {
  tags: string[]
  description: string
  confidence: number
}

// 边界框
export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

// AI对话消息
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  image?: string  // base64 编码的图片
}

// AI模型配置
export interface AIModelConfig {
  provider: 'doubao' | 'openai' | 'glm' | 'minimax' | 'xiaomi' | 'kimi' | 'deepseek' | 'claude'
  apiKey: string
  model: string
  baseUrl?: string
}

// 图像识别服务配置
export interface VisionConfig {
  provider: 'doubao_vision'
  apiKey: string
  model: string
}

// 应用配置
export interface AppConfig {
  camera: CameraConfig
  vision: VisionConfig
  ai: AIModelConfig
  language: string
  autoRecognize: boolean
  recognizeInterval: number  // 自动识别间隔（毫秒）
}
