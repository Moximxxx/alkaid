import React, { useRef, useEffect, useState, useCallback } from 'react'

export interface LocalPiPProps {
  stream: MediaStream | null
  isVisible: boolean
  muted?: boolean
}

export function LocalPiP({ stream, isVisible, muted = true }: LocalPiPProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const pipRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ right: number; bottom: number } | { left: number; top: number }>({
    right: 16,
    bottom: 96,
  })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const posStartRef = useRef({ left: 0, top: 0 })

  // 绑定视频流
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // 拖拽逻辑
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    // 获取当前元素位置
    const rect = pipRef.current?.getBoundingClientRect()
    if (rect) {
      posStartRef.current = { left: rect.left, top: rect.top }
      dragStartRef.current = { x: e.clientX, y: e.clientY }
    }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    const newLeft = posStartRef.current.left + dx
    const newTop = posStartRef.current.top + dy
    // 限制边界
    const maxX = window.innerWidth - 160
    const maxY = window.innerHeight - 280
    const clampedX = Math.max(0, Math.min(newLeft, maxX))
    const clampedY = Math.max(0, Math.min(newTop, maxY))
    setPosition({ left: clampedX, top: clampedY })
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 绑定全局鼠标事件
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  if (!isVisible || !stream) return null

  const style: React.CSSProperties = 'right' in position
    ? { right: position.right, bottom: position.bottom }
    : { left: position.left, top: position.top }

  return (
    <div
      ref={pipRef}
      className="fixed z-40"
      style={style}
    >
      <div
        className={`w-[140px] sm:w-[160px] aspect-[9/16] rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl bg-black ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="w-full h-full object-cover pointer-events-none"
        />
      </div>
    </div>
  )
}
