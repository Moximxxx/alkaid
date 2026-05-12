import { render, screen } from '@testing-library/react'
import Chat from '../Chat'
import { describe, it, expect, vi, beforeAll } from 'vitest'

// jsdom does not implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})
import type { ChatMessage } from '@shared/types'

describe('Chat', () => {
  const defaultProps = {
    messages: [] as ChatMessage[],
    onSendMessage: vi.fn(),
  }

  it('renders empty state', () => {
    render(<Chat {...defaultProps} />)
    expect(screen.getByText('开始对话...')).toBeInTheDocument()
  })

  it('renders messages', () => {
    const messages: ChatMessage[] = [
      { id: '1', role: 'user', content: '测试消息', timestamp: Date.now() },
      { id: '2', role: 'assistant', content: '收到', timestamp: Date.now() },
    ]
    render(<Chat {...defaultProps} messages={messages} />)
    expect(screen.getByText('测试消息')).toBeInTheDocument()
    expect(screen.getByText('收到')).toBeInTheDocument()
  })

  it('renders input and send button', () => {
    render(<Chat {...defaultProps} />)
    expect(screen.getByPlaceholderText('输入消息...')).toBeInTheDocument()
    expect(screen.getByText('发送')).toBeInTheDocument()
  })

  it('disables input when loading', () => {
    render(<Chat {...defaultProps} loading={true} />)
    expect(screen.getByPlaceholderText('输入消息...')).toBeDisabled()
    expect(screen.getByText('发送中...')).toBeDisabled()
  })
})
