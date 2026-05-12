import { renderHook, act } from '@testing-library/react'
import { useChatHistory } from '../useChatHistory'
import { describe, it, expect, beforeEach } from 'vitest'

beforeEach(() => {
  localStorage.clear()
})

describe('useChatHistory', () => {
  it('starts with empty conversations', () => {
    const { result } = renderHook(() => useChatHistory())
    expect(result.current.conversations).toEqual([])
  })

  it('createNew generates Conversation from messages', () => {
    const { result } = renderHook(() => useChatHistory())
    const conv = result.current.createNew([
      { id: '1', role: 'user', content: 'hello' },
    ])
    expect(conv.title).toBe('hello')
    expect(conv.messages.length).toBe(1)
  })

  it('save adds new conversation', () => {
    const { result } = renderHook(() => useChatHistory())
    const conv = result.current.createNew([
      { id: '1', role: 'user', content: 'test' },
    ])
    act(() => {
      result.current.save(conv)
    })
    expect(result.current.conversations.length).toBe(1)
  })

  it('save updates existing conversation', () => {
    const { result } = renderHook(() => useChatHistory())
    const conv = result.current.createNew([
      { id: '1', role: 'user', content: 'test' },
    ])
    act(() => {
      result.current.save(conv)
    })
    const updated = { ...conv, title: 'updated' }
    act(() => {
      result.current.save(updated)
    })
    expect(result.current.conversations[0].title).toBe('updated')
  })

  it('remove deletes conversation', () => {
    const { result } = renderHook(() => useChatHistory())
    const conv = result.current.createNew([
      { id: '1', role: 'user', content: 'test' },
    ])
    act(() => {
      result.current.save(conv)
    })
    act(() => {
      result.current.remove(conv.id)
    })
    expect(result.current.conversations.length).toBe(0)
  })

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useChatHistory())
    const conv = result.current.createNew([
      { id: '1', role: 'user', content: 'persist' },
    ])
    act(() => {
      result.current.save(conv)
    })
    expect(localStorage.getItem('alkaid_chat_history')).toBeTruthy()
  })
})
