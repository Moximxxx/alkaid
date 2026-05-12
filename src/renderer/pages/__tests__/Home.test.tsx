import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { HomePage } from '../Home'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock useSettings — 注意 settings 必须是稳定引用避免无限循环
const mockHomeSettings = {
  textProvider: 'openai' as const,
  textApiKey: '',
  textModel: 'gpt-4',
  visionProvider: 'doubao_vision' as const,
  visionApiKey: '',
  visionModel: 'doubao-2.0-vision-pro',
  cameraResolution: '1280x720',
  cameraFps: 30,
  cameraMirror: false,
  ttsEnabled: true,
  ttsRate: 1,
  ttsPitch: 1,
  ttsVoiceURI: '',
  setupCompleted: true,
}
vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: mockHomeSettings,
    updateSettings: vi.fn(),
    resetSettings: vi.fn(),
    isConfigured: true,
  }),
}))

// Mock useAI service
const mockUseAI = {
  messages: [],
  loading: false,
  error: null,
  sendMessage: vi.fn(),
  clearMessages: vi.fn(),
  setMessageUpdateCallback: vi.fn(),
  abortController: new AbortController(),
}

vi.mock('@/services/ai', () => ({
  useAI: () => mockUseAI,
}))

// Mock useTTS
vi.mock('@/hooks/useTTS', () => ({
  useTTS: () => ({
    speak: vi.fn(),
    stop: vi.fn(),
    isSpeaking: false,
    isSupported: true,
  }),
}))

// Mock useChatHistory
vi.mock('@/hooks/useChatHistory', () => ({
  useChatHistory: () => ({
    conversations: [],
    save: vi.fn(),
    remove: vi.fn(),
    load: vi.fn(),
    createNew: vi.fn(() => ({
      id: Date.now().toString(),
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })),
  }),
}))

// jsdom 未实现 scrollIntoView
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

const renderHomePage = () => {
  return render(
    <BrowserRouter>
      <HomePage />
    </BrowserRouter>
  )
}

/** 获取发送按钮: Button 组件内部不渲染 title，通过 Lucide Send 图标向上查找 */
const getSendButton = (container: HTMLElement): HTMLButtonElement | null => {
  const sendIcon = container.querySelector('svg.lucide-send')
  return sendIcon?.closest('button') ?? null
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders welcome message from assistant', () => {
    renderHomePage()
    expect(screen.getByText('你好！我是摇光，你的AI助手。有什么我可以帮助你的吗？')).toBeTruthy()
  })

  it('renders input textarea', () => {
    renderHomePage()
    const textarea = screen.getByPlaceholderText('输入消息...')
    expect(textarea).toBeTruthy()
  })

  it('renders send button', () => {
    const { container } = renderHomePage()
    expect(getSendButton(container)).toBeTruthy()
  })

  it('send button is disabled when input is empty', () => {
    const { container } = renderHomePage()
    expect(getSendButton(container)).toBeDisabled()
  })

  it('renders video chat link button', () => {
    renderHomePage()
    const videoButton = screen.getByTitle('视频通话')
    expect(videoButton).toBeTruthy()
    const link = videoButton.closest('a')
    expect(link).toHaveAttribute('href', '/video-chat')
  })

  it('renders new conversation button', () => {
    renderHomePage()
    expect(screen.getByText('新对话')).toBeTruthy()
  })

  it('shows enter hint text', () => {
    renderHomePage()
    expect(screen.getByText('按 Enter 发送，Shift+Enter 换行')).toBeTruthy()
  })

  it('textarea is enabled and has correct initial value', () => {
    renderHomePage()
    const textarea = screen.getByPlaceholderText('输入消息...') as HTMLTextAreaElement
    expect(textarea).toBeEnabled()
    expect(textarea.value).toBe('')
  })

  it('send button becomes enabled when user types', () => {
    const { container } = renderHomePage()
    const textarea = screen.getByPlaceholderText('输入消息...')
    const sendButton = getSendButton(container)

    expect(sendButton).toBeDisabled()

    fireEvent.change(textarea, { target: { value: 'Hello' } })
    expect(sendButton).toBeEnabled()
  })
})
