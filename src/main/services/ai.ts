// AI对话服务

import type { AIModelConfig, ChatMessage } from '@shared/types'
import { configManager } from '../config'

export class AIService {
  private config: AIModelConfig
  private messages: ChatMessage[] = []

  constructor(config: AIModelConfig) {
    this.config = config
  }

  // 更新配置
  updateConfig(config: AIModelConfig): void {
    this.config = config
  }

  // 发送消息（支持图像）
  async sendMessage(content: string, image?: string): Promise<ChatMessage> {
    const provider = this.config.provider

    // 添加用户消息
    const userMessage: ChatMessage = {
      id: this.generateId(),
      role: 'user',
      content,
      image,
      timestamp: Date.now(),
    }
    this.messages.push(userMessage)

    // 调用对应的API
    let response: string
    if (provider === 'openai') {
      response = await this.callOpenAI(content, image)
    } else if (provider === 'claude') {
      response = await this.callClaude(content, image)
    } else if (provider === 'doubao') {
      response = await this.callDoubao(content, image)
    } else {
      throw new Error(`不支持的AI提供商: ${provider}`)
    }

    // 添加助手消息
    const assistantMessage: ChatMessage = {
      id: this.generateId(),
      role: 'assistant',
      content: response,
      timestamp: Date.now(),
    }
    this.messages.push(assistantMessage)

    return assistantMessage
  }

  // 调用OpenAI API
  private async callOpenAI(content: string, image?: string): Promise<string> {
    const messages = this.buildOpenAIMessages(content, image)

    const response = await fetch(
      `${this.config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          max_tokens: 1024,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`OpenAI API 错误: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  // 调用Claude API
  private async callClaude(content: string, image?: string): Promise<string> {
    const messages = this.buildClaudeMessages(content, image)

    const response = await fetch(
      `${this.config.baseUrl || 'https://api.anthropic.com/v1'}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: 1024,
          messages,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Claude API 错误: ${response.status}`)
    }

    const data = await response.json()
    return data.content[0].text
  }

  // 调用豆包 API（兼容OpenAI格式）
  private async callDoubao(content: string, image?: string): Promise<string> {
    const messages = this.buildOpenAIMessages(content, image)

    const response = await fetch(
      `${this.config.baseUrl || 'https://ark.cn-beijing.volces.com/api/v3'}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          max_tokens: 1024,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`豆包 API 错误: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  // 构建OpenAI消息格式
  private buildOpenAIMessages(content: string, image?: string): Array<{role: string; content: any}> {
    const messages: Array<{role: string; content: any}> = [
      {
        role: 'system',
        content: '你是一个能够理解和分析图像的AI助手。请用中文回复。',
      },
    ]

    // 添加历史消息
    for (const msg of this.messages.slice(-10)) {
      if (msg.role === 'user' && msg.image) {
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: msg.content },
            {
              type: 'image_url',
              image_url: { url: msg.image },
            },
          ],
        })
      } else {
        messages.push({
          role: msg.role,
          content: msg.content,
        })
      }
    }

    // 添加当前消息
    if (image) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: content },
          {
            type: 'image_url',
            image_url: { url: image },
          },
        ],
      })
    } else {
      messages.push({ role: 'user', content })
    }

    return messages
  }

  // 构建Claude消息格式
  private buildClaudeMessages(content: string, image?: string): Array<{role: string; content: any}> {
    const messages: Array<{role: string; content: any}> = []

    // 添加历史消息
    for (const msg of this.messages.slice(-10)) {
      if (msg.role === 'user' && msg.image) {
        messages.push({
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: msg.image.replace(/^data:image\/\w+;base64,/, ''),
              },
            },
            { type: 'text', text: msg.content },
          ],
        })
      } else {
        messages.push({
          role: msg.role,
          content: msg.content,
        })
      }
    }

    // 添加当前消息
    if (image) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: image.replace(/^data:image\/\w+;base64,/, ''),
            },
          },
          { type: 'text', text: content },
        ],
      })
    } else {
      messages.push({ role: 'user', content })
    }

    return messages
  }

  // 获取对话历史
  getMessages(): ChatMessage[] {
    return this.messages
  }

  // 清空对话历史
  clearMessages(): void {
    this.messages = []
  }

  // 生成唯一ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// 创建单例实例
export const aiService = new AIService(configManager.getAIConfig())

export default AIService
