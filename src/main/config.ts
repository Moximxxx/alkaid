// 配置管理

/// <reference types="node" />

import fs from 'fs'
import path from 'path'
import type { AppConfig } from '@shared/types'
import { DEFAULT_APP_CONFIG } from '@shared/constants'

// 配置存储路径：优先使用 APPDATA 环境变量（Windows），回退到当前工作目录
const CONFIG_DIR = path.join(process.env.APPDATA || process.cwd(), 'alkaid')
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json')

export class ConfigManager {
  private config: AppConfig

  constructor() {
    // 确保配置目录存在
    this.ensureConfigDir()
    this.config = this.loadConfig()
  }

  // 确保配置目录存在
  private ensureConfigDir(): void {
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true })
      }
    } catch (error) {
      console.error('创建配置目录失败:', error)
    }
  }

  // 加载配置
  private loadConfig(): AppConfig {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
        return { ...DEFAULT_APP_CONFIG, ...JSON.parse(raw) }
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    }
    return { ...DEFAULT_APP_CONFIG }
  }

  // 保存配置
  private saveConfig(): void {
    try {
      this.ensureConfigDir()
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2), 'utf-8')
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
