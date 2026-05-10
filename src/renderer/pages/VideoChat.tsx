import React, { useState, useCallback, useRef, useEffect } from "react"
import { Camera, Send, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSettings } from "@/hooks/useSettings"
import { useAI } from "../services/ai"
import { useCamera } from "@/hooks/useCamera"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { useTTS } from "@/hooks/useTTS"

export function VideoChatPage() {
  const { settings } = useSettings()
  const { messages, loading, sendMessage } = useAI({
    provider: settings.textProvider,
    apiKey: settings.textApiKey,
    model: settings.textModel,
  })
  const [input, setInput] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [autoAnalyze, setAutoAnalyze] = useState(false)
  const [analyzeInterval, setAnalyzeInterval] = useState(3000)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [ttsEnabled, setTTSEnabled] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const analyzingRef = useRef(false)

  const { stream, isReady, captureFrame, startAutoCapture, stopAutoCapture } = useCamera({ autoStart: true })

  const {
    isListening, transcript, interimTranscript,
    isSupported: speechSupported,
    startListening, stopListening, resetTranscript
  } = useSpeechRecognition()

  const {
    speak: ttsSpeak, stop: ttsStop,
    isSpeaking: isTTSSpeaking, isSupported: ttsSupported
  } = useTTS()

  // 绑定 stream 到 video 元素
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // AI 回复后自动朗读
  useEffect(() => {
    if (ttsEnabled && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'assistant' && lastMsg.content) {
        ttsSpeak(lastMsg.content)
      }
    }
  }, [messages, ttsEnabled, ttsSpeak])

  // 自动分析：定期将画面发送给 AI
  useEffect(() => {
    if (!autoAnalyze) return

    startAutoCapture(analyzeInterval, async (frame) => {
      if (analyzingRef.current) return
      analyzingRef.current = true
      setIsAnalyzing(true)
      try {
        await sendMessage('请简短描述你在画面中看到了什么。', frame, `vision-${Date.now()}`)
      } catch (error) {
        console.error('分析画面失败:', error)
      } finally {
        analyzingRef.current = false
        setIsAnalyzing(false)
      }
    })

    return () => {
      stopAutoCapture()
    }
  }, [autoAnalyze, analyzeInterval, startAutoCapture, stopAutoCapture, sendMessage])

  const handleCapture = useCallback(() => {
    const frame = captureFrame(videoRef.current || undefined)
    if (frame) {
      setImage(frame)
    }
  }, [captureFrame])

  const handleSend = async () => {
    if (!input.trim()) return
    try {
      await sendMessage(input, image || undefined)
      setInput("")
    } catch (error) {
      console.error("发送失败:", error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="lg:hidden flex items-center justify-between p-4 bg-background/80 backdrop-blur">
        <span className="font-semibold">视频通话</span>
        <Button size="sm" variant="ghost" onClick={() => window.location.href = "/"}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[7fr_3fr]">
        <div className="relative bg-black lg:static">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {image && (
            <img
              src={image}
              alt="捕获的图像"
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
          )}
          <div className="absolute top-4 left-4 lg:hidden">
            <Button size="sm" variant="secondary" onClick={handleCapture} disabled={!isReady}>
              <Camera className="w-4 h-4 mr-1" />
              捕获
            </Button>
          </div>
          {/* 分析控制面板 */}
          <div className="hidden lg:flex absolute top-4 right-4 items-center gap-2">
            {/* 自动分析开关 */}
            <label className="flex items-center gap-1.5 bg-background/80 backdrop-blur rounded-lg px-3 py-1.5 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoAnalyze}
                onChange={(e) => setAutoAnalyze(e.target.checked)}
                className="w-3 h-3"
              />
              自动分析
            </label>

            {/* 分析频率选择 */}
            {autoAnalyze && (
              <select
                value={analyzeInterval}
                onChange={(e) => setAnalyzeInterval(Number(e.target.value))}
                className="bg-background/80 backdrop-blur rounded-lg px-2 py-1.5 text-xs border"
              >
                <option value={1000}>1秒</option>
                <option value={3000}>3秒</option>
                <option value={5000}>5秒</option>
                <option value={10000}>10秒</option>
              </select>
            )}

            {/* 分析中指示器 */}
            {isAnalyzing && (
              <span className="flex items-center gap-1 bg-green-500/20 text-green-600 rounded-lg px-2 py-1 text-xs">
                <Loader2 className="w-3 h-3 animate-spin" />
                分析中
              </span>
            )}
          </div>
          <div className="hidden lg:flex absolute top-4 left-4">
            <Button size="sm" variant="ghost" onClick={() => window.location.href = "/"}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回主页
            </Button>
          </div>

          <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur p-4">
            <div className="flex flex-col h-[300px]">
              <div className="flex-1 overflow-y-auto space-y-2 mb-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-1.5 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>AI 思考中...</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入消息..."
                  disabled={loading}
                  className="text-sm"
                />
                <Button size="sm" onClick={handleSend} disabled={loading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-col h-full border-l">
          <div className="p-4 border-b bg-muted/50">
            <h2 className="font-semibold">AI 对话</h2>
          </div>

          {/* 语音控制栏 */}
          <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
            {/* 麦克风按钮 */}
            <button
              onClick={() => {
                if (isListening) {
                  stopListening()
                  if (transcript) {
                    setInput(prev => prev + transcript)
                    resetTranscript()
                  }
                } else {
                  startListening()
                }
              }}
              disabled={!speechSupported}
              className={`p-2 rounded-full transition-colors ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-muted hover:bg-muted/80'
              }`}
              title={isListening ? '点击停止录音' : '点击开始语音输入'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            {/* 中间语音状态文本 */}
            <span className="text-xs text-muted-foreground flex-1 truncate">
              {isListening
                ? (interimTranscript || '正在聆听...')
                : (speechSupported ? '点击麦克风开始语音输入' : '浏览器不支持语音识别')}
            </span>

            {/* 语音朗读开关 */}
            <button
              onClick={() => setTTSEnabled(!ttsEnabled)}
              className={`p-2 rounded-full transition-colors ${
                ttsEnabled
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
              title={ttsEnabled ? '关闭语音朗读' : '开启语音朗读'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>

            {/* TTS 朗读中指示器 */}
            {isTTSSpeaking && (
              <span className="text-xs text-green-600 animate-pulse">朗读中...</span>
            )}
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>AI 思考中...</span>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-muted/30">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入消息..."
                  disabled={loading}
                />
                <Button onClick={handleSend} disabled={loading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
