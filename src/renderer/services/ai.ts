// AI对话服务 - 渲染进程版本

import type { ChatMessage } from '@shared/types'
import { SYSTEM_PROMPT } from '@shared/constants'

export interface UseAIReturn {
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  sendMessage: (content: string, image?: string, streamingId?: string) => Promise<void>
  clearMessages: () => void
  setMessageUpdateCallback: (callback: (msgs: ChatMessage[]) => void) => void
}

const PROVIDER_CONFIGS: Record<string, { baseUrl: string; apiKeyEnv: string }> = {
  doubao: {
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    apiKeyEnv: 'VITE_DOUBAO_API_KEY',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    apiKeyEnv: 'VITE_OPENAI_API_KEY',
  },
  glm: {
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    apiKeyEnv: 'VITE_GLM_API_KEY',
  },
  minimax: {
    baseUrl: 'https://api.minimax.chat/v1',
    apiKeyEnv: 'VITE_MINIMAX_API_KEY',
  },
  xiaomi: {
    baseUrl: 'https://api.mimo.minimax.io/v1',
    apiKeyEnv: 'VITE_XIAOMI_API_KEY',
  },
  kimi: {
    baseUrl: 'https://api.moonshot.cn/v1',
    apiKeyEnv: 'VITE_KIMI_API_KEY',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    apiKeyEnv: 'VITE_DEEPSEEK_API_KEY',
  },
  claude: {
    baseUrl: 'https://api.anthropic.com/v1',
    apiKeyEnv: 'VITE_CLAUDE_API_KEY',
  },
}

interface UseAIOptions {
  provider: string
  apiKey?: string
  model: string
  onFirstToken?: () => void
  onComplete?: () => void
}

export const useAI = (options: UseAIOptions): UseAIReturn => {
  const { provider, apiKey: externalApiKey, model, onFirstToken, onComplete } = options
  const messages: ChatMessage[] = []
    let messageUpdateCallback: ((msgs: ChatMessage[]) => void) | null = null

    const sendMessage = async (content: string, image?: string, streamingId?: string): Promise<void> => {
      console.log('[AI] sendMessage called', { provider, model, streamingId })
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

      const msgs = buildMessages(content, image, provider)
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          ...(provider === 'claude' ? { 'anthropic-version': '2023-06-01' } : {}),
        },
        body: JSON.stringify({
          model,
          messages: msgs,
          max_tokens: 1024,
          stream: true,
          ...(provider === 'claude' ? { max_tokens_to_sample: 1024 } : {}),
        }),
      })
      console.log('[AI] API request body:', JSON.stringify({
        model,
        messages: msgs,
        max_tokens: 1024,
        stream: true,
        ...(provider === 'claude' ? { max_tokens_to_sample: 1024 } : {}),
      }))

      if (!response.ok) {
        const err = await response.text()
        throw new Error(`API 错误: ${response.status} - ${err}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let firstTokenCalled = false

      console.log('[AI] Stream started')
      while (true) {
        const { done, value } = await reader.read()
        console.log('[AI] Chunk received:', { done, value: decoder.decode(value, { stream: false }) })
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              const deltaContent = parsed.choices?.[0]?.delta?.content
              const textContent = parsed.choices?.[0]?.text
              const messageContent = parsed.choices?.[0]?.message?.content
              const content = deltaContent || textContent || messageContent
              console.log('[AI] Parsed content:', { deltaContent, textContent, messageContent, content, finish_reason: parsed.choices?.[0]?.finish_reason })
              if (content) {
                if (!firstTokenCalled) {
                  firstTokenCalled = true
                  console.log('[AI] onFirstToken called')
                  onFirstToken?.()
                }
                assistantMsg.content += content
                messageUpdateCallback?.([...messages])
              }
            } catch (e) {
              console.error('流式解析错误:', e, '原始数据:', data)
              console.log('[AI] Error:', e)
            }
          }
        }
      }
      console.log('[AI] onComplete called')
      onComplete?.()
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
  }
}

function buildMessages(content: string, image?: string, provider?: string) {
  const msgs: any[] = [
    { role: 'system', content: SYSTEM_PROMPT },
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
