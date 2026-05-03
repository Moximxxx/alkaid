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

const PROVIDER_CONFIGS = {
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

export const useAI = (provider: string = MODEL_CONFIG.provider, model: string = MODEL_CONFIG.model): UseAIReturn => {
  const messages: ChatMessage[] = []

  const sendMessage = async (content: string, image?: string): Promise<void> => {
    const config = PROVIDER_CONFIGS[provider as keyof typeof PROVIDER_CONFIGS]
    if (!config) {
      throw new Error(`不支持的 provider: ${provider}`)
    }

    const apiKey = import.meta.env[config.apiKeyEnv]
    if (!apiKey) {
      throw new Error(`请设置 ${config.apiKeyEnv} 环境变量`)
    }

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
        ...(provider === 'claude' ? { max_tokens_to_sample: 1024 } : {}),
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

function buildMessages(content: string, image?: string, provider?: string) {
  const msgs: any[] = [
    { role: 'system', content: '你是一个有用的AI助手，请用中文回复。' },
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
