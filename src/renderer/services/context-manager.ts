// 滑动窗口上下文管理器
// 维护消息环形缓冲区，按 token 估算裁剪最早内容

import type { ChatMessage } from '@shared/types'
import { PIPELINE_DEFAULTS } from '@shared/constants'

export interface ContextManagerOptions {
  maxTokens?: number
  systemPrompt?: string
}

export interface ContextManagerControls {
  addMessage: (msg: ChatMessage) => void
  addFrame: (frame: string, description?: string) => void
  getContext: () => ChatMessage[]
  reset: () => void
  estimateTokens: (text: string) => number
  getTotalTokens: () => number
}

/**
 * 简单 token 估算
 * 中文 ≈ 1.5 tokens/字，英文 ≈ 0.25 tokens/字符
 */
function estimateTokens(text: string): number {
  let chineseChars = 0
  let otherChars = 0
  for (const char of text) {
    if (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(char)) {
      chineseChars++
    } else {
      otherChars++
    }
  }
  return Math.ceil(chineseChars * 1.5 + otherChars * 0.25)
}

export class ContextManager implements ContextManagerControls {
  private messages: ChatMessage[] = []
  private maxTokens: number
  private systemPrompt: string

  constructor(options: ContextManagerOptions = {}) {
    this.maxTokens = options.maxTokens ?? PIPELINE_DEFAULTS.maxContextTokens
    this.systemPrompt = options.systemPrompt ?? ''
  }

  /**
   * 添加一条消息
   */
  addMessage(msg: ChatMessage): void {
    this.messages.push(msg)
    this.pruneContext()
  }

  /**
   * 添加一帧画面作为消息（image 类型）
   */
  addFrame(frame: string, description?: string): void {
    const frameMsg: ChatMessage = {
      id: `frame-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      role: 'user',
      content: description || '[视觉帧]',
      timestamp: Date.now(),
      image: frame,
    }
    this.messages.push(frameMsg)
    this.pruneContext()
  }

  /**
   * 获取裁剪后的上下文消息列表（从旧到新）
   * 超过上限 → 丢弃最早的视觉帧消息（保留文字对话）
   */
  getContext(): ChatMessage[] {
    return [...this.messages]
  }

  /**
   * 重置上下文
   */
  reset(): void {
    this.messages = []
  }

  /**
   * 估算文本的 token 数
   */
  estimateTokens(text: string): number {
    return estimateTokens(text)
  }

  /**
   * 获取当前所有消息的总 token 数
   */
  getTotalTokens(): number {
    let total = 0
    if (this.systemPrompt) {
      total += estimateTokens(this.systemPrompt)
    }
    for (const msg of this.messages) {
      total += estimateTokens(msg.content)
      if (msg.image) {
        // 图片粗略估算：每张图片约 500 tokens
        total += 500
      }
    }
    return total
  }

  /**
   * 滑动窗口裁剪策略：
   * 1. 计算总 token 数
   * 2. 如果超过上限，丢弃最早的视觉帧消息
   * 3. 如果还不够，丢弃最早的用户消息（保留 system 和最近对话）
   */
  private pruneContext(): void {
    while (this.getTotalTokens() > this.maxTokens && this.messages.length > 0) {
      // 优先丢弃带 image 的最早消息
      const frameIndex = this.messages.findIndex((m) => m.image)
      if (frameIndex >= 0) {
        this.messages.splice(frameIndex, 1)
        continue
      }
      // 没有更多视觉帧，丢弃最早的非系统消息
      const firstMsg = this.messages[0]
      if (firstMsg && firstMsg.role !== 'system') {
        this.messages.shift()
      } else {
        break
      }
    }
  }
}
