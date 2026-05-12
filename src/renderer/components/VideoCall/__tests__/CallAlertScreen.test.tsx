import { render, screen, fireEvent } from '@testing-library/react'
import { CallAlertScreen } from '../CallAlertScreen'
import { describe, it, expect, vi } from 'vitest'

describe('CallAlertScreen', () => {
  const defaultProps = {
    onAccept: vi.fn(),
    onReject: vi.fn(),
    isVisible: true,
  }

  it('renders nothing when isVisible is false', () => {
    const { container } = render(<CallAlertScreen {...defaultProps} isVisible={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders with default aiName', () => {
    render(<CallAlertScreen {...defaultProps} />)
    expect(screen.getByText('摇光')).toBeInTheDocument()
    expect(screen.getByText('来电中...')).toBeInTheDocument()
  })

  it('renders custom aiName', () => {
    render(<CallAlertScreen {...defaultProps} aiName="小明" />)
    expect(screen.getByText('小明')).toBeInTheDocument()
  })

  it('calls onAccept when accept button clicked', () => {
    const { container } = render(<CallAlertScreen {...defaultProps} />)
    // The "接听" text is in a <span> sibling, the button only contains the Phone icon
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(2)
    fireEvent.click(buttons[1]) // second button is accept (green)
    expect(defaultProps.onAccept).toHaveBeenCalledTimes(1)
  })

  it('calls onReject when reject button clicked', () => {
    const { container } = render(<CallAlertScreen {...defaultProps} />)
    const buttons = container.querySelectorAll('button')
    fireEvent.click(buttons[0]) // first button is reject (red)
    expect(defaultProps.onReject).toHaveBeenCalledTimes(1)
  })
})
