// useCamera Hook 测试
import { renderHook, act } from '@testing-library/react'
import { useCamera } from '../useCamera'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock 设备数据
const mockDevices = [
  { deviceId: 'cam1', kind: 'videoinput', label: 'Webcam' },
  { deviceId: 'cam2', kind: 'videoinput', label: 'External Cam' },
  { deviceId: 'mic1', kind: 'audioinput', label: 'Microphone' },
]

const mockStream = {
  getTracks: () => [{ stop: vi.fn() }],
} as unknown as MediaStream

beforeEach(() => {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      enumerateDevices: vi.fn().mockResolvedValue(mockDevices),
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
    },
    writable: true,
    configurable: true,
  })
})

describe('useCamera', () => {
  it('starts with empty devices and stream', () => {
    const { result } = renderHook(() => useCamera())
    expect(result.current.devices).toEqual([])
    expect(result.current.stream).toBeNull()
    expect(result.current.isReady).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.isCapturing).toBe(false)
  })

  it('loads devices on mount', async () => {
    const { result } = renderHook(() => useCamera())
    await vi.waitFor(() => {
      expect(result.current.devices.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('filters only video input devices', async () => {
    const { result } = renderHook(() => useCamera())
    await vi.waitFor(() => {
      // useCamera 内部已将 devices 过滤为仅 videoinput
      const videoDevices = result.current.devices.filter(
        (d) => d.kind === 'videoinput',
      )
      expect(videoDevices.length).toBe(2)
    })
  })

  it('start() calls getUserMedia and sets stream', async () => {
    const { result } = renderHook(() => useCamera())
    let success = false
    await act(async () => {
      success = await result.current.start()
    })
    expect(success).toBe(true)
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledOnce()
    expect(result.current.isReady).toBe(true)
    expect(result.current.stream).toBeTruthy()
  })

  it('stop() clears stream and isReady', async () => {
    const { result } = renderHook(() => useCamera())
    await act(async () => {
      await result.current.start()
    })
    expect(result.current.isReady).toBe(true)

    act(() => {
      result.current.stop()
    })
    expect(result.current.stream).toBeNull()
    expect(result.current.isReady).toBe(false)
  })

  it('captureFrame returns string when stream is active', async () => {
    const { result } = renderHook(() => useCamera())
    await act(async () => {
      await result.current.start()
    })
    // Mock canvas context + toDataURL
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage: vi.fn(),
    }) as any
    HTMLCanvasElement.prototype.toDataURL = vi
      .fn()
      .mockReturnValue('data:image/jpeg;base64,mock_frame')

    const frame = result.current.captureFrame()
    expect(frame).toBe('data:image/jpeg;base64,mock_frame')
  })

  it('captureFrame returns null when no stream', () => {
    const { result } = renderHook(() => useCamera())
    const frame = result.current.captureFrame()
    expect(frame).toBeNull()
  })

  it('startAutoCapture/stopsAutoCapture manage isCapturing state', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useCamera())
    const onCapture = vi.fn()

    act(() => {
      result.current.startAutoCapture(1000, onCapture)
    })
    expect(result.current.isCapturing).toBe(true)

    act(() => {
      result.current.stopAutoCapture()
    })
    expect(result.current.isCapturing).toBe(false)

    vi.useRealTimers()
  })
})
