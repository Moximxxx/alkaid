import { render, screen } from '@testing-library/react'
import { SettingsPage } from '../Settings'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock useSettings hook
// 注意：settings 必须是稳定引用，否则 Settings.tsx 内 useEffect([settings])
// 会因每次渲染创建新对象而无限循环
const mockSettings = {
  visionProvider: 'doubao_vision' as const,
  visionApiKey: '',
  visionModel: 'doubao-2.0-vision-pro',
  textProvider: 'openai' as const,
  textApiKey: '',
  textModel: 'gpt-4',
  cameraResolution: '1280x720',
  cameraFps: 30,
  cameraMirror: false,
  ttsEnabled: true,
  ttsRate: 1,
  ttsPitch: 1,
  ttsVoiceURI: '',
  setupCompleted: false,
}
vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: mockSettings,
    updateSettings: vi.fn(),
    resetSettings: vi.fn(),
    isConfigured: false,
  }),
}))

describe('SettingsPage', () => {
  beforeEach(() => {
    // Mock navigator.mediaDevices.enumerateDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
      configurable: true,
      writable: true,
    })

    // Mock window.speechSynthesis
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        getVoices: vi.fn().mockReturnValue([]),
        onvoiceschanged: null,
      },
      configurable: true,
      writable: true,
    })
  })

  it('renders page title', () => {
    render(<SettingsPage />)
    expect(screen.getByText('设置')).toBeTruthy()
  })

  it('renders all tab triggers', () => {
    render(<SettingsPage />)
    expect(screen.getByText('AI 模型')).toBeTruthy()
    expect(screen.getByText('摄像头')).toBeTruthy()
    expect(screen.getByText('语音合成')).toBeTruthy()
    expect(screen.getByText('快捷键')).toBeTruthy()
    expect(screen.getByText('关于')).toBeTruthy()
  })

  it('renders AI settings tab content by default', () => {
    render(<SettingsPage />)
    expect(screen.getByText('视觉模型配置')).toBeTruthy()
    expect(screen.getByText('文本模型配置')).toBeTruthy()
  })

  it('renders vision model selector', () => {
    const { container } = render(<SettingsPage />)
    const select = container.querySelector('#visionModel')
    expect(select).toBeTruthy()
  })

  it('renders API key inputs', () => {
    render(<SettingsPage />)
    expect(screen.getByLabelText('视觉模型 API Key')).toBeTruthy()
    expect(screen.getByLabelText('文本模型 API Key')).toBeTruthy()
  })

  it('renders text provider buttons', () => {
    render(<SettingsPage />)
    // OpenAI should be visible as a provider option
    expect(screen.getByText('OpenAI')).toBeTruthy()
  })

  it('renders model selector for text', () => {
    const { container } = render(<SettingsPage />)
    const select = container.querySelector('#textModel')
    expect(select).toBeTruthy()
  })

  it('renders save and reset buttons', () => {
    render(<SettingsPage />)
    const saveButtons = screen.getAllByText('保存设置')
    expect(saveButtons.length).toBeGreaterThanOrEqual(1)
    const resetButtons = screen.getAllByText('重置')
    expect(resetButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('renders page description', () => {
    render(<SettingsPage />)
    expect(screen.getByText('配置应用程序')).toBeTruthy()
  })
})
