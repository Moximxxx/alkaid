// 常量测试
import { describe, it, expect } from 'vitest'
import {
  APP_NAME,
  APP_VERSION,
  DEFAULT_CAMERA_CONFIG,
  DEFAULT_AI_CONFIG,
  AI_MODELS,
  VISION_MODELS,
  AI_PROVIDERS,
  VIDEO_CALL_DEFAULTS,
  SYSTEM_PROMPTS,
  PIPELINE_DEFAULTS,
} from '../constants'

describe('应用常量', () => {
  it('APP_NAME 应该是摇光', () => {
    expect(APP_NAME).toBe('摇光')
  })

  it('APP_VERSION 应该是 0.1.0', () => {
    expect(APP_VERSION).toBe('0.1.0')
  })
})

describe('默认配置', () => {
  it('摄像头默认配置应该正确', () => {
    expect(DEFAULT_CAMERA_CONFIG).toEqual({
      width: 1280,
      height: 720,
      fps: 30,
    })
  })

  it('AI 默认配置应该正确', () => {
    expect(DEFAULT_AI_CONFIG).toEqual({
      provider: 'openai',
      apiKey: '',
      model: 'gpt-5.4',
      baseUrl: '',
    })
  })
})

describe('AI 模型列表', () => {
  it('应该包含 OpenAI 模型', () => {
    expect(AI_MODELS.openai).toBeDefined()
    expect(AI_MODELS.openai.length).toBeGreaterThan(0)
  })

  it('应该包含 Claude 模型', () => {
    expect(AI_MODELS.claude).toBeDefined()
    expect(AI_MODELS.claude.length).toBeGreaterThan(0)
  })

  it('应该包含豆包视觉模型', () => {
    expect(AI_MODELS.doubao_vision).toBeDefined()
    expect(AI_MODELS.doubao_vision.length).toBeGreaterThan(0)
  })

  it('应该包含豆包文本模型', () => {
    expect(AI_MODELS.doubao_text).toBeDefined()
    expect(AI_MODELS.doubao_text.length).toBeGreaterThan(0)
  })

  it('应该包含 Google 模型', () => {
    expect(AI_MODELS.google).toBeDefined()
    expect(AI_MODELS.google.length).toBeGreaterThan(0)
    expect(AI_MODELS.google.find(m => m.value === 'gemini-2.5-pro')).toBeDefined()
    expect(AI_MODELS.google.find(m => m.value === 'gemini-2.5-flash')).toBeDefined()
  })

  it('应该包含 GPT-5.4 模型', () => {
    expect(AI_MODELS.openai.find(m => m.value === 'gpt-5.4')).toBeDefined()
  })

  it('应该不包含已废弃的 GPT-4.5', () => {
    expect(AI_MODELS.openai.find(m => m.value === 'gpt-4.5')).toBeUndefined()
  })

  it('应该包含 Claude Opus 4.7 模型', () => {
    expect(AI_MODELS.claude.find(m => m.value === 'claude-opus-4.7')).toBeDefined()
  })

  it('应该包含 Claude Haiku 4.5 模型', () => {
    expect(AI_MODELS.claude.find(m => m.value === 'claude-haiku-4.5')).toBeDefined()
  })

  it('应该包含 MiniMax-M1 模型', () => {
    expect(AI_MODELS.minimax.find(m => m.value === 'minimax-m1')).toBeDefined()
  })
})

describe('AI 服务提供商列表', () => {
  it('应该包含 google 提供商', () => {
    expect(AI_PROVIDERS.find(p => p.value === 'google')).toBeDefined()
  })

  it('应该包含 google_vision 提供商', () => {
    expect(AI_PROVIDERS.find(p => p.value === 'google_vision')).toBeDefined()
  })
})

describe('视觉模型列表', () => {
  it('应该包含视觉模型', () => {
    expect(VISION_MODELS.length).toBeGreaterThan(0)
  })

  it('应该包含 GPT-4.1 Vision', () => {
    expect(VISION_MODELS.find(m => m.value === 'gpt-4.1-vision')).toBeDefined()
  })

  it('应该包含 Claude Sonnet 4.6 Vision', () => {
    expect(VISION_MODELS.find(m => m.value === 'claude-sonnet-4.6-vision')).toBeDefined()
  })

  it('应该包含 Gemini 2.5 Pro Vision', () => {
    expect(VISION_MODELS.find(m => m.value === 'gemini-2.5-pro-vision')).toBeDefined()
  })
})

describe('视频通话常量 VIDEO_CALL_DEFAULTS', () => {
  it('aiName 应该是摇光', () => {
    expect(VIDEO_CALL_DEFAULTS.aiName).toBe('摇光')
  })

  it('aiStatusText 包含四种状态', () => {
    expect(VIDEO_CALL_DEFAULTS.aiStatusText).toEqual({
      listening: '聆听中...',
      thinking: '思考中...',
      speaking: '说话中...',
      idle: '待命中',
    })
  })
})

describe('系统提示词 SYSTEM_PROMPTS', () => {
  it('text_chat 提示词包含"功能型AI助手"', () => {
    expect(SYSTEM_PROMPTS.text_chat).toContain('功能型AI助手')
  })

  it('text_chat 提示词包含"摇光"', () => {
    expect(SYSTEM_PROMPTS.text_chat).toContain('摇光')
  })

  it('text_chat 提示词包含"中文回复"', () => {
    expect(SYSTEM_PROMPTS.text_chat).toContain('中文回复')
  })

  it('video_call 提示词包含"实时视频AI伴侣"', () => {
    expect(SYSTEM_PROMPTS.video_call).toContain('实时视频AI伴侣')
  })

  it('video_call 提示词包含"视觉分析策略"', () => {
    expect(SYSTEM_PROMPTS.video_call).toContain('视觉分析策略')
  })

  it('video_call 提示词包含"摇光"', () => {
    expect(SYSTEM_PROMPTS.video_call).toContain('摇光')
  })

  it('video_call 提示词包含对话规则', () => {
    expect(SYSTEM_PROMPTS.video_call).toContain('对话规则')
  })

  it('两个场景提示词不同', () => {
    expect(SYSTEM_PROMPTS.text_chat).not.toBe(SYSTEM_PROMPTS.video_call)
  })
})

describe('管线默认配置 PIPELINE_DEFAULTS', () => {
  it('maxContextTokens 应该是 8000', () => {
    expect(PIPELINE_DEFAULTS.maxContextTokens).toBe(8000)
  })

  it('visionCaptureInterval 应该是 3000', () => {
    expect(PIPELINE_DEFAULTS.visionCaptureInterval).toBe(3000)
  })

  it('vadThreshold 应该是 0.3', () => {
    expect(PIPELINE_DEFAULTS.vadThreshold).toBe(0.3)
  })

  it('frameMaxWidth 应该是 320', () => {
    expect(PIPELINE_DEFAULTS.frameMaxWidth).toBe(320)
  })

  it('frameMaxHeight 应该是 240', () => {
    expect(PIPELINE_DEFAULTS.frameMaxHeight).toBe(240)
  })

  it('vadSilenceTimeoutMs 应该是 500', () => {
    expect(PIPELINE_DEFAULTS.vadSilenceTimeoutMs).toBe(500)
  })

  it('frameDedupThreshold 应该是 0.05', () => {
    expect(PIPELINE_DEFAULTS.frameDedupThreshold).toBe(0.05)
  })
})
