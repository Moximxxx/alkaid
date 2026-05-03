// 配置管理

import type { AppConfig } from '@shared/types'
import { DEFAULT_APP_CONFIG } from '@shared/constants'

const CONFIG_KEY = 'camera-ai-config'

export class ConfigManager {
  private config: AppConfig

  constructor() {
    this.config = this.loadConfig()
  }

  // 加载配置
  private loadConfig(): AppConfig {
    try {
      const saved = localStorage.getItem(CONFIG_KEY)
      if (saved) {
        return { ...DEFAULT_APP_CONFIG, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    }
    return { ...DEFAULT_APP_CONFIG }
  }

  // 保存配置
  private saveConfig(): void {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config))
    } catch (error) {
      console.error('保存配置失败:', error)
    }
  }

  // 获取配置
  getConfig(): AppConfig {
    return { ...this.config }
  }

  // 更新配置
  updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates }
    this.saveConfig()
  }

  // 获取摄像头配置
  getCameraConfig() {
    return this.config.camera
  }

  // 获取图像识别配置
  getVisionConfig() {
    return this.config.vision
  }

  // 获取AI配置
  getAIConfig() {
    return this.config.ai
  }

  // 重置配置
  resetConfig(): void {
    this.config = { ...DEFAULT_APP_CONFIG }
    this.saveConfig()
  }
}

// 导出单例
export const configManager = new ConfigManager()
