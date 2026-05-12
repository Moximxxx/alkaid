// 视觉分析管线服务
// 管理帧捕获定时器、自适应频率、帧去重、暂停/恢复

import { PIPELINE_DEFAULTS } from '@shared/constants'
import { logger } from '@shared/logger'

export interface VisionPipelineOptions {
  captureInterval?: number
  onFrame: (frame: string) => void
  /** 外部提供帧捕获函数 */
  captureFn: () => string | null
}

export interface VisionPipelineControls {
  start: () => void
  stop: () => void
  pause: () => void
  resume: () => void
  setInterval: (ms: number) => void
  captureNow: () => string | null
  isRunning: () => boolean
  isPaused: () => boolean
}

/**
 * 帧降分辨率：canvas 绘制时限制最大尺寸 320×240
 */
function downscaleFrame(
  base64: string,
  maxWidth: number,
  maxHeight: number,
): Promise<string> {
  return new Promise<string>((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }
      canvas.width = Math.round(width)
      canvas.height = Math.round(height)
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      resolve(canvas.toDataURL('image/jpeg', 0.6))
    }
    img.onerror = () => resolve(base64)
    img.src = base64
  })
}

/**
 * 帧去重：比较前后帧 base64 长度变化率
 */
function isFrameDuplicate(frameA: string | null, frameB: string, threshold: number): boolean {
  if (!frameA) return false
  const lenA = frameA.length
  const lenB = frameB.length
  const changeRate = Math.abs(lenA - lenB) / Math.max(lenA, lenB)
  return changeRate < threshold
}

// 自适应倍率（模块级）：AI 说话时自动加倍
let adaptiveMultiplier = 1

export function setVisionAdaptiveMultiplier(value: number) {
  adaptiveMultiplier = Math.max(1, value)
}

export function getVisionAdaptiveMultiplier(): number {
  return adaptiveMultiplier
}

export function createVisionPipeline(options: VisionPipelineOptions): VisionPipelineControls {
  const {
    captureInterval = PIPELINE_DEFAULTS.visionCaptureInterval,
    onFrame,
    captureFn,
  } = options

  let timerId: number | null = null
  let currentIntervalMs = captureInterval
  let pipelinePaused = false
  let pipelineRunning = false
  let lastFrameData: string | null = null

  const maxWidth = PIPELINE_DEFAULTS.frameMaxWidth
  const maxHeight = PIPELINE_DEFAULTS.frameMaxHeight
  const dedupThreshold = PIPELINE_DEFAULTS.frameDedupThreshold ?? 0.05

  async function captureAndProcess(): Promise<void> {
    if (pipelinePaused) return

    const rawFrame = captureFn()
    if (!rawFrame) return

    // 帧去重
    if (isFrameDuplicate(lastFrameData, rawFrame, dedupThreshold)) {
      return
    }

    // 降分辨率
    const downscaled = await downscaleFrame(rawFrame, maxWidth, maxHeight)
    lastFrameData = downscaled
    onFrame(downscaled)
  }

  function startTimer(): void {
    if (timerId !== null) {
      window.clearInterval(timerId)
    }
    const interval = currentIntervalMs * adaptiveMultiplier
    timerId = window.setInterval(() => {
      captureAndProcess().catch((err) => {
        logger.error('[VisionPipeline] captureAndProcess error:', err)
      })
    }, interval)
  }

  function stopTimer(): void {
    if (timerId !== null) {
      window.clearInterval(timerId)
      timerId = null
    }
  }

  function start(): void {
    if (pipelineRunning) return
    pipelineRunning = true
    pipelinePaused = false
    lastFrameData = null
    startTimer()
  }

  function stop(): void {
    pipelineRunning = false
    pipelinePaused = false
    stopTimer()
    lastFrameData = null
  }

  function pause(): void {
    pipelinePaused = true
  }

  function resume(): void {
    if (!pipelineRunning) return
    pipelinePaused = false
    startTimer()
  }

  function setPipelineInterval(ms: number): void {
    currentIntervalMs = ms
    if (pipelineRunning && !pipelinePaused) {
      startTimer()
    }
  }

  function captureNow(): string | null {
    if (!captureFn) return null
    return captureFn()
  }

  function isRunning(): boolean {
    return pipelineRunning
  }

  function isPaused(): boolean {
    return pipelinePaused
  }

  return {
    start,
    stop,
    pause,
    resume,
    setInterval: setPipelineInterval,
    captureNow,
    isRunning,
    isPaused,
  }
}
