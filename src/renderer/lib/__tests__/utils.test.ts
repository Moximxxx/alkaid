import { cn } from '../utils'
import { describe, it, expect } from 'vitest'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toContain('a')
  })
  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toContain('base')
    expect(cn('base', false && 'hidden', 'extra')).toContain('extra')
  })
  it('handles undefined', () => {
    expect(cn('a', undefined)).toContain('a')
  })
  it('resolves Tailwind conflicts via twMerge', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2')
  })
})
