import React, { useState, useCallback } from "react"
import { Camera, Send, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSettings } from "@/hooks/useSettings"
import { useAI } from "@/hooks/useAI"

export function VideoChatPage() {
  const { settings } = useSettings()
  const { messages, loading, sendMessage } = useAI()
  const [input, setInput] = useState("")
  const [image, setImage] = useState<string | null>(null)

  const handleCapture = useCallback(() => {
    const video = document.querySelector("video")
    if (video) {
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const dataUrl = canvas.toDataURL("image/jpeg")
        setImage(dataUrl)
      }
    }
  }, [])

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
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            ref={(el) => {
              if (el && !el.srcObject) {
                navigator.mediaDevices
                  .getUserMedia({ video: true })
                  .then((stream) => {
                    el.srcObject = stream
                  })
                  .catch(console.error)
              }
            }}
          />
          {image && (
            <img
              src={image}
              alt="捕获的图像"
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
          )}
          <div className="absolute top-4 left-4 lg:hidden">
            <Button size="sm" variant="secondary" onClick={handleCapture}>
              <Camera className="w-4 h-4 mr-1" />
              捕获
            </Button>
          </div>
          <div className="hidden lg:block absolute top-4 right-4">
            <Button size="sm" variant="secondary" onClick={handleCapture}>
              <Camera className="w-4 h-4 mr-1" />
              捕获
            </Button>
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
