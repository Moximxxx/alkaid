// 图像识别服务

import type { VisionConfig, RecognitionResult } from '@shared/types'
import { configManager } from '../config'

export class VisionService {
  private config: VisionConfig

  constructor(config: VisionConfig) {
    this.config = config
  }

  // 更新配置
  updateConfig(config: VisionConfig): void {
    this.config = config
  }

  // 识别图像
  async recognize(imageBase64: string): Promise<RecognitionResult> {
    const provider = this.config.provider

    if (provider === 'doubao') {
      return this.recognizeWithDoubao(imageBase64)
    }

    throw new Error(`不支持的识别服务: ${provider}`)
  }

  // 豆包视觉识别
  private async recognizeWithDoubao(imageBase64: string): Promise<RecognitionResult> {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')

    const response = await fetch(
      'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: '请分析这张图片中的物体、人脸和场景描述，用中文回复。' },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Data}` } },
              ],
            },
          ],
          max_tokens: 1024,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`豆包视觉 API 错误: ${response.status}`)
    }

    const data = await response.json()
    return this.parseDoubaoResult(data)
  }

  // 解析豆包结果
  private parseDoubaoResult(data: any): RecognitionResult {
    const content = data.choices[0].message.content
    return {
      objects: [],
      faces: [],
      scene: {
        tags: [],
        description: content,
        confidence: 1,
      },
      timestamp: Date.now(),
    }
  }
}

// 创建单例实例
export const visionService = new VisionService(configManager.getVisionConfig())

export default VisionService
