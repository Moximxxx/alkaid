// 常量测试
import { describe, it, expect } from 'vitest'
import {
  APP_NAME,
  APP_VERSION,
  DEFAULT_CAMERA_CONFIG,
  DEFAULT_AI_CONFIG,
  AI_MODELS,
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
      model: 'gpt-4-vision-preview',
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
})
