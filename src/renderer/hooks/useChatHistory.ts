import { useState, useCallback, useEffect } from 'react'
import type { Conversation, ChatMessage } from '@shared/types'

const STORAGE_KEY = 'alkaid_chat_history'

function loadAll(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAll(conversations: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
  } catch {
    // silently fail
  }
}

export function useChatHistory() {
  const [conversations, setConversations] = useState<Conversation[]>(loadAll)

  useEffect(() => {
    saveAll(conversations)
  }, [conversations])

  const save = useCallback((conv: Conversation) => {
    setConversations(prev => {
      const idx = prev.findIndex(c => c.id === conv.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...conv, updatedAt: Date.now() }
        return next
      }
      return [...prev, { ...conv, updatedAt: Date.now() }]
    })
  }, [])

  const remove = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id))
  }, [])

  const load = useCallback((id: string): Conversation | undefined => {
    return conversations.find(c => c.id === id)
  }, [conversations])

  const createNew = useCallback((
    msgs: { id: string; role: string; content: string }[]
  ): Conversation => {
    const now = Date.now()
    const title = msgs.find(m => m.role === 'user')?.content?.slice(0, 30) || '新对话'
    return {
      id: now.toString(),
      title,
      messages: msgs.map(m => ({
        id: m.id,
        role: m.role as ChatMessage['role'],
        content: m.content,
        timestamp: now,
      })),
      createdAt: now,
      updatedAt: now,
    }
  }, [])

  return { conversations, save, remove, load, createNew }
}
