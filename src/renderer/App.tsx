// 主应用组件

import React, { useState, useCallback } from 'react'
import { VideoStream } from './components/VideoStream'
import { Chat } from './components/Chat'
import { VideoChat } from './components/VideoChat'
import { useCamera } from './hooks/useCamera'
import { useAI } from './hooks/useAI'

type AppMode = 'normal' | 'video-chat'

export const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('normal')

  useCamera({ autoStart: true })
  const { messages, loading: aiLoading, sendMessage, clearMessages } = useAI()

  const [currentImage, setCurrentImage] = useState<string | null>(null)

  // 处理帧捕获
  const handleFrameCapture = useCallback((frame: string) => {
    setCurrentImage(frame)
  }, [])

  // 发送消息（附带图片）
  const handleSendMessage = useCallback(async (content: string) => {
    await sendMessage(content, currentImage || undefined)
  }, [sendMessage, currentImage])

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
            {/* 左侧：视频 */}
            <div className="w-1/2 flex flex-col p-4 gap-4">
              {/* 视频流 */}
              <div className="flex-1">
                <VideoStream
                  onFrameCapture={handleFrameCapture}
                  autoCapture={false}
                />
              </div>

              {/* 提示信息 */}
              <div className="h-32 p-4 bg-white rounded-lg border">
                <p className="text-sm text-gray-600">
                  提示：拍摄照片后，AI可以分析图片内容。请在右侧对话框中发送图片进行分析。
                </p>
                {currentImage && (
                  <p className="mt-2 text-sm text-green-600">
                    已捕获图片，可以发送消息让AI分析
                  </p>
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
