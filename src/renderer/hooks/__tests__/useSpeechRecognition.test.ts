import { renderHook, act } from '@testing-library/react'
import { useSpeechRecognition } from '../useSpeechRecognition'
import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockStart = vi.fn()
const mockStop = vi.fn()
let mockOnResult: ((e: unknown) => void) | null = null

beforeEach(() => {
  class MockRecognition {
    lang = ''
    continuous = false
    interimResults = false
    maxAlternatives = 0
    start = mockStart
    stop = mockStop
    set onresult(v: unknown) {
      mockOnResult = v as (e: unknown) => void
    }
    set onerror(_v: unknown) {}
    set onend(_v: unknown) {}
  }
  Object.defineProperty(window, 'SpeechRecognition', {
    value: MockRecognition,
    writable: true,
  })
})

describe('useSpeechRecognition', () => {
  it('returns isSupported=true when SpeechRecognition exists', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    expect(result.current.isSupported).toBe(true)
  })

  it('startListening calls recognition.start', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => {
      result.current.startListening()
    })
    expect(mockStart).toHaveBeenCalled()
  })

  it('stopListening calls recognition.stop', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => {
      result.current.startListening()
    })
    act(() => {
      result.current.stopListening()
    })
    expect(mockStop).toHaveBeenCalled()
  })

  it('resetTranscript clears transcript', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => {
      result.current.startListening()
    })
    // simulate result
    if (mockOnResult) {
      mockOnResult({
        resultIndex: 0,
        results: {
          length: 1,
          0: { isFinal: true, 0: { transcript: 'hello' } },
        },
      })
    }
    act(() => {
      result.current.resetTranscript()
    })
    expect(result.current.transcript).toBe('')
  })
})
