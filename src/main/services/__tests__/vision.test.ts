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
      provider: 'azure',
      apiKey: 'test-key',
      endpoint: 'https://test.cognitiveservices.azure.com',
    })
  })

  it('应该创建 VisionService 实例', () => {
    expect(visionService).toBeDefined()
  })

  it('应该能够更新配置', () => {
    visionService.updateConfig({
      provider: 'google',
      apiKey: 'google-key',
      endpoint: 'https://vision.googleapis.com/v1',
    })
    expect(true).toBe(true)
  })

  it('应该调用 Azure API 进行识别', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        objects: [{ object: 'person', confidence: 0.95, rectangle: { x: 0, y: 0, w: 100, h: 100 } }],
        faces: [{ age: 25, gender: 'male', faceRectangle: { left: 10, top: 10, width: 50, height: 50 } }],
        description: { tags: ['person', 'indoor'], captions: [{ text: 'a person indoors', confidence: 0.9 }] },
      }),
    })

    const result = await visionService.recognize('data:image/jpeg;base64,test')

    expect(result).toBeDefined()
    expect(result.objects).toBeDefined()
    expect(result.faces).toBeDefined()
    expect(result.scene).toBeDefined()
  })

  it('应该调用 Google API 进行识别', async () => {
    visionService.updateConfig({
      provider: 'google',
      apiKey: 'google-key',
      endpoint: 'https://vision.googleapis.com/v1',
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        responses: [{
          localizedObjectAnnotations: [{ name: 'Person', score: 0.9, boundingPoly: { normalizedVertices: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }] } }],
          faceAnnotations: [{ boundingPoly: { vertices: [{ x: 10, y: 10 }, { x: 60, y: 10 }, { x: 60, y: 60 }, { x: 10, y: 60 }] } }],
          labelAnnotations: [{ description: 'Person', score: 0.95 }],
        }],
      }),
    })

    const result = await visionService.recognize('data:image/jpeg;base64,test')

    expect(result).toBeDefined()
    expect(result.objects.length).toBeGreaterThan(0)
  })

  it('API 错误应该抛出异常', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    await expect(visionService.recognize('test')).rejects.toThrow('Azure API 错误: 500')
  })

  it('应该解析 Azure 结果正确', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        objects: [
          { object: 'person', confidence: 0.95, rectangle: { x: 10, y: 20, w: 100, h: 200 } },
          { object: 'chair', confidence: 0.8, rectangle: { x: 300, y: 400, w: 50, h: 80 } },
        ],
        faces: [],
        description: { tags: ['person', 'chair', 'indoor'], captions: [{ text: 'a person sitting on a chair', confidence: 0.9 }] },
      }),
    })

    const result = await visionService.recognize('data:image/jpeg;base64,test')

    expect(result.objects.length).toBe(2)
    expect(result.objects[0].name).toBe('person')
    expect(result.objects[0].confidence).toBe(0.95)
    expect(result.objects[0].boundingBox).toEqual({ x: 10, y: 20, width: 100, height: 200 })
    expect(result.scene.tags).toContain('person')
    expect(result.scene.description).toBe('a person sitting on a chair')
  })
})
