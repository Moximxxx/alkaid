import React, { useState, useRef, useEffect, KeyboardEvent } from "react"
import { Link } from "react-router-dom"
import { Send, Settings, Video, User, Loader2, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSettings } from "@/hooks/useSettings"
import { useAI } from "../services/ai"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export function HomePage() {
  const { settings } = useSettings()
  const { messages: aiMessages, loading, sendMessage, setMessageUpdateCallback } = useAI({
    provider: settings.textProvider,
    apiKey: settings.textApiKey,
    model: settings.textModel,
  })

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "你好！我是摇光，你的AI助手。有什么我可以帮助你的吗？",
    },
  ])
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    setMessageUpdateCallback((msgs) => {
      for (const msg of msgs) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === msg.id)
          if (exists) {
            return prev.map((m) => (m.id === msg.id ? { ...m, content: msg.content } : m))
          }
          return [...prev, { id: msg.id, role: msg.role as "user" | "assistant", content: msg.content }]
        })
      }
    })
  }, [setMessageUpdateCallback])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    const contentToSend = input.trim()
    setInput("")

    try {
      await sendMessage(contentToSend)
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `错误: ${error instanceof Error ? error.message : "未知错误"}`,
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Chat Area - 占满剩余空间 */}
      <div className="flex-1 overflow-hidden px-4 py-6">
        <div className="h-full overflow-y-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - 固定高度在底部 */}
      <div className="flex-shrink-0 border-t bg-background/95 px-4 py-4">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-2 items-end">
            <Link to="/video-chat" className="flex-shrink-0">
              <Button variant="outline" size="icon" title="视频通话">
                <Video className="h-4 w-4" />
              </Button>
            </Link>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={loading ? "等待AI回复..." : "输入消息..."}
              disabled={loading}
              className="flex-1 min-h-[40px] max-h-[120px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={1}
            />
            <Button onClick={handleSend} size="icon" disabled={!input.trim() || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            按 Enter 发送，Shift+Enter 换行
          </p>
        </div>
      </div>
    </div>
  )
}
