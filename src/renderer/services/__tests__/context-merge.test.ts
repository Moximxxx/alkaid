// 上下文裁决器测试
import { describe, it, expect } from 'vitest'
import { mergeContext } from '../context-merge'
import type { ChatMessage } from '@shared/types'

function makeMsg(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'test-1',
    role: 'user',
    content: '测试消息',
    timestamp: Date.now(),
    ...overrides,
  }
}

describe('mergeContext', () => {
  describe('文本合并', () => {
    it('userText 和 sttText 合并去重', () => {
      const result = mergeContext({
        userText: '你好',
        sttText: '你好',
        conversationHistory: [],
      })
      expect(result.promptText).toBe('你好 你好')
    })

    it('只有 userText', () => {
      const result = mergeContext({
        userText: '今天天气怎么样',
        conversationHistory: [],
      })
      expect(result.promptText).toBe('今天天气怎么样')
    })

    it('只有 sttText', () => {
      const result = mergeContext({
        sttText: '语音输入内容',
        conversationHistory: [],
      })
      expect(result.promptText).toBe('语音输入内容')
    })

    it('无文本但有帧时返回默认提示', () => {
      const result = mergeContext({
        latestFrame: 'data:image/jpeg;base64,abc',
        conversationHistory: [],
      })
      expect(result.promptText).toBe('请描述你看到的画面。')
    })

    it('无文本无帧返回空字符串', () => {
      const result = mergeContext({ conversationHistory: [] })
      expect(result.promptText).toBe('')
    })
  })

  describe('视觉意图检测', () => {
    it('包含中文关键词"看"时 includedVision = true', () => {
      const result = mergeContext({
        userText: '你看这个是什么',
        latestFrame: 'data:image/jpeg;base64,abc',
        conversationHistory: [],
      })
      expect(result.includedVision).toBe(true)
      expect(result.image).toBeDefined()
    })

    it('包含"画面"关键词时 attached', () => {
      const result = mergeContext({
        userText: '画面里有什么',
        latestFrame: 'data:image/jpeg;base64,abc',
        conversationHistory: [],
      })
      expect(result.includedVision).toBe(true)
    })

    it('包含英文关键词"look"时 attached', () => {
      const result = mergeContext({
        userText: 'look at this',
        latestFrame: 'data:image/jpeg;base64,abc',
        conversationHistory: [],
      })
      expect(result.includedVision).toBe(true)
    })

    it('无视觉关键词且无帧变化时不附带图像', () => {
      const result = mergeContext({
        userText: '你好',
        latestFrame: 'data:image/jpeg;base64,abc',
        previousFrames: ['data:image/jpeg;base64,abc'],
        conversationHistory: [],
      })
      // 帧相同（长度变化率 < 0.05），且无视觉关键词
      expect(result.includedVision).toBe(false)
      expect(result.image).toBeUndefined()
    })

    it('无视觉关键词但帧变化时附带图像', () => {
      const result = mergeContext({
        userText: '你好',
        latestFrame: 'data:image/jpeg;base64,' + 'A'.repeat(500),
        previousFrames: ['data:image/jpeg;base64,' + 'A'.repeat(100)],
        conversationHistory: [],
      })
      // 帧变化率 > 0.05，所以应该附带图像
      expect(result.includedVision).toBe(true)
      expect(result.image).toBeDefined()
    })

    it('无帧时不附带图像', () => {
      const result = mergeContext({
        userText: '你看这个',
        conversationHistory: [],
      })
      expect(result.includedVision).toBe(false)
      expect(result.image).toBeUndefined()
    })
  })

  describe('场景判断', () => {
    it('视觉相关 → scenario = video_call', () => {
      const result = mergeContext({
        userText: '你看到我在做什么',
        latestFrame: 'data:image/jpeg;base64,abc',
        conversationHistory: [],
      })
      expect(result.scenario).toBe('video_call')
    })

    it('帧变化 → scenario = video_call', () => {
      const result = mergeContext({
        userText: '你好',
        latestFrame: 'data:image/jpeg;base64,' + 'A'.repeat(500),
        previousFrames: ['data:image/jpeg;base64,' + 'A'.repeat(100)],
        conversationHistory: [],
      })
      expect(result.scenario).toBe('video_call')
    })

    it('纯文字无视觉相关 → scenario = text_chat', () => {
      const result = mergeContext({
        userText: '今天天气不错',
        conversationHistory: [],
      })
      expect(result.scenario).toBe('text_chat')
    })
  })

  describe('token 估算', () => {
    it('纯英文文本 token 估算', () => {
      const result = mergeContext({
        userText: 'hello world',
        conversationHistory: [],
      })
      // 11 个英文字符 * 0.25 = 2.75 → ceil 3
      expect(result.tokenEstimate).toBe(3)
    })

    it('含中文文本 token 估算', () => {
      const result = mergeContext({
        userText: '你好世界',
        conversationHistory: [],
      })
      // 4 个中文字 * 1.5 = 6
      expect(result.tokenEstimate).toBe(6)
    })

    it('带图像时 token 增加 500', () => {
      const result = mergeContext({
        userText: '你看这个',
        latestFrame: 'data:image/jpeg;base64,abc',
        conversationHistory: [],
      })
      // 文本 token + 500 (image)
      expect(result.tokenEstimate).toBeGreaterThanOrEqual(500)
    })

    it('历史消息也计入 token', () => {
      const result = mergeContext({
        userText: '你好',
        conversationHistory: [
          makeMsg({ content: '之前的对话内容' }),
        ],
      })
      // 5 个中文字 * 1.5 = 8 (ceil) + 历史 7 个中文字 * 1.5 = 11 (ceil) = 19
      expect(result.tokenEstimate).toBeGreaterThan(0)
    })
  })
})
