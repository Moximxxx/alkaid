import { render, screen } from '@testing-library/react'
import App from '../App'
import { describe, it, expect, vi } from 'vitest'

// Mock useSettings to return isConfigured=true (full app layout)
// 注意：settings 必须是稳定引用，避免因每次渲染创建新对象而触发无限循环
const mockAppSettings = {
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
  setupCompleted: true,
}
vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: mockAppSettings,
    updateSettings: vi.fn(),
    resetSettings: vi.fn(),
    isConfigured: true,
  }),
}))

// Mock useTheme
vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn(), setTheme: vi.fn() }),
}))

// Mock useChatHistory
vi.mock('@/hooks/useChatHistory', () => ({
  useChatHistory: () => ({
    conversations: [],
    save: vi.fn(),
    remove: vi.fn(),
    load: vi.fn(),
    createNew: vi.fn(),
  }),
}))

// Mock page components to avoid deep dependency mocking in route rendering
vi.mock('@/pages/Home', () => ({ HomePage: () => <div>HomePage</div> }))
vi.mock('@/pages/Settings', () => ({ SettingsPage: () => <div>SettingsPage</div> }))
vi.mock('@/pages/VideoChat', () => ({ VideoChatPage: () => <div>VideoChatPage</div> }))
vi.mock('@/pages/About', () => ({ AboutPage: () => <div>AboutPage</div> }))

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
  })

  it('renders toolbar with navigation links', () => {
    render(<App />)
    expect(screen.getByText('首页')).toBeTruthy()
    expect(screen.getByText('视频通话')).toBeTruthy()
  })

  it('renders app name in toolbar', () => {
    render(<App />)
    expect(screen.getByText('摇光')).toBeTruthy()
  })

  it('renders settings link pointing to /settings', () => {
    const { container } = render(<App />)
    const settingsLink = container.querySelector('a[href="/settings"]')
    expect(settingsLink).toBeTruthy()
  })
})
