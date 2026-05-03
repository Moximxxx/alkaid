// 视频通话组件

import React, { useEffect, useRef, useState } from 'react'
import { useVideoChat } from '../hooks/useVideoChat'
import { Recognition } from './Recognition'

export const VideoChat: React.FC = () => {
  const {
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
  } = useVideoChat({ captureInterval: 3000, autoAnalyze: true })

  const videoRef = useRef<HTMLVideoElement>(null)
  const [inputMessage, setInputMessage] = useState('')

  // 绑定视频流
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // 发送消息
  const handleSendMessage = async (content: string) => {
    await sendMessage(content)
    setInputMessage('')
  }

  // 表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim()) {
      handleSendMessage(inputMessage.trim())
    }
  }

  return (
    <div className="h-full flex">
      {/* 左侧：视频画面 */}
      <div className="w-1/2 flex flex-col p-4 gap-4">
        {/* 视频预览 */}
        <div className="flex-1 relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain"
          />
          
          {/* 状态指示器 */}
          <div className="absolute top-4 left-4 flex gap-2">
            {isActive && (
              <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                实时分析中
              </div>
            )}
            {isAnalyzing && (
              <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                分析中...
              </div>
            )}
          </div>

          {/* 错误提示 */}
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-red-500">{cameraError}</p>
              </div>
            </div>
          )}

          {/* 未激活时的开始按钮 */}
          {!isActive && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={start}
                disabled={!isCameraReady}
                className="px-8 py-4 bg-blue-500 text-white text-lg rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCameraReady ? '开始视频通话' : '摄像头初始化中...'}
              </button>
            </div>
          )}
        </div>

        {/* 控制栏 */}
        {isActive && (
          <div className="flex gap-2">
            <button
              onClick={stop}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              结束通话
            </button>
            <button
              onClick={captureAndAnalyze}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              手动分析
            </button>
          </div>
        )}

        {/* 识别结果 */}
        {lastRecognition && (
          <div className="h-32 overflow-y-auto">
            <Recognition result={lastRecognition} loading={isAnalyzing} />
          </div>
        )}
      </div>

      {/* 右侧：对话 */}
      <div className="w-1/2 border-l bg-white flex flex-col">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold text-gray-700">AI 视频对话</h2>
          <p className="text-xs text-gray-500">AI 会自动分析摄像头画面并回答你的问题</p>
        </div>
        
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {isActive ? 'AI 正在观察画面...' : '开始视频通话后，AI 会自动分析画面'}
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="捕获的画面"
                      className="max-w-full rounded mb-2 max-h-32 object-cover"
                    />
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 输入框 */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isActive ? "询问AI关于画面的问题..." : "请先开始视频通话"}
              disabled={!isActive || aiLoading}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!isActive || aiLoading || !inputMessage.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              发送
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VideoChat
