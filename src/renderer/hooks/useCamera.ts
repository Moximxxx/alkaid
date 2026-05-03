// 摄像头Hook

import { useState, useEffect, useCallback } from 'react'
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
}

export const useCamera = (options: UseCameraOptions = {}): UseCameraReturn => {
  const { autoStart = false, deviceId } = options
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // 初始化
  useEffect(() => {
    fetchDevices()
    if (autoStart) {
      start()
    }
    return () => {
      stop()
    }
  }, [autoStart, fetchDevices, start, stop])

  return {
    stream,
    devices,
    isReady,
    error,
    start,
    stop,
    switchDevice,
    captureFrame,
  }
}

export default useCamera
