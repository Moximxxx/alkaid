import React from 'react'
import type { AIStatus } from '@shared/types'
import { VIDEO_CALL_DEFAULTS } from '@shared/constants'

export interface AIStatusBarProps {
  aiStatus: AIStatus
  duration: number
  aiName?: string
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function AIStatusBar({
  aiStatus,
  duration,
  aiName = VIDEO_CALL_DEFAULTS.aiName,
}: AIStatusBarProps) {
  const statusText = VIDEO_CALL_DEFAULTS.aiStatusText[aiStatus]
  const isActive = aiStatus === 'speaking' || aiStatus === 'listening'

  return (
    <div className="absolute top-0 left-0 right-0 z-30 h-14 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
      <div className="flex items-center justify-between px-4 h-full">
        {/* 左侧：AI 头像 + 名字 */}
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold ${
              isActive ? 'animate-pulse' : ''
            }`}
          >
            AI
          </div>
          <span className="text-white text-sm font-medium">{aiName}</span>
        </div>

        {/* 中间：状态文字 */}
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          )}
          <span className="text-white/80 text-xs">{statusText}</span>
        </div>

        {/* 右侧：通话时长 */}
        <div className="text-white/80 text-xs tabular-nums">
          {formatDuration(duration)}
        </div>
      </div>
    </div>
  )
}
