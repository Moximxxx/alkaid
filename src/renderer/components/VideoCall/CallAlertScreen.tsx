import React from 'react'
import { Phone, PhoneOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface CallAlertScreenProps {
  aiName?: string
  aiAvatar?: string
  onAccept: () => void
  onReject: () => void
  isVisible: boolean
}

export function CallAlertScreen({
  aiName = '摇光',
  aiAvatar,
  onAccept,
  onReject,
  isVisible,
}: CallAlertScreenProps) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center">
      {/* 呼吸光晕动画 */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 animate-pulse-ring flex items-center justify-center shadow-lg shadow-blue-500/30">
          {aiAvatar ? (
            <img
              src={aiAvatar}
              alt={aiName}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <span className="text-5xl font-bold text-white">AI</span>
          )}
        </div>
        {/* 外圈光晕 */}
        <div className="absolute -inset-4 rounded-full border-2 border-blue-400/30 animate-pulse-ring" />
        <div className="absolute -inset-8 rounded-full border border-blue-400/20 animate-pulse-ring" style={{ animationDelay: '0.3s' }} />
      </div>

      {/* AI 名称和状态 */}
      <h2 className="text-2xl font-semibold text-white mb-1">{aiName}</h2>
      <p className="text-base text-gray-400 mb-12">来电中...</p>

      {/* 接听/拒绝按钮 */}
      <div className="flex items-center gap-16">
        <div className="flex flex-col items-center gap-2">
          <Button
            onClick={onReject}
            className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
          >
            <PhoneOff className="h-7 w-7" />
          </Button>
          <span className="text-xs text-gray-400">拒绝</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Button
            onClick={onAccept}
            className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30"
          >
            <Phone className="h-7 w-7" />
          </Button>
          <span className="text-xs text-gray-400">接听</span>
        </div>
      </div>
    </div>
  )
}
