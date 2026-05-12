import { render, screen } from '@testing-library/react'
import { PageContainer } from '../PageContainer'
import { describe, it, expect } from 'vitest'

describe('PageContainer', () => {
  it('renders title', () => {
    render(<PageContainer title="Test"><p>content</p></PageContainer>)
    expect(screen.getByText('Test')).toBeTruthy()
    expect(screen.getByText('content')).toBeTruthy()
  })

  it('renders description', () => {
    render(<PageContainer title="T" description="desc"><p>x</p></PageContainer>)
    expect(screen.getByText('desc')).toBeTruthy()
  })

  it('renders without title', () => {
    const { container } = render(<PageContainer><p>no title</p></PageContainer>)
    expect(container.querySelector('h1')).toBeNull()
    expect(screen.getByText('no title')).toBeTruthy()
  })

  it('applies custom className', () => {
    const { container } = render(<PageContainer title="X" className="custom-class"><p /></PageContainer>)
    const outer = container.firstChild as HTMLElement
    expect(outer.className).toContain('custom-class')
  })
})
