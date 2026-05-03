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

    if (provider === 'azure') {
      return this.recognizeWithAzure(imageBase64)
    } else if (provider === 'google') {
      return this.recognizeWithGoogle(imageBase64)
    }

    throw new Error(`不支持的识别服务: ${provider}`)
  }

  // Azure Computer Vision
  private async recognizeWithAzure(imageBase64: string): Promise<RecognitionResult> {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
    const binaryData = atob(base64Data)
    const uint8Array = new Uint8Array(binaryData.length)
    for (let i = 0; i < binaryData.length; i++) {
      uint8Array[i] = binaryData.charCodeAt(i)
    }

    const response = await fetch(
      `${this.config.endpoint}/vision/v3.2/analyze?visualFeatures=Objects,Faces,Description&language=zh`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': this.config.apiKey,
        },
        body: uint8Array,
      }
    )

    if (!response.ok) {
      throw new Error(`Azure API 错误: ${response.status}`)
    }

    const data = await response.json()
    return this.parseAzureResult(data)
  }

  // Google Cloud Vision
  private async recognizeWithGoogle(imageBase64: string): Promise<RecognitionResult> {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')

    const response = await fetch(
      `${this.config.endpoint}/images:annotate?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Data },
              features: [
                { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
                { type: 'FACE_DETECTION', maxResults: 5 },
                { type: 'LABEL_DETECTION', maxResults: 10 },
              ],
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Google API 错误: ${response.status}`)
    }

    const data = await response.json()
    return this.parseGoogleResult(data.responses[0])
  }

  // 解析Azure结果
  private parseAzureResult(data: any): RecognitionResult {
    return {
      objects: (data.objects || []).map((obj: any) => ({
        name: obj.object,
        confidence: obj.confidence,
        boundingBox: {
          x: obj.rectangle.x,
          y: obj.rectangle.y,
          width: obj.rectangle.w,
          height: obj.rectangle.h,
        },
      })),
      faces: (data.faces || []).map((face: any) => ({
        age: face.age,
        gender: face.gender,
        boundingBox: {
          x: face.faceRectangle.left,
          y: face.faceRectangle.top,
          width: face.faceRectangle.width,
          height: face.faceRectangle.height,
        },
      })),
      scene: {
        tags: data.description?.tags || [],
        description: data.description?.captions?.[0]?.text || '',
        confidence: data.description?.captions?.[0]?.confidence || 0,
      },
      timestamp: Date.now(),
    }
  }

  // 解析Google结果
  private parseGoogleResult(data: any): RecognitionResult {
    return {
      objects: (data.localizedObjectAnnotations || []).map((obj: any) => ({
        name: obj.name,
        confidence: obj.score,
        boundingBox: {
          x: obj.boundingPoly.normalizedVertices[0]?.x || 0,
          y: obj.boundingPoly.normalizedVertices[0]?.y || 0,
          width: (obj.boundingPoly.normalizedVertices[2]?.x || 0) - (obj.boundingPoly.normalizedVertices[0]?.x || 0),
          height: (obj.boundingPoly.normalizedVertices[2]?.y || 0) - (obj.boundingPoly.normalizedVertices[0]?.y || 0),
        },
      })),
      faces: (data.faceAnnotations || []).map((face: any) => ({
        boundingBox: {
          x: face.boundingPoly.vertices[0]?.x || 0,
          y: face.boundingPoly.vertices[0]?.y || 0,
          width: (face.boundingPoly.vertices[2]?.x || 0) - (face.boundingPoly.vertices[0]?.x || 0),
          height: (face.boundingPoly.vertices[2]?.y || 0) - (face.boundingPoly.vertices[0]?.y || 0),
        },
      })),
      scene: {
        tags: (data.labelAnnotations || []).map((label: any) => label.description),
        description: (data.labelAnnotations || []).map((label: any) => label.description).join(', '),
        confidence: data.labelAnnotations?.[0]?.score || 0,
      },
      timestamp: Date.now(),
    }
  }
}

// 创建单例实例
export const visionService = new VisionService(configManager.getVisionConfig())

export default VisionService
