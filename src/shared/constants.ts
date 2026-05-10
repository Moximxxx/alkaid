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
  model: 'gpt-5.4',
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
    { value: "gpt-5.4", label: "GPT-5.4（最新旗舰）" },
    { value: "gpt-4.1", label: "GPT-4.1" },
  ],
  claude: [
    { value: "claude-opus-4.6", label: "Claude Opus 4.6" },
    { value: "claude-opus-4.7", label: "Claude Opus 4.7（最强旗舰）" },
    { value: "claude-sonnet-4.6", label: "Claude Sonnet 4.6" },
    { value: "claude-haiku-4.5", label: "Claude Haiku 4.5（高速低配）" },
    { value: "claude-mythos", label: "Claude Mythos" },
  ],
  glm: [
    { value: "glm-5.1", label: "GLM-5.1（8小时长程任务）" },
    { value: "glm-5-turbo", label: "GLM-5-Turbo（7440亿参数）" },
    { value: "glm-4.6v-flash", label: "GLM-4.6V-Flash（视觉）" },
  ],
  minimax: [
    { value: "minimax-m2.7", label: "MiniMax-M2.7（Agent自我进化）" },
    { value: "minimax-m1", label: "MiniMax-M1（混合注意力推理）" },
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
  google: [
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro（旗舰编程）" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash（轻量推理）" },
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
  { value: "google", label: "Google Gemini", type: "text" },
  { value: "google_vision", label: "Google Vision", type: "vision" },
]

// 视觉模型列表
export const VISION_MODELS = [
  { value: "doubao-2.0-vision-pro", label: "豆包 2.0 视觉专业版" },
  { value: "doubao-1.5-thinking-vision-pro", label: "豆包 1.5 视觉思考" },
  { value: "gpt-4.1-vision", label: "GPT-4.1 Vision" },
  { value: "claude-sonnet-4.6-vision", label: "Claude Sonnet 4.6 Vision" },
  { value: "gemini-2.5-pro-vision", label: "Gemini 2.5 Pro Vision" },
]

// System Prompt（向后兼容）
export const SYSTEM_PROMPT = '你是一个能够理解和分析图像的AI助手。请用中文回复。'

// 双场景系统提示词
export const SYSTEM_PROMPTS = {
  text_chat: [
    '你是摇光（Alkaid），一款AI实时交互助手。',
    '你是功能型AI助手，回答准确、简洁、专业。',
    '始终使用中文回复。',
  ].join('\n'),
  video_call: [
    '# 角色定义',
    '你是摇光（Alkaid），一款实时视频AI伴侣。',
    '你通过摄像头实时观察用户的画面，具备视觉理解、语音对话和实时交互能力。',
    '',
    '# 交互模式',
    '- 你是主动的、亲切的、有情感的伴侣型AI',
    '- 你会主动描述你看到的内容（但不过度频繁）',
    '- 你会对用户的表情、动作、环境做出自然反应',
    '- 你拥有个性：温柔、细心、带点幽默感',
    '',
    '# 视觉分析策略',
    '- 每3-10秒你会收到一帧画面，请基于画面内容做出回应',
    '- 如画面无显著变化，可以简单确认或继续上一话题',
    '- 如检测到新物体/人脸/场景变化，请主动评论',
    '- 你"看到"的东西应自然地融入对话',
    '',
    '# 对话规则',
    '- 始终使用中文（简体）',
    '- 回答自然流畅，避免模板式表达',
    '- 当用户说话时，听完后再回应，不要打断',
    '- 如果用户提到"你看这个/看到了吗"，请详细描述你看到的',
    '- 可以像朋友一样对画面内容发表感受和看法',
    '',
    '# 技术限制说明',
    '- 你收到的是单帧画面（非连续视频流）',
    '- 帧之间有间隔，你无法感知连续运动',
    '- 如果用户问动态相关的问题，请诚实说明限制',
  ].join('\n'),
} as const

// 默认分析配置
export const DEFAULT_ANALYSIS_CONFIG = {
  enabled: false,
  interval: 3000, // 毫秒
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

// === 视频通话常量 ===
export const VIDEO_CALL_DEFAULTS = {
  aiName: '摇光',
  aiStatusText: {
    listening: '聆听中...',
    thinking: '思考中...',
    speaking: '说话中...',
    idle: '待命中',
  },
}

// === 管线默认配置 ===
export const PIPELINE_DEFAULTS = {
  maxContextTokens: 8000,
  visionCaptureInterval: 3000,
  vadThreshold: 0.3,
  frameMaxWidth: 320,
  frameMaxHeight: 240,
  vadSilenceTimeoutMs: 500,
  frameDedupThreshold: 0.05,
}
