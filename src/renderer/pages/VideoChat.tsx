import React, { useState, useCallback } from "react"
import { Camera, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">视频通话</h1>
        <p className="mt-2 text-muted-foreground">实时视频分析与AI对话</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              摄像头
              <Button size="sm" variant="outline" onClick={handleCapture}>
                <Camera className="w-4 h-4 mr-2" />
                捕获
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
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
            </div>
          </CardContent>
        </Card>

        {/* Chat */}
        <Card>
          <CardHeader>
            <CardTitle>AI 对话</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-[400px]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
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
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI 思考中...</span>
                </div>
              )}
            </div>

            {/* Input */}
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
