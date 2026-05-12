import { render } from '@testing-library/react'
import { LocalPiP } from '../LocalPiP'
import { describe, it, expect, vi, beforeAll } from 'vitest'

// MediaStream is not available in jsdom, stub it globally
beforeAll(() => {
  class MockMediaStream {
    getTracks() {
      return [] as MediaStreamTrack[]
    }
    getVideoTracks() {
      return [] as MediaStreamTrack[]
    }
  }
  vi.stubGlobal('MediaStream', MockMediaStream as unknown)
})

describe('LocalPiP', () => {
  it('renders nothing when isVisible is false', () => {
    const { container } = render(<LocalPiP stream={null} isVisible={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when stream is null', () => {
    const { container } = render(<LocalPiP stream={null} isVisible={true} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders video element when visible and stream provided', () => {
    const stream = new MediaStream()
    const { container } = render(<LocalPiP stream={stream} isVisible={true} />)
    const video = container.querySelector('video')
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute('autoplay')
  })

  it('applies muted property by default', () => {
    const stream = new MediaStream()
    const { container } = render(<LocalPiP stream={stream} isVisible={true} />)
    const video = container.querySelector('video') as HTMLVideoElement | null
    // jsdom may not support hasAttribute('muted') on video; check the property instead
    expect(video?.muted).toBe(true)
  })
})
