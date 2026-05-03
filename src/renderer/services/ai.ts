// AI对话服务 - 渲染进程版本

import type { ChatMessage } from '@shared/types'

export interface UseAIReturn {
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  sendMessage: (content: string, image?: string) => Promise<void>
  clearMessages: () => void
}

const MODEL_CONFIG = {
  provider: 'doubao',
  baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
  apiKey: import.meta.env.VITE_DOUBAO_API_KEY || '',
  model: 'doubao-1.6-thinking',
}

export const useAI = (): UseAIReturn => {
  const messages: ChatMessage[] = []

  const sendMessage = async (content: string, image?: string): Promise<void> => {
    if (!MODEL_CONFIG.apiKey) {
      throw new Error('请设置 VITE_DOUBAO_API_KEY 环境变量')
    }

    const msgs = buildMessages(content, image)
    const response = await fetch(`${MODEL_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MODEL_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL_CONFIG.model,
        messages: msgs,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`API 错误: ${response.status} - ${err}`)
    }

    const data = await response.json()
    messages.push({
      id: `${Date.now()}`,
      role: 'user',
      content,
      image,
      timestamp: Date.now(),
    })
    messages.push({
      id: `${Date.now()}-assistant`,
      role: 'assistant',
      content: data.choices[0].message.content,
      timestamp: Date.now(),
    })
  }

  const clearMessages = () => {
    messages.length = 0
  }

  return {
    messages,
    loading: false,
    error: null,
    sendMessage,
    clearMessages,
  }
}

function buildMessages(content: string, image?: string) {
  const msgs: any[] = [
    { role: 'system', content: '你是一个有用的AI助手，请用中文回复。' },
  ]

  if (image) {
    msgs.push({
      role: 'user',
      content: [
        { type: 'text', text: content },
        { type: 'image_url', image_url: { url: image } },
      ],
    })
  } else {
    msgs.push({ role: 'user', content })
  }

  return msgs
}
