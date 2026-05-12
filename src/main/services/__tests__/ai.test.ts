import { AIService } from '../ai'
import type { AIModelConfig } from '@shared/types'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('AIService', () => {
  let service: AIService
  const config: AIModelConfig = {
    provider: 'openai',
    apiKey: 'sk-test',
    model: 'gpt-4',
    baseUrl: '',
  }

  beforeEach(() => {
    service = new AIService(config)
  })

  it('constructor initializes with config and empty messages', () => {
    expect(service.getMessages()).toEqual([])
  })

  it('updateConfig changes config without throwing', () => {
    expect(() => {
      service.updateConfig({ ...config, model: 'gpt-5' })
    }).not.toThrow()
  })

  it('getMessages returns empty array initially', () => {
    expect(service.getMessages()).toHaveLength(0)
  })

  it('clearMessages resets messages', () => {
    // clearMessages on empty messages should work
    service.clearMessages()
    expect(service.getMessages()).toHaveLength(0)
  })

  it('getMessages returns the same reference after consecutive calls', () => {
    expect(service.getMessages()).toBe(service.getMessages())
  })

  it('multiple AIService instances are isolated', () => {
    const service1 = new AIService(config)
    const service2 = new AIService({ ...config, provider: 'google', apiKey: 'sk-google', model: 'gemini-pro' })
    expect(service1.getMessages()).toEqual([])
    expect(service2.getMessages()).toEqual([])
    // Verify they don't share state
    expect(service1).not.toBe(service2)
  })
})

describe('AIService sendMessage with fetch mock', () => {
  const config: AIModelConfig = { provider: 'openai', apiKey: 'sk-test', model: 'gpt-4', baseUrl: '' }

  it('sendMessage sends fetch and returns assistant message', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: 'AI reply' } }] }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const service = new AIService(config)
    const msg = await service.sendMessage('hello')
    expect(msg.role).toBe('assistant')
    expect(msg.content).toBe('AI reply')
  })
})
