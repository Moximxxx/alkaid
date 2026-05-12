// 中断控制器测试
import { describe, it, expect, vi } from 'vitest'
import { InterruptController } from '../interrupt-controller'

describe('InterruptController', () => {
  describe('abort / isInterrupted', () => {
    it('初始状态 isInterrupted = false', () => {
      const ctrl = new InterruptController()
      expect(ctrl.isInterrupted()).toBe(false)
    })

    it('abort 后 isInterrupted = true', () => {
      const ctrl = new InterruptController()
      ctrl.abort()
      expect(ctrl.isInterrupted()).toBe(true)
    })

    it('多次 abort 安全（不会重复触发）', () => {
      const onInterrupt = vi.fn()
      const ctrl = new InterruptController({ onInterrupt })
      ctrl.abort()
      ctrl.abort()
      ctrl.abort()
      expect(onInterrupt).toHaveBeenCalledTimes(1)
    })
  })

  describe('reset', () => {
    it('reset 后 isInterrupted = false', () => {
      const ctrl = new InterruptController()
      ctrl.abort()
      expect(ctrl.isInterrupted()).toBe(true)
      ctrl.reset()
      expect(ctrl.isInterrupted()).toBe(false)
    })

    it('reset 触发 onResume 回调', () => {
      const onResume = vi.fn()
      const ctrl = new InterruptController({ onResume })
      ctrl.abort()
      ctrl.reset()
      expect(onResume).toHaveBeenCalledTimes(1)
    })

    it('未 abort 时 reset 仍可触发 onResume', () => {
      const onResume = vi.fn()
      const ctrl = new InterruptController({ onResume })
      ctrl.reset()
      expect(onResume).toHaveBeenCalledTimes(1)
      expect(ctrl.isInterrupted()).toBe(false)
    })
  })

  describe('回调触发', () => {
    it('abort 触发 onInterrupt 回调', () => {
      const onInterrupt = vi.fn()
      const ctrl = new InterruptController({ onInterrupt })
      ctrl.abort()
      expect(onInterrupt).toHaveBeenCalledTimes(1)
    })

    it('无回调时 abort 不报错', () => {
      const ctrl = new InterruptController()
      expect(() => ctrl.abort()).not.toThrow()
    })

    it('无回调时 reset 不报错', () => {
      const ctrl = new InterruptController()
      expect(() => ctrl.reset()).not.toThrow()
    })
  })

  describe('setAbortController', () => {
    it('保存 AbortController 引用', () => {
      const ctrl = new InterruptController()
      const ac = new AbortController()
      ctrl.setAbortController(ac)
      expect(ctrl.isInterrupted()).toBe(false)
    })

    it('abort 时调用 AbortController.abort()', () => {
      const ctrl = new InterruptController()
      const ac = new AbortController()
      const abortSpy = vi.spyOn(ac, 'abort')
      ctrl.setAbortController(ac)
      ctrl.abort()
      expect(abortSpy).toHaveBeenCalledTimes(1)
    })

    it('abort 后 AbortController 引用被清除', () => {
      const ctrl = new InterruptController()
      const ac = new AbortController()
      ctrl.setAbortController(ac)
      ctrl.abort()
      // 再次 abort 不会再次调用 ac.abort
      const abortSpy = vi.spyOn(ac, 'abort')
      ctrl.abort()
      expect(abortSpy).not.toHaveBeenCalled()
    })

    it('setAbortController(null) 清除引用', () => {
      const ctrl = new InterruptController()
      const ac = new AbortController()
      ctrl.setAbortController(ac)
      ctrl.setAbortController(null)
      // abort 不会触发 ac.abort
      const abortSpy = vi.spyOn(ac, 'abort')
      ctrl.abort()
      expect(abortSpy).not.toHaveBeenCalled()
    })

    it('可以多次 setAbortController 更换引用', () => {
      const ctrl = new InterruptController()
      const ac1 = new AbortController()
      const ac2 = new AbortController()
      const spy1 = vi.spyOn(ac1, 'abort')
      const spy2 = vi.spyOn(ac2, 'abort')

      ctrl.setAbortController(ac1)
      ctrl.setAbortController(ac2)
      ctrl.abort()

      expect(spy1).not.toHaveBeenCalled()
      expect(spy2).toHaveBeenCalledTimes(1)
    })
  })
})
