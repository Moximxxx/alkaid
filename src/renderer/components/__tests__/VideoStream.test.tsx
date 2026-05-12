import { render, screen } from '@testing-library/react'
import VideoStream from '../VideoStream'
import { describe, it, expect, vi } from 'vitest'

// Mock useCamera hook since it depends on browser MediaDevices API (unavailable in jsdom)
vi.mock('@/hooks/useCamera', () => ({
  useCamera: () => ({
    stream: null,
    captureFrame: vi.fn(),
    isReady: false,
  }),
}))

describe('VideoStream', () => {
  it('renders video element', () => {
    const { container } = render(<VideoStream />)
    expect(container.querySelector('video')).toBeInTheDocument()
  })

  it('renders capture button', () => {
    render(<VideoStream />)
    expect(screen.getByText('拍照')).toBeInTheDocument()
  })

  it('capture button is disabled when not ready', () => {
    render(<VideoStream />)
    expect(screen.getByText('拍照')).toBeDisabled()
  })
})
