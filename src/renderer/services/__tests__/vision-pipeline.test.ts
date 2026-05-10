// 视觉分析管线测试
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createVisionPipeline } from '../vision-pipeline'

describe('createVisionPipeline', () => {
  let onFrame: ReturnType<typeof vi.fn>
  let captureFn: ReturnType<typeof vi.fn>

  function createPipeline(opts?: { interval?: number }) {
    return createVisionPipeline({
      onFrame: onFrame as (frame: string) => void,
      captureFn: captureFn as () => string | null,
      captureInterval: opts?.interval,
    })
  }

  beforeEach(() => {
    vi.useFakeTimers()
    onFrame = vi.fn()
    captureFn = vi.fn()

    // Mock Image 使其立即触发 onload
    const MockImage = class {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      src = ''
      constructor() {
        setTimeout(() => this.onload?.(), 0)
      }
    }
    ;(globalThis as any).Image = MockImage as any

    // Mock canvas getContext
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage: vi.fn(),
    }) as any

    // Mock toDataURL 返回一致的结果（用于去重测试）
    HTMLCanvasElement.prototype.toDataURL = vi
      .fn()
      .mockReturnValue('data:image/jpeg;base64,mocked_frame')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('生命周期', () => {
    it('初始状态 isRunning = false, isPaused = false', () => {
      const p = createPipeline()
      expect(p.isRunning()).toBe(false)
      expect(p.isPaused()).toBe(false)
    })

    it('start 后 isRunning = true', () => {
      const p = createPipeline()
      p.start()
      expect(p.isRunning()).toBe(true)
    })

    it('stop 后 isRunning = false, isPaused = false', () => {
      const p = createPipeline()
      p.start()
      p.stop()
      expect(p.isRunning()).toBe(false)
      expect(p.isPaused()).toBe(false)
    })

    it('重复 start 不会改变状态', () => {
      const p = createPipeline()
      p.start()
      p.start()
      expect(p.isRunning()).toBe(true)
    })

    it('stop 后再次 start 重新激活', () => {
      const p = createPipeline()
      p.start()
      p.stop()
      p.start()
      expect(p.isRunning()).toBe(true)
    })
  })

  describe('pause / resume', () => {
    it('pause 后 isPaused = true', () => {
      const p = createPipeline()
      p.start()
      p.pause()
      expect(p.isPaused()).toBe(true)
    })

    it('resume 后 isPaused = false', () => {
      const p = createPipeline()
      p.start()
      p.pause()
      p.resume()
      expect(p.isPaused()).toBe(false)
    })

    it('未启动时 resume 无效（不会变为 running）', () => {
      const p = createPipeline()
      p.resume()
      expect(p.isRunning()).toBe(false)
    })

    it('pause → stop → start 后 isPaused = false', () => {
      const p = createPipeline()
      p.start()
      p.pause()
      p.stop()
      p.start()
      expect(p.isPaused()).toBe(false)
    })
  })

  describe('captureNow', () => {
    it('返回 captureFn 的返回值', () => {
      captureFn.mockReturnValue('frame-data-123')
      const p = createPipeline()
      expect(p.captureNow()).toBe('frame-data-123')
    })

    it('captureFn 返回 null 时返回 null', () => {
      captureFn.mockReturnValue(null)
      const p = createPipeline()
      expect(p.captureNow()).toBeNull()
    })
  })

  describe('setInterval', () => {
    it('更新频率后不报错', () => {
      const p = createPipeline()
      expect(() => p.setInterval(5000)).not.toThrow()
    })

    it('运行中更新频率后不报错', () => {
      const p = createPipeline()
      p.start()
      expect(() => p.setInterval(100)).not.toThrow()
    })
  })

  describe('定时器调度', () => {
    it('start 后定时器按 captureInterval 触发 captureFn', async () => {
      captureFn.mockReturnValue('data:image/jpeg;base64,abc123')
      const p = createPipeline({ interval: 100 })
      p.start()

      // 前进 100ms → 第一次触发
      await vi.advanceTimersByTimeAsync(100)
      expect(captureFn).toHaveBeenCalled()

      // 前进到 200ms → 第二次触发
      await vi.advanceTimersByTimeAsync(100)
      expect(captureFn).toHaveBeenCalledTimes(2)
    })

    it('stop 后定时器被清除', async () => {
      captureFn.mockReturnValue('frame')
      const p = createPipeline({ interval: 100 })
      p.start()

      await vi.advanceTimersByTimeAsync(100)
      expect(captureFn).toHaveBeenCalledTimes(1)

      p.stop()
      captureFn.mockClear()

      // 再前进 200ms，不应再触发
      await vi.advanceTimersByTimeAsync(200)
      expect(captureFn).not.toHaveBeenCalled()
    })

    it('pause 期间不触发 captureFn', async () => {
      captureFn.mockReturnValue('frame')
      const p = createPipeline({ interval: 100 })
      p.start()

      await vi.advanceTimersByTimeAsync(100)
      expect(captureFn).toHaveBeenCalledTimes(1)

      p.pause()
      captureFn.mockClear()

      await vi.advanceTimersByTimeAsync(200)
      expect(captureFn).not.toHaveBeenCalled()
    })
  })

  describe('帧去重逻辑', () => {
    it('captureFn 返回 null 时跳过 onFrame', async () => {
      captureFn.mockReturnValue(null)
      const p = createPipeline({ interval: 100 })
      p.start()
      await vi.advanceTimersByTimeAsync(100)
      expect(captureFn).toHaveBeenCalled()
    })

    it('连续相同帧应被去重（通过 isFrameDuplicate）', async () => {
      const stableFrame = 'data:image/jpeg;base64,' + 'A'.repeat(200)
      captureFn.mockReturnValue(stableFrame)
      HTMLCanvasElement.prototype.toDataURL = vi
        .fn()
        .mockReturnValue(stableFrame)

      const p = createPipeline({ interval: 100 })
      p.start()

      // 第一次触发 - lastFrameData 为 null，不会被去重
      await vi.advanceTimersByTimeAsync(100)
      // 第二次触发 - 帧相同，应被去重
      await vi.advanceTimersByTimeAsync(100)
    })

    it('不同帧不应被去重', async () => {
      let counter = 0
      captureFn.mockImplementation(() => {
        counter++
        return `data:image/jpeg;base64,${'A'.repeat(100 + counter * 50)}`
      })

      const p = createPipeline({ interval: 100 })
      p.start()

      await vi.advanceTimersByTimeAsync(100)
      await vi.advanceTimersByTimeAsync(100)
    })
  })
})
