// useSettings Hook 测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSettings } from '../useSettings'

// Mock crypto 模块（动态 import('@shared/crypto') 在 useEffect 中使用）
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

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns default settings on first use', () => {
    const { result } = renderHook(() => useSettings())
    expect(result.current.settings.textProvider).toBe('openai')
    expect(result.current.settings.textApiKey).toBe('')
    expect(result.current.isConfigured).toBe(false)
  })

  it('updateSettings merges partial updates', () => {
    const { result } = renderHook(() => useSettings())
    act(() => {
      result.current.updateSettings({ textApiKey: 'sk-test' })
    })
    expect(result.current.settings.textApiKey).toBe('sk-test')
    // 未传入的字段保持不变
    expect(result.current.settings.textProvider).toBe('openai')
  })

  it('isConfigured returns true when API key is set', () => {
    const { result } = renderHook(() => useSettings())
    act(() => {
      result.current.updateSettings({ textApiKey: 'sk-test' })
    })
    expect(result.current.isConfigured).toBe(true)
  })

  it('resetSettings restores defaults', () => {
    const { result } = renderHook(() => useSettings())
    act(() => {
      result.current.updateSettings({
        textApiKey: 'sk-test',
        textProvider: 'doubao',
      })
    })
    expect(result.current.settings.textProvider).toBe('doubao')

    act(() => {
      result.current.resetSettings()
    })
    expect(result.current.settings.textProvider).toBe('openai')
    expect(result.current.settings.textApiKey).toBe('')
    // isConfigured 也应恢复为 false
    expect(result.current.isConfigured).toBe(false)
  })

  it('persists settings to localStorage', async () => {
    const { result } = renderHook(() => useSettings())
    act(() => {
      result.current.updateSettings({ textApiKey: 'sk-persist' })
    })
    // 等待 async useEffect（encrypt + localStorage.setItem）完成
    await vi.waitFor(() => {
      const stored = localStorage.getItem('settings')
      expect(stored).toBeTruthy()
    })
    const stored = localStorage.getItem('settings')
    expect(stored).toContain('textApiKey')
  })
})
