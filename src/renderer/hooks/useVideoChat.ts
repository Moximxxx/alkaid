// 视频通话Hook

import { useState, useCallback, useRef } from 'react'
import { useCamera } from './useCamera'
import { useAI } from '../services/ai'
import { useSettings } from './useSettings'
// import { visionService } from '@/main/services/vision'
import type { RecognitionResult } from '@shared/types'

interface UseVideoChatOptions {
  captureInterval?: number  // 捕获间隔（毫秒）
  autoAnalyze?: boolean     // 自动分析画面
}

interface UseVideoChatReturn {
  // 摄像头状态
  stream: MediaStream | null
  isCameraReady: boolean
  cameraError: string | null
  
  // 视频通话状态
  isActive: boolean
  isAnalyzing: boolean
  
  // AI 对话
  messages: any[]
  aiLoading: boolean
  
  // 识别结果
  lastRecognition: RecognitionResult | null
  
  // 控制方法
  start: () => Promise<void>
  stop: () => void
  sendMessage: (content: string) => Promise<void>
  captureAndAnalyze: () => Promise<void>
}

export const useVideoChat = (options: UseVideoChatOptions = {}): UseVideoChatReturn => {
  const { captureInterval = 3000, autoAnalyze = true } = options
  
  const {
    stream,
    isReady: isCameraReady,
    error: cameraError,
    start: startCamera,
    stop: stopCamera,
    captureFrame,
    startAutoCapture,
    stopAutoCapture,
  } = useCamera({ autoStart: false })
  
  const { settings } = useSettings()

  const {
    messages,
    loading: aiLoading,
    sendMessage: sendAIMessage,
  } = useAI({
    provider: settings.textProvider,
    apiKey: settings.textApiKey,
    model: settings.textModel,
  })
  
  const [isActive, setIsActive] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastRecognition, setLastRecognition] = useState<RecognitionResult | null>(null)
  
  const analyzingRef = useRef(false)

  // 分析当前画面
  const analyzeFrame = useCallback(async (frame: string) => {
    if (analyzingRef.current) return
    
    analyzingRef.current = true
    setIsAnalyzing(true)
    
    try {
      // 调用图像识别
      // const result = await visionService.recognize(frame)
      // setLastRecognition(result)
      
      // 如果开启了自动分析，将结果发送给AI
      if (autoAnalyze) {
        // const objects = result.objects.map((o: { name: string }) => o.name).join('、')
        // const scene = result.scene.description || '未识别到场景'
        
        // const prompt = `我正在看这个画面：${scene}。${objects ? `看到了：${objects}。` : ''}请简短描述你在画面中看到的内容。`
        
        // await sendAIMessage(prompt, frame)
      }
    } catch (error) {
      console.error('分析画面失败:', error)
    } finally {
      analyzingRef.current = false
      setIsAnalyzing(false)
    }
  }, [autoAnalyze, sendAIMessage])

  // 开始视频通话
  const start = useCallback(async () => {
    const success = await startCamera()
    if (!success) return
    
    setIsActive(true)
    
    // 开始定时捕获
    startAutoCapture(captureInterval, (frame) => {
      analyzeFrame(frame)
    })
  }, [startCamera, startAutoCapture, captureInterval, analyzeFrame])

  // 停止视频通话
  const stop = useCallback(() => {
    stopAutoCapture()
    stopCamera()
    setIsActive(false)
    setLastRecognition(null)
  }, [stopAutoCapture, stopCamera])

  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    const frame = captureFrame()
    await sendAIMessage(content, frame || undefined)
  }, [captureFrame, sendAIMessage])

  // 手动捕获并分析
  const captureAndAnalyze = useCallback(async () => {
    const frame = captureFrame()
    if (frame) {
      await analyzeFrame(frame)
    }
  }, [captureFrame, analyzeFrame])

  return {
    stream,
    isCameraReady,
    cameraError,
    isActive,
    isAnalyzing,
    messages,
    aiLoading,
    lastRecognition,
    start,
    stop,
    sendMessage,
    captureAndAnalyze,
  }
}

export default useVideoChat
