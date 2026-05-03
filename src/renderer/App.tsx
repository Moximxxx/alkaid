// 主应用组件

import React, { useState, useCallback } from 'react'
import { VideoStream } from './components/VideoStream'
import { Recognition } from './components/Recognition'
import { Chat } from './components/Chat'
import { VideoChat } from './components/VideoChat'
import { useCamera } from './hooks/useCamera'
import { useAI } from './hooks/useAI'
import { visionService } from '@/main/services/vision'
import type { RecognitionResult } from '@shared/types'

type AppMode = 'normal' | 'video-chat'

export const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('normal')
  
  useCamera({ autoStart: true })
  const { messages, loading: aiLoading, sendMessage, clearMessages } = useAI()

  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null)
  const [recognizing, setRecognizing] = useState(false)
  const [currentImage, setCurrentImage] = useState<string | null>(null)

  // 处理帧捕获
  const handleFrameCapture = useCallback(async (frame: string) => {
    setCurrentImage(frame)
    setRecognizing(true)

    try {
      const result = await visionService.recognize(frame)
      setRecognitionResult(result)
    } catch (error) {
      console.error('识别失败:', error)
    } finally {
      setRecognizing(false)
    }
  }, [])

  // 发送消息（附带图片）
  const handleSendMessage = useCallback(async (content: string) => {
    await sendMessage(content, currentImage || undefined)
  }, [sendMessage, currentImage])

  // 将识别结果作为消息发送
  const handleAskAboutScene = useCallback(async () => {
    if (!recognitionResult) return

    const description = recognitionResult.scene.description || '未识别到场景'
    const objects = recognitionResult.objects.map(o => o.name).join('、')
    const prompt = `请描述一下这个场景：${description}。检测到的物体有：${objects || '无'}。请用中文回答。`

    await sendMessage(prompt, currentImage || undefined)
  }, [recognitionResult, currentImage, sendMessage])

  // 切换模式
  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'normal' ? 'video-chat' : 'normal')
  }, [])

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 标题栏 */}
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">摇光 - 摄像头AI助手</h1>
        <button
          onClick={toggleMode}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode === 'video-chat'
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {mode === 'video-chat' ? '退出视频通话' : '进入视频通话'}
        </button>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 overflow-hidden">
        {mode === 'normal' ? (
          /* 普通模式 */
          <div className="h-full flex">
            {/* 左侧：视频和识别 */}
            <div className="w-1/2 flex flex-col p-4 gap-4">
              {/* 视频流 */}
              <div className="flex-1">
                <VideoStream
                  onFrameCapture={handleFrameCapture}
                  autoCapture={false}
                />
              </div>

              {/* 识别结果 */}
              <div className="h-48 overflow-y-auto">
                <Recognition
                  result={recognitionResult}
                  loading={recognizing}
                />
                {recognitionResult && (
                  <button
                    onClick={handleAskAboutScene}
                    className="mt-2 w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    询问AI关于这个场景
                  </button>
                )}
              </div>
            </div>

            {/* 右侧：对话 */}
            <div className="w-1/2 border-l bg-white flex flex-col">
              <div className="px-4 py-3 border-b flex justify-between items-center">
                <h2 className="font-semibold text-gray-700">AI 对话</h2>
                <button
                  onClick={clearMessages}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  清空对话
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <Chat
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  loading={aiLoading}
                />
              </div>
            </div>
          </div>
        ) : (
          /* 视频通话模式 */
          <VideoChat />
        )}
      </main>
    </div>
  )
}

export default App
