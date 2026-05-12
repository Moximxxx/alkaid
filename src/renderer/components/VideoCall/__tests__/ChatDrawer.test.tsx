import { render, screen } from '@testing-library/react'
import { ChatDrawer } from '../ChatDrawer'
import { describe, it, expect, vi } from 'vitest'
import type { ChatMessage } from '@shared/types'

describe('ChatDrawer', () => {
  const defaultProps = {
    messages: [] as ChatMessage[],
    loading: false,
    input: '',
    onInputChange: vi.fn(),
    onSend: vi.fn(),
    onKeyDown: vi.fn(),
    isOpen: true,
    onToggle: vi.fn(),
  }

  it('renders empty state when open', () => {
    render(<ChatDrawer {...defaultProps} />)
    expect(screen.getByText('AI 对话')).toBeInTheDocument()
    expect(screen.getByText('开始通话后，AI 会自动分析画面并回答你的问题')).toBeInTheDocument()
  })

  it('renders messages', () => {
    const messages: ChatMessage[] = [
      { id: '1', role: 'user', content: '你好', timestamp: Date.now() },
      { id: '2', role: 'assistant', content: '你好！有什么可以帮助你的？', timestamp: Date.now() },
    ]
    render(<ChatDrawer {...defaultProps} messages={messages} />)
    expect(screen.getByText('你好')).toBeInTheDocument()
    expect(screen.getByText('你好！有什么可以帮助你的？')).toBeInTheDocument()
  })

  it('shows loading indicator', () => {
    render(<ChatDrawer {...defaultProps} loading={true} />)
    expect(screen.getByText('AI 思考中...')).toBeInTheDocument()
  })

  it('does not render overlay when closed', () => {
    const { container } = render(<ChatDrawer {...defaultProps} isOpen={false} />)
    // The overlay with fixed inset-0 should not be present
    expect(container.querySelector('.fixed.inset-0')).toBeNull()
  })
})
