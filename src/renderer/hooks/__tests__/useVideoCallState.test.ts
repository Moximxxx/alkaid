import { renderHook, act } from '@testing-library/react'
import { useVideoCallState } from '../useVideoCallState'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('useVideoCallState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initial state is idle', () => {
    const { result } = renderHook(() => useVideoCallState())
    expect(result.current.state.callState).toBe('idle')
    expect(result.current.state.aiStatus).toBe('idle')
  })

  it('startCall sets state to calling', () => {
    const { result } = renderHook(() => useVideoCallState())
    act(() => {
      result.current.startCall()
    })
    expect(result.current.state.callState).toBe('calling')
  })

  it('endCall sets state to ended', () => {
    const { result } = renderHook(() => useVideoCallState())
    act(() => {
      result.current.startCall()
    })
    act(() => {
      result.current.endCall()
    })
    expect(result.current.state.callState).toBe('ended')
  })

  it('toggleMic toggles mic enabled', () => {
    const { result } = renderHook(() => useVideoCallState())
    expect(result.current.state.controls.micEnabled).toBe(true)
    act(() => {
      result.current.toggleMic()
    })
    expect(result.current.state.controls.micEnabled).toBe(false)
  })

  it('CONNECTED state starts timer', () => {
    const { result } = renderHook(() => useVideoCallState())
    act(() => {
      result.current.dispatch({ type: 'CONNECTED' })
    })
    expect(result.current.state.callState).toBe('connected')
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.state.duration).toBe(3)
  })

  it('RESET returns to initial state', () => {
    const { result } = renderHook(() => useVideoCallState())
    act(() => {
      result.current.startCall()
    })
    act(() => {
      result.current.toggleMic()
    })
    act(() => {
      result.current.dispatch({ type: 'RESET' })
    })
    expect(result.current.state.callState).toBe('idle')
    expect(result.current.state.controls.micEnabled).toBe(true)
  })
})
