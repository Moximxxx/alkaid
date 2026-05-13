// 摄像头Hook - 渲染进程直接使用浏览器 API

import { useState, useEffect, useCallback, useRef } from 'react'
import { logger } from '@shared/logger'

// 独立的设备枚举函数，可被外部调用
export async function fetchDevices(): Promise<MediaDeviceInfo[]> {
  try {
    const allDevices = await navigator.mediaDevices.enumerateDevices()
    return allDevices.filter(d => d.kind === 'videoinput')
  } catch (err) {
    logger.error('获取设备列表失败:', err)
    return []
  }
}

interface UseCameraOptions {
  autoStart?: boolean
  deviceId?: string
  audio?: boolean
}

interface UseCameraReturn {
  stream: MediaStream | null
  devices: MediaDeviceInfo[]
  isReady: boolean
  error: string | null
  start: () => Promise<boolean>
  stop: () => void
  switchDevice: (deviceId: string) => Promise<boolean>
  captureFrame: (videoElement?: HTMLVideoElement) => string | null
  startAutoCapture: (interval: number, onCapture: (frame: string) => void) => void
  stopAutoCapture: () => void
  isCapturing: boolean
}

export const useCamera = (options: UseCameraOptions = {}): UseCameraReturn => {
  const { autoStart = false, deviceId, audio = false } = options
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const captureTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const captureCallbackRef = useRef<((frame: string) => void) | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // 启动摄像头
  const start = useCallback(async () => {
    try {
      setError(null)
      // 停止已有流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        },
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
      }

      const newStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(newStream)
      streamRef.current = newStream
      setIsReady(true)
      return true
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '摄像头启动失败')
      return false
    }
  }, [deviceId])

  // 停止摄像头
  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    streamRef.current = null
    setStream(null)
    setIsReady(false)
  }, [])

  // 切换设备
  const switchDevice = useCallback(async (newDeviceId: string) => {
    // 停止当前流
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    streamRef.current = null
    setStream(null)
    setIsReady(false)

    try {
      const constraints: MediaStreamConstraints = {
        video: { deviceId: { exact: newDeviceId } },
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
      }
      const newStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(newStream)
      streamRef.current = newStream
      setIsReady(true)
      return true
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '切换摄像头失败')
      return false
    }
  }, [audio])

  // 捕获帧
  const captureFrame = useCallback((videoElement?: HTMLVideoElement): string | null => {
    if (!streamRef.current) return null

    const video = videoElement || (() => {
      const v = document.createElement('video')
      v.srcObject = streamRef.current
      v.play()
      return v
    })()

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.8)
  }, [])

  // 使用 ref 保持 captureFrame 引用最新，避免定时器中的闭包问题
  const captureFrameRef = useRef(captureFrame)
  captureFrameRef.current = captureFrame

  // 停止自动捕获
  const stopAutoCapture = useCallback(() => {
    if (captureTimerRef.current) {
      clearInterval(captureTimerRef.current)
      captureTimerRef.current = null
    }
    captureCallbackRef.current = null
    setIsCapturing(false)
  }, [])

  // 开始自动捕获
  const startAutoCapture = useCallback((interval: number, onCapture: (frame: string) => void) => {
    stopAutoCapture()
    captureCallbackRef.current = onCapture
    setIsCapturing(true)

    captureTimerRef.current = setInterval(() => {
      const frame = captureFrameRef.current()
      if (frame && captureCallbackRef.current) {
        captureCallbackRef.current(frame)
      }
    }, interval)
  }, [stopAutoCapture])

  // 初始化
  useEffect(() => {
    fetchDevices().then(setDevices)
    if (autoStart) {
      start()
    }
    return () => {
      stopAutoCapture()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  return {
    stream,
    devices,
    isReady,
    error,
    start,
    stop,
    switchDevice,
    captureFrame,
    startAutoCapture,
    stopAutoCapture,
    isCapturing,
  }
}

export default useCamera
