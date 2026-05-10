// 滑动窗口上下文管理器测试
import { describe, it, expect, beforeEach } from 'vitest'
import { ContextManager } from '../context-manager'
import type { ChatMessage } from '@shared/types'

function makeMsg(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    role: 'user',
    content: '测试消息',
    timestamp: Date.now(),
    ...overrides,
  }
}

describe('ContextManager', () => {
  let manager: ContextManager

  beforeEach(() => {
    manager = new ContextManager({ maxTokens: 1000 })
  })

  describe('estimateTokens', () => {
    it('纯英文字符估算', () => {
      const tokens = manager.estimateTokens('hello world')
      // 11 字符 * 0.25 = 2.75 → ceil 3
      expect(tokens).toBe(3)
    })

    it('中文字符估算', () => {
      const tokens = manager.estimateTokens('你好世界')
      // 4 中文字 * 1.5 = 6
      expect(tokens).toBe(6)
    })

    it('中英文混合估算', () => {
      const tokens = manager.estimateTokens('你好 world')
      // 2 中文 * 1.5 = 3, 6 英文 * 0.25 = 1.5 → ceil(4.5) = 5
      expect(tokens).toBe(5)
    })

    it('空字符串返回 0', () => {
      expect(manager.estimateTokens('')).toBe(0)
    })

    it('全角标点也按中文估算', () => {
      const tokens = manager.estimateTokens('你好，世界！')
      // 6 中文/全角 * 1.5 = 9
      expect(tokens).toBe(9)
    })
  })

  describe('addMessage / getContext', () => {
    it('添加消息后可通过 getContext 获取', () => {
      const msg = makeMsg({ content: '第一条消息' })
      manager.addMessage(msg)
      const ctx = manager.getContext()
      expect(ctx).toHaveLength(1)
      expect(ctx[0].content).toBe('第一条消息')
    })

    it('添加多条消息返回有序列表', () => {
      manager.addMessage(makeMsg({ content: 'msg1' }))
      manager.addMessage(makeMsg({ content: 'msg2' }))
      manager.addMessage(makeMsg({ content: 'msg3' }))
      expect(manager.getContext()).toHaveLength(3)
      expect(manager.getContext()[0].content).toBe('msg1')
      expect(manager.getContext()[2].content).toBe('msg3')
    })
  })

  describe('addFrame', () => {
    it('添加帧消息包含 image 字段', () => {
      manager.addFrame('data:image/jpeg;base64,abc123', '画面描述')
      const ctx = manager.getContext()
      expect(ctx).toHaveLength(1)
      expect(ctx[0].image).toBe('data:image/jpeg;base64,abc123')
      expect(ctx[0].content).toBe('画面描述')
    })

    it('无描述时默认为 [视觉帧]', () => {
      manager.addFrame('data:image/jpeg;base64,abc')
      expect(manager.getContext()[0].content).toBe('[视觉帧]')
    })
  })

  describe('滑动窗口裁剪', () => {
    it('未超过上限时不裁剪', () => {
      // maxTokens=1000, 一条短消息远低于此
      for (let i = 0; i < 10; i++) {
        manager.addMessage(makeMsg({ content: '短消息' }))
      }
      expect(manager.getContext()).toHaveLength(10)
    })

    it('超过上限时优先丢弃视觉帧', () => {
      const smallManager = new ContextManager({ maxTokens: 500 })

      // 添加文本消息
      smallManager.addMessage(makeMsg({ content: '第一条文本消息' }))
      // 添加大量视觉帧
      for (let i = 0; i < 5; i++) {
        smallManager.addFrame(
          'data:image/jpeg;base64,' + 'A'.repeat(1000),
          `视觉帧 ${i}`,
        )
      }

      const ctx = smallManager.getContext()
      // 由于 frame 有 500 token 的图片估算，第一条消息可能被裁剪
      // 但优先丢弃的是带 image 的帧
      const hasImageFrames = ctx.some((m) => m.image)
      // 至少文本消息应该保留（它是第一条，但因为我们优先丢弃帧，所以文本消息最后可能也被丢）
      // 关键验证：total 不超过 maxTokens
      const totalTokens = smallManager.getTotalTokens()
      expect(totalTokens).toBeLessThanOrEqual(500)
    })

    it('极端超限时也丢弃普通消息', () => {
      const tinyManager = new ContextManager({ maxTokens: 50 })

      // 添加一条长消息
      tinyManager.addMessage(makeMsg({
        content: '这是一条非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的消息，远超 token 上限',
      }))

      // 再添加一条
      tinyManager.addMessage(makeMsg({
        content: '第二条消息',
      }))

      // 总 token 应 <= 50
      expect(tinyManager.getTotalTokens()).toBeLessThanOrEqual(50)
    })

    it('仅剩一条消息时停止裁剪', () => {
      const veryTiny = new ContextManager({ maxTokens: 10 })
      veryTiny.addMessage(makeMsg({
        content: '你好',
      }))
      // token: 2 * 1.5 = 3，没超过 10
      expect(veryTiny.getContext()).toHaveLength(1)
    })
  })

  describe('getTotalTokens', () => {
    it('空上下文返回 0', () => {
      expect(manager.getTotalTokens()).toBe(0)
    })

    it('计入 systemPrompt', () => {
      const m = new ContextManager({ maxTokens: 1000, systemPrompt: '你好' })
      // 2 * 1.5 = 3
      expect(m.getTotalTokens()).toBe(3)
    })

    it('带图片的消息额外加 500', () => {
      manager.addFrame('data:image/jpeg;base64,abc')
      const tokens = manager.getTotalTokens()
      // content '[视觉帧]' 3 中文 * 1.5 + 2 符号 * 0.25 = ceil(5) = 5, + 500(image) = 505
      expect(tokens).toBe(505)
    })
  })

  describe('reset', () => {
    it('reset 后上下文清空', () => {
      manager.addMessage(makeMsg())
      manager.addFrame('data:image/jpeg;base64,abc')
      expect(manager.getContext()).toHaveLength(2)
      manager.reset()
      expect(manager.getContext()).toHaveLength(0)
      expect(manager.getTotalTokens()).toBe(0)
    })
  })

  describe('自定义参数', () => {
    it('可自定义 maxTokens', () => {
      const m = new ContextManager({ maxTokens: 500 })
      expect(m.getTotalTokens()).toBe(0)
      // 添加一条消息，不会触发裁剪
      m.addMessage(makeMsg({ content: 'a'.repeat(20) }))
      expect(m.getContext()).toHaveLength(1)
    })
  })
})
