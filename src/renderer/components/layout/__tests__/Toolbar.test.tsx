import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Toolbar } from '../Toolbar'
import { describe, it, expect, vi } from 'vitest'

describe('Toolbar', () => {
  it('renders logo text', () => {
    render(
      <MemoryRouter>
        <Toolbar theme="light" onThemeToggle={() => {}} />
      </MemoryRouter>
    )
    expect(screen.getByText('摇光')).toBeTruthy()
  })

  it('renders navigation items', () => {
    render(
      <MemoryRouter>
        <Toolbar theme="light" onThemeToggle={() => {}} />
      </MemoryRouter>
    )
    expect(screen.getByText('首页')).toBeTruthy()
    expect(screen.getByText('视频通话')).toBeTruthy()
  })

  it('shows menu button when onMenuToggle is provided', () => {
    const { container } = render(
      <MemoryRouter>
        <Toolbar theme="light" onThemeToggle={() => {}} onMenuToggle={() => {}} />
      </MemoryRouter>
    )
    // Menu button contains the Lucide Menu icon
    const menuIcon = container.querySelector('.lucide-menu')
    expect(menuIcon).toBeTruthy()
  })

  it('renders theme toggle button', () => {
    const onThemeToggle = vi.fn()
    render(
      <MemoryRouter>
        <Toolbar theme="light" onThemeToggle={onThemeToggle} />
      </MemoryRouter>
    )
    // There should be a button for theme toggling (Moon icon in light mode)
    const themeButtons = screen.getAllByRole('button')
    expect(themeButtons.length).toBeGreaterThan(0)
  })

  it('shows sun icon in dark mode and moon icon in light mode', () => {
    const { container, rerender } = render(
      <MemoryRouter>
        <Toolbar theme="dark" onThemeToggle={() => {}} />
      </MemoryRouter>
    )
    // In dark mode, Sun icon is shown
    expect(container.querySelector('.lucide-sun')).toBeTruthy()
    expect(container.querySelector('.lucide-moon')).toBeNull()

    rerender(
      <MemoryRouter>
        <Toolbar theme="light" onThemeToggle={() => {}} />
      </MemoryRouter>
    )
    // In light mode, Moon icon is shown
    expect(container.querySelector('.lucide-moon')).toBeTruthy()
    expect(container.querySelector('.lucide-sun')).toBeNull()
  })
})
