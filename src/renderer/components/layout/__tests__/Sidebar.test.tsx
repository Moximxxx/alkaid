import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '../Sidebar'
import { describe, it, expect } from 'vitest'

describe('Sidebar', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <MemoryRouter><Sidebar open={false} onClose={() => {}} /></MemoryRouter>
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders nav items when open', () => {
    render(<MemoryRouter><Sidebar open={true} onClose={() => {}} /></MemoryRouter>)
    expect(screen.getByText('首页')).toBeTruthy()
    expect(screen.getByText('视频通话')).toBeTruthy()
    expect(screen.getByText('设置')).toBeTruthy()
  })

  it('renders close button when open', () => {
    render(<MemoryRouter><Sidebar open={true} onClose={() => {}} /></MemoryRouter>)
    // The close button contains the X icon (Lucide X SVG)
    const closeButton = screen.getByRole('button')
    expect(closeButton.querySelector('.lucide-x')).toBeTruthy()
  })

  it('renders history conversations when provided', () => {
    const conversations = [
      { id: '1', title: '对话一' },
      { id: '2', title: '对话二' },
    ]
    render(
      <MemoryRouter>
        <Sidebar open={true} onClose={() => {}} conversations={conversations} />
      </MemoryRouter>
    )
    expect(screen.getByText('对话一')).toBeTruthy()
    expect(screen.getByText('对话二')).toBeTruthy()
  })

  it('does not render history section when conversations is empty', () => {
    render(
      <MemoryRouter>
        <Sidebar open={true} onClose={() => {}} conversations={[]} />
      </MemoryRouter>
    )
    expect(screen.queryByText('历史对话')).toBeNull()
  })
})
