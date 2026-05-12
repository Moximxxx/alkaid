import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DEFAULT_APP_CONFIG } from '@shared/constants'

// mock fs 和 path 以避免文件系统副作用
// 必须提供 default 导出，因为 config.ts 使用 import fs from 'fs'
const mockFs = {
  existsSync: vi.fn().mockReturnValue(false),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}
vi.mock('fs', () => ({ default: mockFs }))

const mockPath = {
  join: vi.fn((...args: string[]) => args.join('/')),
}
vi.mock('path', () => ({ default: mockPath }))

let configManager: import('../config').ConfigManager

describe('ConfigManager', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockFs.existsSync.mockReturnValue(false)

    const mod = await import('../config')
    configManager = mod.configManager
  })

  it('is defined', () => {
    expect(configManager).toBeDefined()
  })

  it('getConfig returns a copy of default config', () => {
    const cfg = configManager.getConfig()
    expect(cfg.vision.provider).toBe(DEFAULT_APP_CONFIG.vision.provider)
    expect(cfg.language).toBe(DEFAULT_APP_CONFIG.language)
    expect(cfg.autoRecognize).toBe(false)
  })

  it('getConfig returns different object each call', () => {
    const a = configManager.getConfig()
    const b = configManager.getConfig()
    expect(a).not.toBe(b)
  })

  it('updateConfig merges partial updates', () => {
    configManager.updateConfig({ language: 'zh-TW', autoRecognize: true })
    const cfg = configManager.getConfig()
    expect(cfg.language).toBe('zh-TW')
    expect(cfg.autoRecognize).toBe(true)
    // vision 配置不应被影响
    expect(cfg.vision.provider).toBe(DEFAULT_APP_CONFIG.vision.provider)
  })

  it('resetConfig restores defaults', () => {
    configManager.updateConfig({ language: 'ja-JP' })
    expect(configManager.getConfig().language).toBe('ja-JP')

    configManager.resetConfig()
    const cfg = configManager.getConfig()
    expect(cfg.language).toBe(DEFAULT_APP_CONFIG.language)
  })

  it('getCameraConfig returns camera config', () => {
    const cc = configManager.getCameraConfig()
    expect(cc).toHaveProperty('width', DEFAULT_APP_CONFIG.camera.width)
    expect(cc).toHaveProperty('height', DEFAULT_APP_CONFIG.camera.height)
  })

  it('getVisionConfig returns vision config', () => {
    const vc = configManager.getVisionConfig()
    expect(vc).toHaveProperty('provider', DEFAULT_APP_CONFIG.vision.provider)
    expect(vc).toHaveProperty('apiKey')
  })

  it('getAIConfig returns ai config', () => {
    const ac = configManager.getAIConfig()
    expect(ac).toHaveProperty('provider', DEFAULT_APP_CONFIG.ai.provider)
    expect(ac).toHaveProperty('model')
  })
})
