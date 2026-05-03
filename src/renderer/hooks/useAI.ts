// AI对话Hook

import { useState, useCallback } from 'react'
import { aiService } from '@/main/services/ai'
import type { ChatMessage } from '@shared/types'

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

  // 发送消息
  const sendMessage = useCallback(async (content: string, image?: string) => {
    try {
      setLoading(true)
      setError(null)

      await aiService.sendMessage(content, image)
      setMessages(aiService.getMessages())
    } catch (err: any) {
      setError(err.message || '发送消息失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 清空消息
  const clearMessages = useCallback(() => {
    aiService.clearMessages()
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

export default useAI
