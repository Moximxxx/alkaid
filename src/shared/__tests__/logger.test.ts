import { logger } from '../logger'
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('logger.info calls console.info', () => {
    logger.info('test')
    expect(console.info).toHaveBeenCalled()
  })

  it('logger.warn calls console.warn', () => {
    logger.warn('warning')
    expect(console.warn).toHaveBeenCalled()
  })

  it('logger.error calls console.error', () => {
    logger.error('error')
    expect(console.error).toHaveBeenCalled()
  })
})
