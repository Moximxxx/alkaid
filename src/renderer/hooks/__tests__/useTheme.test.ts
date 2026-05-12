import { renderHook, act } from '@testing-library/react'
import { useTheme } from '../useTheme'
import { describe, it, expect, beforeEach, vi } from 'vitest'

beforeEach(() => {
  localStorage.clear()
  // Mock matchMedia（jsdom 未实现），默认返回 light 偏好
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    writable: true,
    configurable: true,
  })
})

describe('useTheme', () => {
  it('defaults to light when no saved preference', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })

  it('toggleTheme switches light ↔ dark', () => {
    const { result } = renderHook(() => useTheme())
    act(() => { result.current.toggleTheme() })
    expect(result.current.theme).toBe('dark')
    act(() => { result.current.toggleTheme() })
    expect(result.current.theme).toBe('light')
  })

  it('setTheme changes theme', () => {
    const { result } = renderHook(() => useTheme())
    act(() => { result.current.setTheme('dark') })
    expect(result.current.theme).toBe('dark')
  })

  it('persists theme to localStorage', () => {
    const { result } = renderHook(() => useTheme())
    act(() => { result.current.setTheme('dark') })
    expect(localStorage.getItem('theme')).toBe('dark')
  })
})
