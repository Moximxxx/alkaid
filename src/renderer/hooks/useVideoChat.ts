// 视频通话 Hook — 集成多模态异步并行管线
// Camera → VisionPipeline + STT → ContextMerge → LLM(可中断) → TTS
// 包含 VAD 语音活动检测 + 中断控制器

import { useState, useCallback, useRef, useEffect } from 'react'
import { useCamera } from './useCamera'
import { useAI } from '../services/ai'
import { useSpeechRecognition } from './useSpeechRecognition'
import { useTTS } from './useTTS'
import { useVAD } from './useVAD'
import { createVisionPipeline } from '../services/vision-pipeline'
import { InterruptController } from '../services/interrupt-controller'
import { mergeContext } from '../services/context-merge'
import type { ChatMessage, PipelineStatus } from '@shared/types'
import { PIPELINE_DEFAULTS } from '@shared/constants'
import type { Settings } from './useSettings'
import { logger } from '@shared/logger'

export interface UseVideoChatOptions {
  settings: Settings
  onAIStatusChange?: (status: 'listening' | 'thinking' | 'speaking' | 'idle') => void
  onMessageUpdate?: (messages: ChatMessage[]) => void
}

export interface UseVideoChatReturn {
  // 摄像头
  stream: MediaStream | null
  isCameraReady: boolean
  cameraError: string | null
  startCamera: () => Promise<boolean>
  stopCamera: () => void
  captureFrame: (videoElement?: HTMLVideoElement) => string | null
  startAutoCapture: (interval: number, onCapture: (frame: string) => void) => void
  stopAutoCapture: () => void

  // AI 对话
  messages: ChatMessage[]
  loading: boolean
  sendMessage: (content: string, image?: string) => Promise<void>
  clearMessages: () => void

  // 语音识别（STT）
  isListening: boolean
  transcript: string
  interimTranscript: string
  isSpeechSupported: boolean
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void

  // 语音合成（TTS）
  speak: (text: string) => void
  stopTTS: () => void
  isTTSSpeaking: boolean
  isTTSSupported: boolean

  // VAD 语音活动检测
  isVADSpeaking: boolean
  isVADSupported: boolean
  startVAD: () => void
  stopVAD: () => void

  // 管线控制
  pipelineStatus: PipelineStatus
  isInterrupted: boolean
  interruptAI: () => void
  resetInterrupt: () => void
  startVisionPipeline: () => void
  stopVisionPipeline: () => void
  setVisionCaptureInterval: (ms: number) => void

  // 分析
  captureAndAnalyze: () => Promise<void>
}

export function useVideoChat(options: UseVideoChatOptions): UseVideoChatReturn {
  const { settings, onAIStatusChange, onMessageUpdate } = options

  // ====== 摄像头 ======
  const {
    stream,
    isReady: isCameraReady,
    error: cameraError,
    start: startCamera,
    stop: stopCamera,
    captureFrame,
    startAutoCapture,
    stopAutoCapture,
    switchDevice,
  } = useCamera({ autoStart: false })

  // ====== AI 对话 ======
  const provider = settings.visionProvider || settings.textProvider
  const apiKey = settings.visionApiKey || settings.textApiKey
  const model = settings.visionModel || settings.textModel

  const {
    messages,
    loading,
    sendMessage: sendAIMessage,
    clearMessages,
    setMessageUpdateCallback,
    abortController: aiAbortController,
  } = useAI({
    provider,
    apiKey,
    model,
    scenario: 'video_call',
    onFirstToken: () => {
      aiStatusRef.current = 'speaking'
      onAIStatusChange?.('speaking')
    },
    onComplete: () => {
      // AI 回复完成后根据 TTS 状态决定
      if (!isTTSSpeakingRef.current) {
        aiStatusRef.current = 'listening'
        onAIStatusChange?.('listening')
      }
    },
  })

  // 注册消息更新回调
  useEffect(() => {
    if (onMessageUpdate) {
      setMessageUpdateCallback(onMessageUpdate)
    }
  }, [onMessageUpdate, setMessageUpdateCallback])

  // ====== 语音识别（STT） ======
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition()

  // ====== 语音合成（TTS） ======
  const {
    speak,
    stop: stopTTS,
    isSpeaking: isTTSSpeaking,
    isSupported: isTTSSupported,
  } = useTTS()
  const isTTSSpeakingRef = useRef(false)
  useEffect(() => {
    isTTSSpeakingRef.current = isTTSSpeaking
  }, [isTTSSpeaking])

  // ====== VAD 语音活动检测 ======
  const {
    isSpeaking: isVADSpeaking,
    isSupported: isVADSupported,
    startMonitoring: startVAD,
    stopMonitoring: stopVAD,
  } = useVAD({ stream })

  // ====== 中断控制器 ======
  const interruptControllerRef = useRef<InterruptController>(
    new InterruptController({
      onInterrupt: () => {
        setIsInterrupted(true)
        aiStatusRef.current = 'listening'
        onAIStatusChange?.('listening')
      },
      onResume: () => {
        setIsInterrupted(false)
      },
    }),
  )
  const [isInterrupted, setIsInterrupted] = useState(false)

  const interruptAI = useCallback(() => {
    interruptControllerRef.current.setAbortController(aiAbortController)
    interruptControllerRef.current.abort()
    stopTTS()
  }, [aiAbortController, stopTTS])

  const resetInterrupt = useCallback(() => {
    interruptControllerRef.current.reset()
  }, [])

  // ====== VAD → Interrupt 联动 ======
  useEffect(() => {
    if (isVADSpeaking) {
      // 用户正在说话 → 中断 AI 回复
      interruptAI()
    }
  }, [isVADSpeaking, interruptAI])

  // ====== AI 状态追踪 ref（用于主动观察判断） ======
  const aiStatusRef = useRef<'listening' | 'thinking' | 'speaking' | 'idle'>('idle')

  // ====== 视觉管线 ======
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>('stopped')

  const visionPipelineRef = useRef<ReturnType<typeof createVisionPipeline> | null>(null)

  // 主动观察冷却时间（毫秒），避免频繁主动评论
  const OBSERVATION_COOLDOWN_MS = 8000
  const lastObservationTimeRef = useRef<number>(0)

  const startVisionPipeline = useCallback(() => {
    if (visionPipelineRef.current) return

    const pipeline = createVisionPipeline({
      captureInterval: PIPELINE_DEFAULTS.visionCaptureInterval,
      captureFn: () => {
        // 使用 captureFrame 但不需要 videoElement，useCamera 内部会处理
        return captureFrame()
      },
      onFrame: async (frame: string) => {
        // 中断状态时不处理任何帧
        if (interruptControllerRef.current.isInterrupted()) return

        const now = Date.now()
        const currentStatus = aiStatusRef.current

        // ====== 主动观察逻辑 ======
        // 当 AI 处于 idle 且冷却已过 → 主动观察画面并评论
        if (currentStatus === 'idle' && now - lastObservationTimeRef.current > OBSERVATION_COOLDOWN_MS) {
          lastObservationTimeRef.current = now
          aiStatusRef.current = 'thinking'
          onAIStatusChange?.('thinking')
          try {
            await sendAIMessage(
              '我看看你在做什么...',
              frame,
              `vision-${Date.now()}`,
              aiAbortController.signal,
            )
          } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
              // 中断是正常行为
              logger.debug('Active observation aborted')
            } else {
              logger.error('Active observation error:', err)
            }
          }
          return
        }

        // ====== 被动上下文分析（对话进行中时提供视觉上下文）=======
        // 仅在 AI 处于 listening/thinking 状态时提供视觉上下文
        if (currentStatus !== 'listening' && currentStatus !== 'thinking') return

        const mergeResult = mergeContext({
          sttText: transcript,
          latestFrame: frame,
          previousFrames: [],
          conversationHistory: messages,
        })

        if (mergeResult.includedVision) {
          aiStatusRef.current = 'thinking'
          onAIStatusChange?.('thinking')
          try {
            await sendAIMessage(
              mergeResult.promptText,
              mergeResult.image,
              `vision-${Date.now()}`,
              aiAbortController.signal,
            )
          } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
              // 中断是正常行为
              logger.debug('Vision analysis aborted')
            } else {
              logger.error('Vision analysis error:', err)
            }
          }
        }
      },
    })

    visionPipelineRef.current = pipeline
    pipeline.start()
    setPipelineStatus('running')
  }, [captureFrame, transcript, messages, sendAIMessage, aiAbortController, onAIStatusChange])

  const stopVisionPipeline = useCallback(() => {
    if (visionPipelineRef.current) {
      visionPipelineRef.current.stop()
      visionPipelineRef.current = null
    }
    setPipelineStatus('stopped')
  }, [])

  const setVisionCaptureInterval = useCallback((ms: number) => {
    if (visionPipelineRef.current) {
      visionPipelineRef.current.setInterval(ms)
    }
  }, [])

  // ====== AI 回复自动 TTS ======
  const prevMessagesLengthRef = useRef(0)
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'assistant' && lastMsg.content) {
        // 不 TTS 播报视觉分析帧消息（以 vision- 开头的 ID）
        if (!lastMsg.id.startsWith('vision-')) {
          speak(lastMsg.content)
        }
      }
    }
    prevMessagesLengthRef.current = messages.length
  }, [messages, speak])

  // ====== 发送消息（含上下文合并） ======
  const sendMessage = useCallback(async (content: string, image?: string) => {
    const frame = image || captureFrame() || undefined

    const mergeResult = mergeContext({
      userText: content,
      sttText: transcript,
      latestFrame: frame,
      previousFrames: [],
      conversationHistory: messages,
    })

    aiStatusRef.current = 'thinking'
    onAIStatusChange?.('thinking')

    // 重置中断状态
    resetInterrupt()

    try {
      await sendAIMessage(
        mergeResult.promptText,
        mergeResult.image,
        undefined,
        aiAbortController.signal,
      )
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        logger.debug('SendMessage aborted')
      } else {
        throw err
      }
    }
  }, [captureFrame, transcript, messages, sendAIMessage, aiAbortController, onAIStatusChange, resetInterrupt])

  // ====== 手动捕获并分析 ======
  const captureAndAnalyze = useCallback(async () => {
    const frame = captureFrame()
    if (!frame) return

    aiStatusRef.current = 'thinking'
    onAIStatusChange?.('thinking')
    try {
      await sendAIMessage(
        '请简短描述你在画面中看到了什么。',
        frame,
        `vision-${Date.now()}`,
        aiAbortController.signal,
      )
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        logger.debug('CaptureAndAnalyze aborted')
      } else {
        logger.error('CaptureAndAnalyze error:', err)
      }
    }
  }, [captureFrame, sendAIMessage, aiAbortController, onAIStatusChange])

  // ====== 媒体流引用（用于音频轨道替换） ======
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const micSwitchRef = useRef<AbortController | null>(null)

  // 同步 mediaStreamRef 与摄像头流
  useEffect(() => {
    if (stream) {
      mediaStreamRef.current = stream
    }
  }, [stream])

  // ====== 监听摄像头设备变更 ======
  useEffect(() => {
    if (settings.cameraDeviceId && switchDevice) {
      switchDevice(settings.cameraDeviceId)
    }
  }, [settings.cameraDeviceId, switchDevice])

  // ====== 监听麦克风设备变更 ======
  useEffect(() => {
    if (settings.audioDeviceId && mediaStreamRef.current) {
      // 取消前一次未完成的切换
      if (micSwitchRef.current) {
        micSwitchRef.current.abort()
      }
      const controller = new AbortController()
      micSwitchRef.current = controller

      navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: settings.audioDeviceId } }
      }).then(newStream => {
        if (controller.signal.aborted) {
          // 请求已被取消，清理新流
          newStream.getTracks().forEach(t => t.stop())
          return
        }
        const stream = mediaStreamRef.current
        if (!stream) return
        const oldTracks = stream.getAudioTracks()
        oldTracks.forEach(t => t.stop())
        newStream.getAudioTracks().forEach(t => stream.addTrack(t))
      }).catch(err => {
        if (!controller.signal.aborted) {
          logger.error('切换麦克风失败:', err)
        }
      })

      return () => {
        controller.abort()
      }
    }
  }, [settings.audioDeviceId])

  // ====== 清理 ======
  useEffect(() => {
    return () => {
      stopVisionPipeline()
      stopVAD()
    }
  }, [stopVisionPipeline, stopVAD])

  return {
    // 摄像头
    stream,
    isCameraReady,
    cameraError,
    startCamera,
    stopCamera,
    captureFrame,
    startAutoCapture,
    stopAutoCapture,

    // AI
    messages,
    loading,
    sendMessage,
    clearMessages,

    // STT
    isListening,
    transcript,
    interimTranscript,
    isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript,

    // TTS
    speak,
    stopTTS,
    isTTSSpeaking,
    isTTSSupported,

    // VAD
    isVADSpeaking,
    isVADSupported,
    startVAD,
    stopVAD,

    // 管线
    pipelineStatus,
    isInterrupted,
    interruptAI,
    resetInterrupt,
    startVisionPipeline,
    stopVisionPipeline,
    setVisionCaptureInterval,

    // 分析
    captureAndAnalyze,
  }
}

export default useVideoChat
