// VAD Hook 测试
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVAD } from '../useVAD'

beforeAll(() => {
  class MockAudioContext {
    createAnalyser() {
      return {
        connect: vi.fn(),
        disconnect: vi.fn(),
        frequencyBinCount: 1024,
        fftSize: 256,
        getByteFrequencyData: vi.fn(),
        getByteTimeDomainData(array: Uint8Array) {
          // 填充 128（归一化 0），使 RMS = 0 < 阈值 0.3
          array.fill(128)
        },
      }
    }
    createMediaStreamSource() {
      return { connect: vi.fn(), disconnect: vi.fn() }
    }
    decodeAudioData() {
      return Promise.resolve({ length: 1, numberOfChannels: 1, sampleRate: 44100 })
    }
    close() {
      return Promise.resolve()
    }
    get sampleRate() {
      return 44100
    }
    get state() {
      return 'running'
    }
  }
  Object.defineProperty(window, 'AudioContext', { value: MockAudioContext, writable: true })
  Object.defineProperty(window, 'webkitAudioContext', { value: MockAudioContext, writable: true })
})

describe('useVAD', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('初始状态', () => {
    it('isSpeaking 初始为 false', () => {
      const { result } = renderHook(() =>
        useVAD({ stream: null }),
      )
      expect(result.current.isSpeaking).toBe(false)
    })

    it('isSupported 为 true（已 mock AudioContext）', () => {
      const { result } = renderHook(() =>
        useVAD({ stream: null }),
      )
      // 已 mock AudioContext，因此支持
      expect(result.current.isSupported).toBe(true)
    })
  })

  describe('startMonitoring / stopMonitoring', () => {
    it('startMonitoring 无 stream 时不报错（提前返回）', () => {
      const { result } = renderHook(() =>
        useVAD({ stream: null }),
      )
      expect(() => {
        act(() => {
          result.current.startMonitoring()
        })
      }).not.toThrow()
    })

    it('stopMonitoring 不报错', () => {
      const { result } = renderHook(() =>
        useVAD({ stream: null }),
      )
      expect(() => {
        act(() => {
          result.current.stopMonitoring()
        })
      }).not.toThrow()
    })

    it('多次 startMonitoring 安全', () => {
      const { result } = renderHook(() =>
        useVAD({ stream: null }),
      )
      expect(() => {
        act(() => {
          result.current.startMonitoring()
          result.current.startMonitoring()
          result.current.startMonitoring()
        })
      }).not.toThrow()
    })

    it('stopMonitoring 后 isSpeaking 保持 false', () => {
      const { result } = renderHook(() =>
        useVAD({ stream: null }),
      )
      act(() => {
        result.current.startMonitoring()
        result.current.stopMonitoring()
      })
      expect(result.current.isSpeaking).toBe(false)
    })
  })

  describe('带 stream 参数', () => {
    it('传入 mock stream 不报错', () => {
      const mockStream = {} as MediaStream
      const { result } = renderHook(() =>
        useVAD({ stream: mockStream }),
      )
      expect(() => {
        act(() => {
          result.current.startMonitoring()
        })
      }).not.toThrow()
    })

    it('传入 stream + 回调不报错', () => {
      const mockStream = {} as MediaStream
      const onSpeechStart = vi.fn()
      const onSpeechEnd = vi.fn()
      const { result } = renderHook(() =>
        useVAD({
          stream: mockStream,
          onSpeechStart,
          onSpeechEnd,
        }),
      )
      // startMonitoring 内部会尝试 new AudioContext，在 jsdom 会失败
      // 但 try/catch 应捕获错误
      expect(() => {
        act(() => {
          result.current.startMonitoring()
        })
      }).not.toThrow()
      expect(onSpeechStart).not.toHaveBeenCalled()
      expect(onSpeechEnd).not.toHaveBeenCalled()
    })
  })

  describe('组件卸载', () => {
    it('卸载时不报错', () => {
      const { result, unmount } = renderHook(() =>
        useVAD({ stream: null }),
      )
      act(() => {
        result.current.startMonitoring()
      })
      expect(() => unmount()).not.toThrow()
    })
  })
})
