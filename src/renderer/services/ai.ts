// AI对话服务 - 渲染进程版本 (通过Electron主进程代理)

import type { ChatMessage, PromptScenario } from '@shared/types'
import { SYSTEM_PROMPT, SYSTEM_PROMPTS } from '@shared/constants'
import { useState } from 'react'
import { logger } from '@shared/logger'

export interface UseAIReturn {
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  sendMessage: (content: string, image?: string, streamingId?: string, signal?: AbortSignal) => Promise<void>
  clearMessages: () => void
  setMessageUpdateCallback: (callback: (msgs: ChatMessage[]) => void) => void
  abortController: AbortController
}

const PROVIDER_CONFIGS: Record<string, { apiKeyEnv: string }> = {
  doubao: { apiKeyEnv: 'VITE_DOUBAO_API_KEY' },
  openai: { apiKeyEnv: 'VITE_OPENAI_API_KEY' },
  glm: { apiKeyEnv: 'VITE_GLM_API_KEY' },
  minimax: { apiKeyEnv: 'VITE_MINIMAX_API_KEY' },
  xiaomi: { apiKeyEnv: 'VITE_XIAOMI_API_KEY' },
  kimi: { apiKeyEnv: 'VITE_KIMI_API_KEY' },
  deepseek: { apiKeyEnv: 'VITE_DEEPSEEK_API_KEY' },
  claude: { apiKeyEnv: 'VITE_CLAUDE_API_KEY' },
  google: { apiKeyEnv: 'VITE_GOOGLE_API_KEY' },
}

const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:3000'

/**
 * 合并两个 AbortSignal：任一 signal 触发 abort 时，返回的 signal 也会触发
 */
function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController()
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason)
      return controller.signal
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true })
  }
  return controller.signal
}

interface UseAIOptions {
  provider: string
  apiKey?: string
  model: string
  onFirstToken?: () => void
  onComplete?: () => void
  scenario?: PromptScenario
}

export const useAI = (options: UseAIOptions): UseAIReturn => {
  const { provider, apiKey: externalApiKey, model, onFirstToken, onComplete, scenario } = options
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  let messageUpdateCallback: ((msgs: ChatMessage[]) => void) | null = null
  const abortController = new AbortController()

  const sendMessage = async (content: string, image?: string, streamingId?: string, externalSignal?: AbortSignal): Promise<void> => {
    setLoading(true)
    setError(null)
    logger.debug('sendMessage called', { provider, model, streamingId, scenario })
    const config = PROVIDER_CONFIGS[provider]
    if (!config) {
      throw new Error(`不支持的 provider: ${provider}`)
    }

    const apiKey = externalApiKey || import.meta.env[config.apiKeyEnv]
    if (!apiKey) {
      throw new Error(`请设置 ${config.apiKeyEnv} 环境变量`)
    }

    const assistantMsg: ChatMessage = {
      id: streamingId || `${Date.now()}-assistant`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, assistantMsg])

    const apiMessages = buildAPIMessages(content, image, provider, scenario)

    // 合并外部 signal 和内部 abortController
    const combinedSignal = externalSignal
      ? combineAbortSignals(abortController.signal, externalSignal)
      : abortController.signal

    try {
      logger.debug('Fetching via proxy...')
      const response = await fetch(`${PROXY_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          model,
          messages: apiMessages,
          apiKey,
          stream: true,
        }),
        signal: combinedSignal,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let firstChunk = true
      let buffer = ''

      while (!combinedSignal.aborted) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            logger.debug('Raw line:', line)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              logger.debug('Parsed:', JSON.stringify(parsed).substring(0, 200))
              const content = parsed.choices?.[0]?.delta?.content
                           || parsed.choices?.[0]?.text
                           || parsed.choices?.[0]?.message?.content
                           || parsed.candidates?.[0]?.content?.parts?.[0]?.text
                           || ''
              logger.debug('Extracted content:', content.substring(0, 50))

              if (firstChunk && content) {
                firstChunk = false
                onFirstToken?.()
              }

              if (content) {
                setMessages(prev => {
                  const next = prev.map(m =>
                    m.id === assistantMsg.id
                      ? { ...m, content: m.content + content }
                      : m
                  )
                  messageUpdateCallback?.(next)
                  return next
                })
              }
            } catch (e) {
              logger.debug('JSON parse error:', e)
            }
          }
        }
      }

      logger.info('Stream completed')
      onComplete?.()
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'AI 请求失败'
      logger.error('Error:', error)
      logger.error('Error stack:', error instanceof Error ? error.stack : 'N/A')
      setError(errMsg)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const setMessageUpdateCallback = (callback: (msgs: ChatMessage[]) => void) => {
    messageUpdateCallback = callback
  }

  const clearMessages = () => {
    setMessages([])
  }

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    setMessageUpdateCallback,
    abortController,
  }
}

// API 消息项类型
interface APIMessageItem {
  role: string
  content: string | Array<Record<string, unknown>>
}

function buildAPIMessages(content: string, image?: string, provider?: string, scenario?: PromptScenario): APIMessageItem[] {
  // 根据场景选择系统提示词
  let systemPrompt = SYSTEM_PROMPT
  if (scenario === 'video_call') {
    systemPrompt = SYSTEM_PROMPTS.video_call
  } else if (scenario === 'text_chat') {
    systemPrompt = SYSTEM_PROMPTS.text_chat
  }

  const msgs: APIMessageItem[] = [
    { role: 'system', content: systemPrompt },
  ]

  if (image) {
    if (provider === 'claude') {
      msgs.push({
        role: 'user',
        content: [
          { type: 'text', text: content },
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image.split(',')[1] } },
        ],
      })
    } else if (provider === 'google_vision' || provider === 'google') {
      // Gemini 多模态格式 — 与 claude 相同的 content array 结构，proxy 会转换为 Gemini 的 inlineData
      const base64Data = image.split(',')[1]
      msgs.push({
        role: 'user',
        content: [
          { type: 'text', text: content },
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Data } },
        ],
      })
    } else {
      msgs.push({
        role: 'user',
        content: [
          { type: 'text', text: content },
          { type: 'image_url', image_url: { url: image } },
        ],
      })
    }
  } else {
    msgs.push({ role: 'user', content })
  }

  return msgs
}
