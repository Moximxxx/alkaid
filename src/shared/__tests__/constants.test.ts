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
