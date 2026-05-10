// AI 说话中断控制器
// 管理 AbortController 引用，用于 VAD 检测到用户说话时中断 AI 回复

export interface InterruptControllerOptions {
  onInterrupt?: () => void
  onResume?: () => void
}

export interface InterruptControllerControls {
  abort: () => void
  reset: () => void
  isInterrupted: () => boolean
  setAbortController: (controller: AbortController | null) => void
}

export class InterruptController implements InterruptControllerControls {
  private aborted = false
  private abortController: AbortController | null = null
  private onInterrupt: (() => void) | undefined
  private onResume: (() => void) | undefined

  constructor(options: InterruptControllerOptions = {}) {
    this.onInterrupt = options.onInterrupt
    this.onResume = options.onResume
  }

  /**
   * 中断当前 AI 回复
   * 触发 AbortController.abort() + onInterrupt 回调
   */
  abort(): void {
    if (this.aborted) return
    this.aborted = true

    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }

    this.onInterrupt?.()
  }

  /**
   * 重置中断状态
   */
  reset(): void {
    this.aborted = false
    this.abortController = null
    this.onResume?.()
  }

  /**
   * 当前是否处于中断状态
   */
  isInterrupted(): boolean {
    return this.aborted
  }

  /**
   * 设置/更新 AbortController 引用
   */
  setAbortController(controller: AbortController | null): void {
    this.abortController = controller
  }
}
