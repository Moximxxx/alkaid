import { renderHook, act } from '@testing-library/react'
import { useAI } from '../ai'
import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
  vi.stubEnv('VITE_OPENAI_API_KEY', 'sk-test')
  mockFetch.mockReset()
  mockFetch.mockImplementation((_url, options) => {
    if (options?.signal?.aborted) {
      return Promise.reject(new DOMException('The operation was aborted', 'AbortError'))
    }
    return Promise.resolve({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n') })
            .mockResolvedValueOnce({ done: true }),
        }),
      },
    })
  })
})

describe('useAI', () => {
  it('initial state', () => {
    const { result } = renderHook(() => useAI({ provider: 'openai', model: 'gpt-4' }))
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.messages).toEqual([])
  })

  it('sendMessage sets loading and sends request', async () => {
    const { result } = renderHook(() => useAI({ provider: 'openai', model: 'gpt-4' }))
    await act(async () => { await result.current.sendMessage('hello') })
    expect(mockFetch).toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
  })

  it('clearMessages empties messages', () => {
    const { result } = renderHook(() => useAI({ provider: 'openai', model: 'gpt-4' }))
    act(() => { result.current.clearMessages() })
    expect(result.current.messages).toEqual([])
  })

  it('setMessageUpdateCallback works', () => {
    const { result } = renderHook(() => useAI({ provider: 'openai', model: 'gpt-4' }))
    const cb = vi.fn()
    act(() => { result.current.setMessageUpdateCallback(cb) })
  })

  it('throws on unknown provider', async () => {
    const { result } = renderHook(() => useAI({ provider: 'unknown', model: 'x' }))
    await expect(result.current.sendMessage('test')).rejects.toThrow()
  })
})

describe('useAI advanced', () => {
  it('handles abort signal', async () => {
    const ctrl = new AbortController()
    ctrl.abort()
    const { result } = renderHook(() => useAI({ provider: 'openai', model: 'gpt-4' }))
    await expect(result.current.sendMessage('test', undefined, undefined, ctrl.signal)).rejects.toThrow()
  })

  it('calls onComplete after streaming', async () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useAI({ provider: 'openai', model: 'gpt-4', onComplete }))
    await act(async () => { await result.current.sendMessage('hello') })
    expect(onComplete).toHaveBeenCalled()
  })

  it('invokes messageUpdateCallback during streaming', async () => {
    const cb = vi.fn()
    const { result } = renderHook(() => useAI({ provider: 'openai', model: 'gpt-4' }))
    act(() => { result.current.setMessageUpdateCallback(cb) })
    await act(async () => { await result.current.sendMessage('hello') })
    expect(cb).toHaveBeenCalled()
  })
})
