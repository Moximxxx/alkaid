// AI对话Hook

import { useState, useCallback, useEffect, useRef } from 'react'
import type { ChatMessage } from '@shared/types'

const MODEL_CONFIG = {
  provider: 'doubao',
  baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
  apiKey: import.meta.env.VITE_DOUBAO_API_KEY || '',
  model: 'doubao-vision-pro',
}

interface UseAIReturn {
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  sendMessage: (content: string, image?: string) => Promise<void>
  clearMessages: () => void
}

export const useAI = (): UseAIReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (content: string, image?: string) => {
    try {
      setLoading(true)
      setError(null)

      if (!MODEL_CONFIG.apiKey) {
        throw new Error('请设置 VITE_DOUBAO_API_KEY 环境变量')
      }

      const userMsg: ChatMessage = {
        id: `${Date.now()}`,
        role: 'user',
        content,
        image,
        timestamp: Date.now(),
      }

      setMessages(prev => [...prev, userMsg])

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
        const errText = await response.text()
        throw new Error(`API 错误: ${response.status} - ${errText}`)
      }

      const data = await response.json()
      const assistantMsg: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: Date.now(),
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch (err: any) {
      setError(err.message || '发送消息失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    loading,
    error,
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

export default useAI
