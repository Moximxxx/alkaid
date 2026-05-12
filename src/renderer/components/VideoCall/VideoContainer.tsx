import React, { useRef, useEffect } from 'react'

export interface VideoContainerProps {
  stream: MediaStream | null
  isActive: boolean
  children?: React.ReactNode
}

export function VideoContainer({
  stream,
  isActive,
  children,
}: VideoContainerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // 绑定视频流
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* 全屏视频 */}
      {isActive && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-3xl">📷</span>
            </div>
            <p className="text-lg">等待摄像头...</p>
          </div>
        </div>
      )}

      {/* 遮罩层：顶部渐变黑边 */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 via-black/30 to-transparent pointer-events-none" />

      {/* 遮罩层：底部渐变黑边 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none" />

      {/* 子组件（浮层） */}
      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  )
}
