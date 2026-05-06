// AI对话服务 - 渲染进程版本 (LangChain)

import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage, BaseMessage } from '@langchain/core/messages'
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

    const langchainMessages = buildLangChainMessages(content, image, provider)

    let firstChunk = true

    const llm = new ChatOpenAI({
      model,
      apiKey,
      streaming: true,
      configuration: {
        baseURL: config.baseUrl,
      },
    })

    try {
      console.log('[AI] LangChain stream started')
      const stream = await llm.stream(langchainMessages)
      for await (const chunk of stream) {
        if (firstChunk) {
          firstChunk = false
          console.log('[AI] First token received')
          onFirstToken?.()
        }
        const content = typeof chunk.content === 'string' ? chunk.content : ''
        if (content) {
          assistantMsg.content += content
          messageUpdateCallback?.([...messages])
        }
      }
      console.log('[AI] Stream completed')
      onComplete?.()
    } catch (error) {
      console.error('[AI] LangChain error:', error)
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
  }
}

function buildLangChainMessages(content: string, image?: string, provider?: string): BaseMessage[] {
  const msgs: BaseMessage[] = [
    new SystemMessage(SYSTEM_PROMPT),
  ]

  if (image) {
    if (provider === 'claude') {
      msgs.push(
        new HumanMessage({
          content: [
            { type: 'text', text: content },
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image.split(',')[1] } },
          ],
        })
      )
    } else {
      msgs.push(
        new HumanMessage({
          content: [
            { type: 'text', text: content },
            { type: 'image_url', image_url: { url: image } },
          ],
        })
      )
    }
  } else {
    msgs.push(new HumanMessage(content))
  }

  return msgs
}
