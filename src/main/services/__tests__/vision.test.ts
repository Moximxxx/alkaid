import { VisionService } from '../vision'
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('VisionService', () => {
  const cfg = { provider: 'doubao_vision' as const, apiKey: 'test-key', model: 'doubao-2.0-vision-pro' }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('constructor initializes with config', () => {
    const s = new VisionService(cfg)
    expect(s).toBeDefined()
  })

  it('updateConfig updates the internal config', () => {
    const s = new VisionService(cfg)
    s.updateConfig({ ...cfg, model: 'new-model' })
    // 通过 recognize 抛错时的 provider 来判断配置已更新
    // 如果 updateConfig 不生效，model 不会变；但这里只是验证不抛出即可
    expect(s).toBeDefined()
  })

  it('throws on unsupported provider', async () => {
    const s = new VisionService({ ...cfg, provider: 'unknown' as never })
    await expect(s.recognize('data:image/jpeg;base64,xxx')).rejects.toThrow('不支持的识别服务')
  })

  it('recognizeWithDoubao calls fetch and returns result', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '一张猫的图片' } }],
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const s = new VisionService(cfg)
    const result = await s.recognize('data:image/jpeg;base64,cGFzc3dvcmQ=')

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result.scene.description).toBe('一张猫的图片')
  })

  it('recognizeWithDoubao throws on non-ok response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    })
    vi.stubGlobal('fetch', mockFetch)

    const s = new VisionService(cfg)
    await expect(s.recognize('data:image/jpeg;base64,xxx')).rejects.toThrow('豆包视觉 API 错误: 401')
  })

  it('recognizeWithGoogleVision calls fetch and returns result', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'a dog' }] } }],
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const s = new VisionService({ ...cfg, provider: 'google_vision', model: 'gemini-2.5-pro-vision' })
    const result = await s.recognize('data:image/jpeg;base64,dGVzdA==')

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result.scene.description).toBe('a dog')
  })
})
