// 主进程入口

import { VisionService } from './services/vision'
import { AIService } from './services/ai'
import { configManager } from './config'

// 初始化服务
const visionService = new VisionService(configManager.getVisionConfig())
const aiService = new AIService(configManager.getAIConfig())

// 导出服务供渲染进程使用
export {
  visionService,
  aiService,
  configManager,
}

console.log('摇光 - 主进程已启动')
