// SystemPromptBuilder 测试
import { describe, it, expect } from 'vitest'
import { SystemPromptBuilder } from '../system-prompt-builder'

describe('SystemPromptBuilder', () => {
  describe('build (text_chat)', () => {
    it('builds text_chat prompt with default name', () => {
      const prompt = SystemPromptBuilder.build({ scenario: 'text_chat' })
      expect(prompt).toContain('摇光')
      expect(prompt).toContain('Alkaid')
      expect(prompt).toContain('功能型AI助手')
    })

    it('builds text_chat prompt with custom aiName', () => {
      const prompt = SystemPromptBuilder.build({
        scenario: 'text_chat',
        aiName: '小明',
      })
      expect(prompt).toContain('小明')
      expect(prompt).toContain('Alkaid')
      expect(prompt).not.toContain('摇光')
    })
  })

  describe('build (video_call)', () => {
    it('builds video_call prompt with aiName injection', () => {
      const prompt = SystemPromptBuilder.build({
        scenario: 'video_call',
        aiName: '小助手',
      })
      expect(prompt).toContain('小助手')
      expect(prompt).toContain('Alkaid')
      expect(prompt).toContain('实时视频AI伴侣')
    })

    it('video_call prompt contains visual analysis strategy', () => {
      const prompt = SystemPromptBuilder.build({ scenario: 'video_call' })
      expect(prompt).toContain('每3-10秒')
      expect(prompt).toContain('摄像头')
      expect(prompt).toContain('视觉理解')
    })

    it('video_call prompt contains conversation rules', () => {
      const prompt = SystemPromptBuilder.build({ scenario: 'video_call' })
      expect(prompt).toContain('始终使用中文')
      expect(prompt).toContain('温柔')
    })
  })

  describe('getCorePrompt', () => {
    it('getCorePrompt returns system core', () => {
      const core = SystemPromptBuilder.getCorePrompt()
      expect(core).toContain('摇光')
      expect(core).toContain('Alkaid')
      expect(core).toContain('AI实时交互助手')
    })
  })
})
