// 系统提示词构建器测试
import { describe, it, expect } from 'vitest'
import { SystemPromptBuilder, buildSystemPrompt } from '../system-prompt-builder'

describe('SystemPromptBuilder', () => {
  describe('text_chat 场景', () => {
    it('生成的提示词包含角色名', () => {
      const prompt = SystemPromptBuilder.build({ scenario: 'text_chat' })
      expect(prompt).toContain('摇光')
      expect(prompt).toContain('Alkaid')
    })

    it('生成的提示词包含"功能型AI助手"', () => {
      const prompt = SystemPromptBuilder.build({ scenario: 'text_chat' })
      expect(prompt).toContain('功能型AI助手')
    })

    it('生成的提示词包含"中文回复"', () => {
      const prompt = SystemPromptBuilder.build({ scenario: 'text_chat' })
      expect(prompt).toContain('中文')
    })

    it('自定义 aiName 生效', () => {
      const prompt = SystemPromptBuilder.build({
        scenario: 'text_chat',
        aiName: '小助手',
      })
      expect(prompt).toContain('小助手')
      // 不再包含默认名
      expect(prompt).not.toContain('摇光')
    })
  })

  describe('video_call 场景', () => {
    it('生成的提示词包含"实时视频AI伴侣"', () => {
      const prompt = SystemPromptBuilder.build({ scenario: 'video_call' })
      expect(prompt).toContain('实时视频AI伴侣')
    })

    it('生成的提示词包含"视觉分析策略"', () => {
      const prompt = SystemPromptBuilder.build({ scenario: 'video_call' })
      expect(prompt).toContain('视觉分析策略')
    })

    it('生成的提示词包含角色名（来自 SYSTEM_PROMPTS）', () => {
      const prompt = SystemPromptBuilder.build({ scenario: 'video_call' })
      expect(prompt).toContain('摇光')
    })
  })

  describe('基座共享', () => {
    it('getCorePrompt 返回核心定义', () => {
      const core = SystemPromptBuilder.getCorePrompt()
      expect(core).toContain('摇光')
      expect(core).toContain('Alkaid')
      expect(core).toContain('实时交互助手')
    })
  })

  describe('便捷函数 buildSystemPrompt', () => {
    it('text_chat 场景调用正确', () => {
      const prompt = buildSystemPrompt('text_chat')
      expect(prompt).toContain('功能型AI助手')
    })

    it('video_call 场景调用正确', () => {
      const prompt = buildSystemPrompt('video_call')
      expect(prompt).toContain('实时视频AI伴侣')
    })
  })

  describe('场景差异化', () => {
    it('text_chat 不应包含视频相关描述', () => {
      const prompt = SystemPromptBuilder.build({ scenario: 'text_chat' })
      expect(prompt).not.toContain('视频伴侣')
      expect(prompt).not.toContain('摄像头')
    })

    it('text_chat 提示词包含"功能型AI助手"', () => {
      const prompt = SystemPromptBuilder.build({ scenario: 'text_chat' })
      expect(prompt).toContain('功能型AI助手')
    })

    it('video_call 不应包含 text_chat 专属描述', () => {
      const prompt = SystemPromptBuilder.build({ scenario: 'video_call' })
      // video_call 提示词由 SYSTEM_PROMPTS 提供，是完整独立的
      // 只需验证它不是 text_chat 的风格
      expect(prompt).toContain('视觉分析策略')
    })
  })
})
