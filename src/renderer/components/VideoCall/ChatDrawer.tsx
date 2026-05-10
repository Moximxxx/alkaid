import React from 'react'
import { X, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ChatMessage } from '@shared/types'

export interface ChatDrawerProps {
  messages: ChatMessage[]
  loading: boolean
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  isOpen: boolean
  onToggle: () => void
}

export function ChatDrawer({
  messages,
  loading,
  input,
  onInputChange,
  onSend,
  onKeyDown,
  isOpen,
  onToggle,
}: ChatDrawerProps) {
  return (
    <>
      {/* 遮罩层（移动端点击关闭） */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* 侧栏面板 */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-80 bg-background border-l shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">AI 对话</h3>
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: 'calc(100% - 120px)' }}>
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              开始通话后，AI 会自动分析画面并回答你的问题
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="捕获的画面"
                      className="max-w-full rounded mb-2 max-h-24 object-cover"
                    />
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>AI 思考中...</span>
            </div>
          )}
        </div>

        {/* 输入框 */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t bg-background">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="输入消息..."
              disabled={loading}
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={onSend}
              disabled={loading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
