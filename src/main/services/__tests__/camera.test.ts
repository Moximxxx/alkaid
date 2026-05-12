import { CameraService, cameraService } from '../camera'
import { describe, it, expect } from 'vitest'

describe('CameraService', () => {
  it('exports singleton', () => {
    expect(cameraService).toBeInstanceOf(CameraService)
  })

  it('can instantiate new instance', () => {
    expect(new CameraService()).toBeDefined()
  })

  it('singleton is same instance', () => {
    const a = cameraService
    const b = cameraService
    expect(a).toBe(b)
  })
})
