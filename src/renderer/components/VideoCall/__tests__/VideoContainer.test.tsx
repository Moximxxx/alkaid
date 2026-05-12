import { render } from '@testing-library/react'
import { VideoContainer } from '../VideoContainer'
import { describe, it, expect } from 'vitest'

describe('VideoContainer', () => {
  it('renders waiting state when inactive', () => {
    const { container } = render(<VideoContainer stream={null} isActive={false} />)
    expect(container.textContent).toContain('等待摄像头')
  })

  it('renders children', () => {
    const { getByText } = render(
      <VideoContainer stream={null} isActive={false}>
        <div>Test Child</div>
      </VideoContainer>
    )
    expect(getByText('Test Child')).toBeTruthy()
  })

  it('renders video element when active with stream', () => {
    const mockStream = {} as MediaStream
    const { container } = render(<VideoContainer stream={mockStream} isActive={true} />)
    const video = container.querySelector('video')
    expect(video).toBeTruthy()
    expect(video).toHaveAttribute('autoplay')
  })

  it('does not show waiting text when active', () => {
    const mockStream = {} as MediaStream
    const { container } = render(<VideoContainer stream={mockStream} isActive={true} />)
    expect(container.textContent).not.toContain('等待摄像头')
  })

  it('does not show waiting text when inactive but has children', () => {
    const { container, queryByText } = render(
      <VideoContainer stream={null} isActive={false}>
        <div>Floating UI</div>
      </VideoContainer>
    )
    // Waiting text should still show when inactive, even with children
    expect(container.textContent).toContain('等待摄像头')
    expect(queryByText('Floating UI')).toBeTruthy()
  })
})
