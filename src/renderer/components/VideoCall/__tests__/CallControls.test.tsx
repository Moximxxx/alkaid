import { render, screen, fireEvent } from '@testing-library/react'
import { CallControls } from '../CallControls'
import { describe, it, expect, vi } from 'vitest'

describe('CallControls', () => {
  const defaultProps = {
    micEnabled: true,
    speakerEnabled: true,
    cameraEnabled: true,
    chatOpen: false,
    onToggleMic: vi.fn(),
    onToggleSpeaker: vi.fn(),
    onToggleCamera: vi.fn(),
    onToggleChat: vi.fn(),
    onHangup: vi.fn(),
    isConnected: true,
  }

  it('renders nothing when isConnected is false', () => {
    const { container } = render(<CallControls {...defaultProps} isConnected={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders controls when isConnected is true', () => {
    render(<CallControls {...defaultProps} />)
    expect(screen.getByTitle('关闭麦克风')).toBeInTheDocument()
    expect(screen.getByTitle('结束通话')).toBeInTheDocument()
  })

  it('calls onToggleMic when mic button clicked', () => {
    render(<CallControls {...defaultProps} />)
    fireEvent.click(screen.getByTitle('关闭麦克风'))
    expect(defaultProps.onToggleMic).toHaveBeenCalledTimes(1)
  })

  it('calls onHangup when hangup button clicked', () => {
    render(<CallControls {...defaultProps} />)
    fireEvent.click(screen.getByTitle('结束通话'))
    expect(defaultProps.onHangup).toHaveBeenCalledTimes(1)
  })
})
