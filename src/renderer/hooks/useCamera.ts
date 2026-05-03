// 摄像头Hook

import { useState, useEffect, useCallback, useRef } from 'react'
import { cameraService } from '@/main/services/camera'

interface UseCameraOptions {
  autoStart?: boolean
  deviceId?: string
}

interface UseCameraReturn {
  stream: MediaStream | null
  devices: MediaDeviceInfo[]
  isReady: boolean
  error: string | null
  start: () => Promise<boolean>
  stop: () => void
  switchDevice: (deviceId: string) => Promise<boolean>
  captureFrame: () => string | null
  startAutoCapture: (interval: number, onCapture: (frame: string) => void) => void
  stopAutoCapture: () => void
  isCapturing: boolean
}

export const useCamera = (options: UseCameraOptions = {}): UseCameraReturn => {
  const { autoStart = false, deviceId } = options
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const captureTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const captureCallbackRef = useRef<((frame: string) => void) | null>(null)

  // 获取设备列表
  const fetchDevices = useCallback(async () => {
    try {
      const deviceList = await cameraService.getDevices()
      setDevices(deviceList)
    } catch (err) {
      console.error('获取设备列表失败:', err)
    }
  }, [])

  // 启动摄像头
  const start = useCallback(async () => {
    try {
      setError(null)
      const success = await cameraService.initialize(deviceId)
      if (success) {
        const newStream = cameraService.getStream()
        setStream(newStream)
        setIsReady(true)
        return true
      } else {
        setError('摄像头初始化失败')
        return false
      }
    } catch (err: any) {
      setError(err.message || '摄像头启动失败')
      return false
    }
  }, [deviceId])

  // 停止摄像头
  const stop = useCallback(() => {
    cameraService.stop()
    setStream(null)
    setIsReady(false)
  }, [])

  // 切换设备
  const switchDevice = useCallback(async (newDeviceId: string) => {
    stop()
    const success = await cameraService.initialize(newDeviceId)
    if (success) {
      const newStream = cameraService.getStream()
      setStream(newStream)
      setIsReady(true)
      return true
    }
    return false
  }, [stop])

  // 捕获帧
  const captureFrame = useCallback(() => {
    return cameraService.captureFrame()
  }, [])

  // 开始自动捕获
  const startAutoCapture = useCallback((interval: number, onCapture: (frame: string) => void) => {
    stopAutoCapture()
    captureCallbackRef.current = onCapture
    setIsCapturing(true)
    
    captureTimerRef.current = setInterval(() => {
      const frame = cameraService.captureFrame()
      if (frame && captureCallbackRef.current) {
        captureCallbackRef.current(frame)
      }
    }, interval)
  }, [])

  // 停止自动捕获
  const stopAutoCapture = useCallback(() => {
    if (captureTimerRef.current) {
      clearInterval(captureTimerRef.current)
      captureTimerRef.current = null
    }
    captureCallbackRef.current = null
    setIsCapturing(false)
  }, [])

  // 初始化
  useEffect(() => {
    fetchDevices()
    if (autoStart) {
      start()
    }
    return () => {
      stopAutoCapture()
      stop()
    }
  }, [autoStart, fetchDevices, start, stop, stopAutoCapture])

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
