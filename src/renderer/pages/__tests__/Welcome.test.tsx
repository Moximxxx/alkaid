import { render, screen } from '@testing-library/react'
import { WelcomePage } from '../Welcome'
import { describe, it, expect, vi } from 'vitest'

// Mock crypto module used by useSettings hook (same pattern as useSettings.test.ts)
vi.mock('@shared/crypto', () => ({
  encrypt: vi.fn((s: string) => Promise.resolve(`encrypted__${s}`)),
  decrypt: vi.fn((s: string) => {
    if (s.startsWith('encrypted__')) {
      return Promise.resolve(s.replace('encrypted__', ''))
    }
    return Promise.resolve(s)
  }),
  isEncrypted: vi.fn((s: string) => s.startsWith('encrypted__')),
}))

describe('WelcomePage', () => {
  it('renders welcome title', () => {
    render(<WelcomePage />)
    expect(screen.getByText('欢迎使用摇光')).toBeTruthy()
  })

  it('renders welcome description', () => {
    render(<WelcomePage />)
    expect(screen.getByText('您的智能摄像头AI助手')).toBeTruthy()
  })

  it('renders setup dialog with title and description', () => {
    render(<WelcomePage />)
    expect(screen.getByText('快速配置')).toBeTruthy()
    expect(screen.getByText('按照以下步骤完成初始配置')).toBeTruthy()
  })

  it('renders step indicators', () => {
    render(<WelcomePage />)
    // "视觉模型" appears both in step indicator and form label, so we use getAllByText
    expect(screen.getAllByText('视觉模型').length).toBe(2)
    expect(screen.getByText('文本模型')).toBeTruthy()
    expect(screen.getByText('配置密钥')).toBeTruthy()
    expect(screen.getByText('完成')).toBeTruthy()
  })

  it('renders next step button', () => {
    render(<WelcomePage />)
    const nextButton = screen.getByText('下一步')
    expect(nextButton).toBeTruthy()
  })

  it('renders vision model selection by default', () => {
    render(<WelcomePage />)
    // Step 1 - vision model selection should be visible initially
    // "视觉模型" appears both in step indicator and form label
    const visionModelElements = screen.getAllByText('视觉模型')
    expect(visionModelElements.length).toBe(2)
  })
})
