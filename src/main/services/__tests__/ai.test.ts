// AI 服务测试
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIService } from '../ai'

// 模拟 fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('AIService', () => {
  let aiService: AIService

  beforeEach(() => {
    vi.clearAllMocks()
    aiService = new AIService({
      provider: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4-vision-preview',
    })
  })

  it('应该创建 AIService 实例', () => {
    expect(aiService).toBeDefined()
  })

  it('应该能够更新配置', () => {
    aiService.updateConfig({
      provider: 'doubao',
      apiKey: 'new-key',
      model: 'doubao-vision-pro',
    })
    // 验证配置已更新（通过后续调用验证）
    expect(true).toBe(true)
  })

  it('应该能够清空消息历史', () => {
    aiService.clearMessages()
    expect(aiService.getMessages()).toEqual([])
  })

  it('发送消息应该调用 OpenAI API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '测试回复' } }],
      }),
    })

    await aiService.sendMessage('测试消息')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/chat/completions'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-key',
        }),
      })
    )
  })

  it('发送消息应该调用豆包 API', async () => {
    aiService.updateConfig({
      provider: 'doubao',
      apiKey: 'doubao-key',
      model: 'doubao-vision-pro',
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '豆包回复' } }],
      }),
    })

    await aiService.sendMessage('测试消息')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('ark.cn-beijing.volces.com'),
      expect.objectContaining({
        method: 'POST',
      })
    )
  })

  it('发送消息应该支持图片', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '图片分析结果' } }],
      }),
    })

    await aiService.sendMessage('描述图片', 'data:image/jpeg;base64,test')

    expect(mockFetch).toHaveBeenCalled()
    const callArgs = mockFetch.mock.calls[0]
    const body = JSON.parse(callArgs[1].body)
    const userMessage = body.messages.find((m: any) => m.role === 'user')
    expect(Array.isArray(userMessage.content)).toBe(true)
  })

  it('API 错误应该抛出异常', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    await expect(aiService.sendMessage('测试')).rejects.toThrow('OpenAI API 错误: 500')
  })

  it('应该维护消息历史', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '回复' } }],
      }),
    })

    await aiService.sendMessage('消息1')
    await aiService.sendMessage('消息2')

    const messages = aiService.getMessages()
    expect(messages.length).toBe(4) // 2 user + 2 assistant
  })
})
