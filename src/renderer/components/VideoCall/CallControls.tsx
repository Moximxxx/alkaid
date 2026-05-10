import React from 'react'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Camera,
  CameraOff,
  MessageSquare,
  Phone,
} from 'lucide-react'

export interface CallControlsProps {
  micEnabled: boolean
  speakerEnabled: boolean
  cameraEnabled: boolean
  chatOpen: boolean
  onToggleMic: () => void
  onToggleSpeaker: () => void
  onToggleCamera: () => void
  onToggleChat: () => void
  onHangup: () => void
  isConnected: boolean
}

export function CallControls({
  micEnabled,
  speakerEnabled,
  cameraEnabled,
  chatOpen,
  onToggleMic,
  onToggleSpeaker,
  onToggleCamera,
  onToggleChat,
  onHangup,
  isConnected,
}: CallControlsProps) {
  if (!isConnected) return null

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-8 pt-16">
      <div className="backdrop-blur-sm">
        <div className="flex justify-center items-center gap-6 sm:gap-8 px-4">
          {/* 麦克风 */}
          <button
            onClick={onToggleMic}
            className={`rounded-full p-3 sm:p-4 transition-all ${
              micEnabled
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-red-500/80 text-white hover:bg-red-600'
            }`}
            title={micEnabled ? '关闭麦克风' : '开启麦克风'}
          >
            {micEnabled ? <Mic className="h-5 w-5 sm:h-6 sm:w-6" /> : <MicOff className="h-5 w-5 sm:h-6 sm:w-6" />}
          </button>

          {/* 扬声器 */}
          <button
            onClick={onToggleSpeaker}
            className={`rounded-full p-3 sm:p-4 transition-all ${
              speakerEnabled
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-red-500/80 text-white hover:bg-red-600'
            }`}
            title={speakerEnabled ? '关闭扬声器' : '开启扬声器'}
          >
            {speakerEnabled ? <Volume2 className="h-5 w-5 sm:h-6 sm:w-6" /> : <VolumeX className="h-5 w-5 sm:h-6 sm:w-6" />}
          </button>

          {/* 摄像头 */}
          <button
            onClick={onToggleCamera}
            className={`rounded-full p-3 sm:p-4 transition-all ${
              cameraEnabled
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-red-500/80 text-white hover:bg-red-600'
            }`}
            title={cameraEnabled ? '关闭摄像头' : '开启摄像头'}
          >
            {cameraEnabled ? <Camera className="h-5 w-5 sm:h-6 sm:w-6" /> : <CameraOff className="h-5 w-5 sm:h-6 sm:w-6" />}
          </button>

          {/* 聊天 */}
          <button
            onClick={onToggleChat}
            className={`rounded-full p-3 sm:p-4 transition-all ${
              chatOpen
                ? 'bg-blue-500/80 text-white hover:bg-blue-600'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            title={chatOpen ? '关闭聊天' : '打开聊天'}
          >
            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* 挂断 */}
          <button
            onClick={onHangup}
            className="rounded-full p-4 sm:p-5 bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/40 transition-all hover:scale-105"
            title="结束通话"
          >
            <Phone className="h-6 w-6 sm:h-7 sm:w-7 rotate-135" />
          </button>
        </div>
      </div>
    </div>
  )
}
