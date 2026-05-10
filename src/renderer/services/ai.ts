// AI对话服务 - 渲染进程版本 (通过Electron主进程代理)

import type { ChatMessage, PromptScenario } from '@shared/types'
import { SYSTEM_PROMPT, SYSTEM_PROMPTS } from '@shared/constants'

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
  const messages: ChatMessage[] = []
  let messageUpdateCallback: ((msgs: ChatMessage[]) => void) | null = null
  const abortController = new AbortController()

  const sendMessage = async (content: string, image?: string, streamingId?: string, externalSignal?: AbortSignal): Promise<void> => {
    console.log('[AI] sendMessage called', { provider, model, streamingId, scenario })
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
    messages.push(assistantMsg)

    const apiMessages = buildAPIMessages(content, image, provider, scenario)

    // 合并外部 signal 和内部 abortController
    const combinedSignal = externalSignal
      ? combineAbortSignals(abortController.signal, externalSignal)
      : abortController.signal

    try {
      console.log('[AI] Fetching via proxy...')
      const response = await fetch('http://localhost:3000/api/ai/chat', {
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

      while (true) {
        if (combinedSignal.aborted) {
          console.log('[AI] Stream aborted by signal')
          break
        }
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            console.log('[AI] Raw line:', line)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              console.log('[AI] Parsed:', JSON.stringify(parsed).substring(0, 200))
              const content = parsed.choices?.[0]?.delta?.content
                           || parsed.choices?.[0]?.text
                           || parsed.choices?.[0]?.message?.content
                           || parsed.candidates?.[0]?.content?.parts?.[0]?.text
                           || ''
              console.log('[AI] Extracted content:', content.substring(0, 50))

              if (firstChunk && content) {
                firstChunk = false
                onFirstToken?.()
              }

              if (content) {
                assistantMsg.content += content
                messageUpdateCallback?.([...messages])
              }
            } catch (e) {
              console.log('[AI] JSON parse error:', e)
            }
          }
        }
      }

      console.log('[AI] Stream completed')
      onComplete?.()
    } catch (error: unknown) {
      console.error('[AI] Error:', error)
      console.error('[AI] Error stack:', error instanceof Error ? error.stack : 'N/A')
      throw error
    }
  }

  const setMessageUpdateCallback = (callback: (msgs: ChatMessage[]) => void) => {
    messageUpdateCallback = callback
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
    setMessageUpdateCallback,
    abortController,
  }
}

function buildAPIMessages(content: string, image?: string, provider?: string, scenario?: PromptScenario) {
  // 根据场景选择系统提示词
  let systemPrompt = SYSTEM_PROMPT
  if (scenario === 'video_call') {
    systemPrompt = SYSTEM_PROMPTS.video_call
  } else if (scenario === 'text_chat') {
    systemPrompt = SYSTEM_PROMPTS.text_chat
  }

  const msgs: any[] = [
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
