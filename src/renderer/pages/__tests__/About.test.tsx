import { render, screen } from '@testing-library/react'
import { AboutPage } from '../About'
import { describe, it, expect } from 'vitest'

describe('AboutPage', () => {
  it('renders page title', () => {
    render(<AboutPage />)
    expect(screen.getByText('关于')).toBeTruthy()
  })

  it('renders app name and version', () => {
    render(<AboutPage />)
    expect(screen.getByText('摇光')).toBeTruthy()
    expect(screen.getByText('版本 0.1.0')).toBeTruthy()
  })

  it('renders subheading description', () => {
    render(<AboutPage />)
    expect(screen.getByText('了解更多关于摇光的信息')).toBeTruthy()
  })

  it('renders all feature cards', () => {
    render(<AboutPage />)
    expect(screen.getByText('项目介绍')).toBeTruthy()
    expect(screen.getByText('功能特点')).toBeTruthy()
    expect(screen.getByText('技术栈')).toBeTruthy()
    expect(screen.getByText('链接')).toBeTruthy()
  })

  it('renders tech stack badges', () => {
    render(<AboutPage />)
    expect(screen.getByText('Electron')).toBeTruthy()
    expect(screen.getByText('React')).toBeTruthy()
    expect(screen.getByText('TypeScript')).toBeTruthy()
    expect(screen.getByText('Tailwind CSS')).toBeTruthy()
    expect(screen.getByText('Vite')).toBeTruthy()
    expect(screen.getByText('shadcn/ui')).toBeTruthy()
  })

  it('renders GitHub repository link', () => {
    render(<AboutPage />)
    const link = screen.getByText('GitHub 仓库')
    expect(link).toBeTruthy()
    expect(link.closest('a')).toHaveAttribute(
      'href',
      'https://github.com/Moximxxx/alkaid'
    )
  })
})
