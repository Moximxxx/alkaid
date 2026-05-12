import { renderHook, act } from '@testing-library/react'
import { useTTS } from '../useTTS'
import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockSpeak = vi.fn()
const mockCancel = vi.fn()

beforeEach(() => {
  // Mock SpeechSynthesisUtterance（jsdom 未实现）
  class MockSpeechSynthesisUtterance {
    text: string
    lang: string = ''
    rate: number = 1
    pitch: number = 1
    voice: SpeechSynthesisVoice | null = null
    onstart: (() => void) | null = null
    onend: (() => void) | null = null
    onerror: (() => void) | null = null
    constructor(text: string) {
      this.text = text
    }
  }
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    value: MockSpeechSynthesisUtterance,
    writable: true,
    configurable: true,
  })

  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      speak: mockSpeak,
      cancel: mockCancel,
      getVoices: () => [{ lang: 'zh-CN', name: 'Ting-Ting' }],
      onvoiceschanged: null,
    },
    writable: true,
    configurable: true,
  })
})

describe('useTTS', () => {
  it('isSupported returns true', () => {
    const { result } = renderHook(() => useTTS())
    expect(result.current.isSupported).toBe(true)
  })

  it('speak calls speechSynthesis.speak', () => {
    const { result } = renderHook(() => useTTS())
    act(() => { result.current.speak('hello') })
    expect(mockSpeak).toHaveBeenCalled()
  })

  it('stop calls speechSynthesis.cancel', () => {
    const { result } = renderHook(() => useTTS())
    act(() => { result.current.stop() })
    expect(mockCancel).toHaveBeenCalled()
  })
})
