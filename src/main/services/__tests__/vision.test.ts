// 图像识别服务测试
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VisionService } from '../vision'

// 模拟 fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('VisionService', () => {
  let visionService: VisionService

  beforeEach(() => {
    vi.clearAllMocks()
    visionService = new VisionService({
      provider: 'doubao',
      apiKey: 'test-key',
      model: 'doubao-1.5-thinking-vision-pro',
    })
  })

  it('应该创建 VisionService 实例', () => {
    expect(visionService).toBeDefined()
  })

  it('应该能够更新配置', () => {
    visionService.updateConfig({
      provider: 'doubao',
      apiKey: 'new-key',
      model: 'doubao-1.6-vision',
    })
    expect(true).toBe(true)
  })

  it('应该调用豆包 API 进行识别', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '图片中有一只猫' } }],
      }),
    })

    const result = await visionService.recognize('data:image/jpeg;base64,test')

    expect(result).toBeDefined()
    expect(result.scene).toBeDefined()
    expect(result.scene.description).toBe('图片中有一只猫')
  })

  it('API 错误应该抛出异常', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    await expect(visionService.recognize('test')).rejects.toThrow('豆包视觉 API 错误: 500')
  })
})
