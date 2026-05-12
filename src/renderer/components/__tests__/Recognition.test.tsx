import { render, screen } from '@testing-library/react'
import Recognition from '../Recognition'
import { describe, it, expect } from 'vitest'
import type { RecognitionResult } from '@shared/types'

describe('Recognition', () => {
  it('renders loading state', () => {
    render(<Recognition result={null} loading={true} />)
    expect(screen.getByText('识别中...')).toBeInTheDocument()
  })

  it('renders waiting state', () => {
    render(<Recognition result={null} loading={false} />)
    expect(screen.getByText('等待识别...')).toBeInTheDocument()
  })

  it('renders recognition result with scene', () => {
    const result: RecognitionResult = {
      objects: [],
      faces: [],
      scene: { tags: ['室内'], description: '一个明亮的房间', confidence: 0.95 },
      timestamp: Date.now(),
    }
    render(<Recognition result={result} />)
    expect(screen.getByText('识别结果')).toBeInTheDocument()
    expect(screen.getByText('一个明亮的房间')).toBeInTheDocument()
  })

  it('renders detected objects with confidence', () => {
    const result: RecognitionResult = {
      objects: [
        { name: '桌子', confidence: 0.95, boundingBox: { x: 0, y: 0, width: 100, height: 100 } },
        { name: '椅子', confidence: 0.88, boundingBox: { x: 50, y: 50, width: 80, height: 80 } },
      ],
      faces: [],
      scene: { tags: [], description: '', confidence: 0 },
      timestamp: Date.now(),
    }
    render(<Recognition result={result} />)
    expect(screen.getByText('桌子')).toBeInTheDocument()
    expect(screen.getByText('椅子')).toBeInTheDocument()
    expect(screen.getByText('95%')).toBeInTheDocument()
  })
})
