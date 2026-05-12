import { render, screen } from '@testing-library/react'
import { AIStatusBar } from '../AIStatusBar'
import { describe, it, expect } from 'vitest'

describe('AIStatusBar', () => {
  it('renders idle status', () => {
    render(<AIStatusBar aiStatus="idle" duration={0} />)
    expect(screen.getByText('待命中')).toBeTruthy()
  })

  it('renders listening status', () => {
    render(<AIStatusBar aiStatus="listening" duration={5} />)
    expect(screen.getByText('聆听中...')).toBeTruthy()
  })

  it('renders thinking status', () => {
    render(<AIStatusBar aiStatus="thinking" duration={10} />)
    expect(screen.getByText('思考中...')).toBeTruthy()
  })

  it('renders speaking status', () => {
    render(<AIStatusBar aiStatus="speaking" duration={10} />)
    expect(screen.getByText('说话中...')).toBeTruthy()
  })

  it('formats duration correctly', () => {
    render(<AIStatusBar aiStatus="idle" duration={125} />)
    // 125 seconds → 02:05
    expect(screen.getByText('02:05')).toBeTruthy()
  })

  it('renders default AI name', () => {
    render(<AIStatusBar aiStatus="idle" duration={0} />)
    expect(screen.getByText('摇光')).toBeTruthy()
  })
})
