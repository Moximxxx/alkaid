import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useSettings } from "@/hooks/useSettings"
import { useVideoChat } from "@/hooks/useVideoChat"
import { useVideoCallState } from "@/hooks/useVideoCallState"
import { CallAlertScreen } from "@/components/VideoCall/CallAlertScreen"
import { VideoContainer } from "@/components/VideoCall/VideoContainer"
import { LocalPiP } from "@/components/VideoCall/LocalPiP"
import { CallControls } from "@/components/VideoCall/CallControls"
import { AIStatusBar } from "@/components/VideoCall/AIStatusBar"
import { ChatDrawer } from "@/components/VideoCall/ChatDrawer"
import { logger } from '@shared/logger'
import type { AIStatus } from '@shared/types'

export function VideoChatPage() {
  const { settings } = useSettings()
  const [input, setInput] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [autoAnalyze] = useState(false)
  const [ttsEnabled] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // 中断横幅状态（1.5秒自动消失）
  const [showInterruptedBanner, setShowInterruptedBanner] = useState(false)
  const interruptedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 主动观察状态：AI 正在观察画面
  const [isObserving, setIsObserving] = useState(false)

  // 视频通话状态管理
  const {
    state,
    dispatch,
    startCall,
    endCall,
    toggleMic,
    toggleSpeaker,
    toggleCamera,
    toggleChat,
  } = useVideoCallState()

  const { callState, aiStatus, controls } = state

  // AI 状态回调：同步到 useVideoCallState
  const handleAIStatusChange = useCallback((status: AIStatus) => {
    dispatch({ type: 'SET_AI_STATUS', payload: status })
  }, [dispatch])

  // 消息更新回调：用于触发 TTS（已内置于 useVideoChat 中）
  const handleMessageUpdate = useCallback(() => {
    // useVideoChat 内部已处理 TTS 自动朗读
  }, [])

  // 集成新管线
  const {
    stream: cameraStream,
    messages,
    loading,
    sendMessage,
    isListening,
    isTTSSpeaking,
    isVADSupported,
    startVAD,
    stopVAD,
    isInterrupted,
    resetInterrupt,
    startVisionPipeline,
    stopVisionPipeline,
    startCamera,
    stopCamera,
  } = useVideoChat({
    settings,
    onAIStatusChange: handleAIStatusChange,
    onMessageUpdate: handleMessageUpdate,
  })

  // 绑定摄像头流到 video 元素（用于 captureFrame 取帧）
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream
    }
  }, [cameraStream])

  // 自动分析管线：连接后启动视觉管线
  useEffect(() => {
    if (autoAnalyze && callState === 'connected') {
      startVisionPipeline()
    } else {
      stopVisionPipeline()
    }
    return () => {
      stopVisionPipeline()
    }
  }, [autoAnalyze, callState, startVisionPipeline, stopVisionPipeline])

  // 监听 AI 语音状态（补充中断状态）
  useEffect(() => {
    if (isInterrupted) {
      dispatch({ type: 'SET_AI_STATUS', payload: 'listening' })
      // 显示中断横幅，1.5秒后自动消失
      setShowInterruptedBanner(true)
      if (interruptedTimerRef.current) {
        clearTimeout(interruptedTimerRef.current)
      }
      interruptedTimerRef.current = setTimeout(() => {
        setShowInterruptedBanner(false)
        interruptedTimerRef.current = null
      }, 1500)
    } else if (isTTSSpeaking) {
      dispatch({ type: 'SET_AI_STATUS', payload: 'speaking' })
      setIsObserving(false)
    } else if (isListening) {
      dispatch({ type: 'SET_AI_STATUS', payload: 'listening' })
    } else if (loading) {
      dispatch({ type: 'SET_AI_STATUS', payload: 'thinking' })
      // 检测是否为主动观察（消息列表最后一条以 vision- 开头且 AI 处于 thinking）
      const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null
      if (lastMsg && lastMsg.id.startsWith('vision-') && lastMsg.role === 'assistant') {
        setIsObserving(true)
      }
    } else {
      dispatch({ type: 'SET_AI_STATUS', payload: 'idle' })
      setIsObserving(false)
    }
  }, [isTTSSpeaking, isListening, loading, isInterrupted, messages, dispatch])

  // 启动 VAD 监控（通话连接后）
  useEffect(() => {
    if (callState === 'connected' && isVADSupported) {
      startVAD()
    } else {
      stopVAD()
    }
    return () => {
      stopVAD()
    }
  }, [callState, isVADSupported, startVAD, stopVAD])

  // AI 回复后自动朗读（仅在 TTS 启用时）
  useEffect(() => {
    if (ttsEnabled && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'assistant' && lastMsg.content && !lastMsg.id.startsWith('vision-')) {
        // TTS 朗读由 useVideoChat 内部处理
        // 此处不再重复调用 speak
      }
    }
  }, [messages, ttsEnabled])

  // 中断时停止 TTS
  useEffect(() => {
    if (isInterrupted) {
      // useVideoChat 内部已处理 stopTTS
    }
  }, [isInterrupted])

  const handleSend = async () => {
    if (!input.trim()) return
    try {
      await sendMessage(input, image || undefined)
      setInput("")
      setImage(null)
    } catch (error) {
      logger.error("发送失败:", error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 拒绝来电
  const handleRejectCall = useCallback(() => {
    // 保持在 idle 状态
  }, [])

  // 接听逻辑：打开摄像头 → 连接 → 通话中
  const handleAccept = useCallback(async () => {
    startCall()
    const success = await startCamera()
    if (success) {
      dispatch({ type: 'CONNECTED' })
    } else {
      dispatch({ type: 'END_CALL' })
      setTimeout(() => {
        dispatch({ type: 'RESET' })
      }, 1000)
    }
  }, [startCall, startCamera, dispatch])

  // 挂断逻辑
  const handleEndCall = useCallback(() => {
    stopCamera()
    stopVisionPipeline()
    stopVAD()
    resetInterrupt()
    endCall()
    setImage(null)
    setTimeout(() => {
      dispatch({ type: 'RESET' })
    }, 1500)
  }, [stopCamera, stopVisionPipeline, stopVAD, resetInterrupt, endCall, dispatch])

  const showVideo = callState !== 'idle'

  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      {/* 来电画面 */}
      <CallAlertScreen
        isVisible={callState === 'idle'}
        onAccept={handleAccept}
        onReject={handleRejectCall}
      />

      {/* 全屏视频容器（通话中可见） */}
      {showVideo && (
        <VideoContainer
          stream={cameraStream}
          isActive={callState === 'connected'}
        >
          {/* AI 状态栏 */}
          <AIStatusBar
            aiStatus={aiStatus}
            duration={state.duration}
          />

          {/* 主动观察指示器 */}
          {isObserving && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-indigo-500/80 text-white text-xs font-medium px-3 py-1 rounded-full animate-pulse">
              摇光正在观察你的画面...
            </div>
          )}

          {/* 中断指示器（1.5秒自动消失） */}
          {showInterruptedBanner && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-yellow-500/90 text-black text-xs font-medium px-3 py-1 rounded-full">
              已打断
            </div>
          )}

          {/* 本地摄像头画面（PIP） */}
          <LocalPiP
            stream={cameraStream}
            isVisible={controls.isPipMode && cameraStream !== null && callState === 'connected'}
          />

          {/* 底部控制栏 */}
          <CallControls
            micEnabled={controls.micEnabled}
            speakerEnabled={controls.speakerEnabled}
            cameraEnabled={controls.cameraEnabled}
            chatOpen={controls.chatOpen}
            onToggleMic={toggleMic}
            onToggleSpeaker={toggleSpeaker}
            onToggleCamera={toggleCamera}
            onToggleChat={toggleChat}
            onHangup={handleEndCall}
            isConnected={callState === 'connected'}
          />
        </VideoContainer>
      )}

      {/* 聊天侧栏 */}
      <ChatDrawer
        messages={messages}
        loading={loading}
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        onKeyDown={handleKeyDown}
        isOpen={controls.chatOpen}
        onToggle={toggleChat}
      />
    </div>
  )
}
