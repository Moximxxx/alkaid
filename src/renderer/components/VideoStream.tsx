// 视频流组件

import React, { useRef, useEffect } from 'react'
// import { cameraService } from '@/main/services/camera'

interface VideoStreamProps {
  onFrameCapture?: (frame: string) => void
  autoCapture?: boolean
  captureInterval?: number
}

export const VideoStream: React.FC<VideoStreamProps> = ({
  onFrameCapture,
  autoCapture = false,
  captureInterval = 5000,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // useEffect(() => {
  //   const initCamera = async () => {
  //     const success = await cameraService.initialize()
  //     if (success && videoRef.current) {
  //       cameraService.bindVideoElement(videoRef.current)
  //     }
  //   }

  //   initCamera()

  //   return () => {
  //     cameraService.stop()
  //     if (intervalRef.current) {
  //       clearInterval(intervalRef.current)
  //     }
  //   }
  // }, [])

  // useEffect(() => {
  //   if (autoCapture && onFrameCapture) {
  //     intervalRef.current = setInterval(() => {
  //       const frame = cameraService.captureFrame()
  //       if (frame) {
  //         onFrameCapture(frame)
  //       }
  //     }, captureInterval)
  //   }

  //   return () => {
  //     if (intervalRef.current) {
  //       clearInterval(intervalRef.current)
  //     }
  //   }
  // }, [autoCapture, captureInterval, onFrameCapture])

  const handleCapture = () => {
    // const frame = cameraService.captureFrame()
    // if (frame && onFrameCapture) {
    //   onFrameCapture(frame)
    // }
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full rounded-lg"
      />
      <canvas ref={canvasRef} className="hidden" />
      <button
        onClick={handleCapture}
        className="absolute bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
      >
        拍照
      </button>
    </div>
  )
}

export default VideoStream
