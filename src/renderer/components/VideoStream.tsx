// 视频流组件

import React, { useRef, useEffect } from 'react'
import { useCamera } from '@/hooks/useCamera'

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
  const { stream, start, stop, captureFrame, isReady } = useCamera({ autoStart: true })

  // 将 stream 绑定到 video 元素
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // 自动捕获
  useEffect(() => {
    if (autoCapture && onFrameCapture && videoRef.current) {
      const interval = setInterval(() => {
        const frame = captureFrame(videoRef.current || undefined)
        if (frame) {
          onFrameCapture(frame)
        }
      }, captureInterval)
      return () => clearInterval(interval)
    }
  }, [autoCapture, captureInterval, onFrameCapture, captureFrame])

  const handleCapture = () => {
    const frame = captureFrame(videoRef.current || undefined)
    if (frame && onFrameCapture) {
      onFrameCapture(frame)
    }
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
      <button
        onClick={handleCapture}
        className="absolute bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        disabled={!isReady}
      >
        拍照
      </button>
    </div>
  )
}

export default VideoStream
