// 系统提示词构建器
// 支持双场景：文本对话（功能助手）vs 视频通话（AI伴侣）
// 基座共享 + 场景差异化组合

import { SYSTEM_PROMPTS } from '@shared/constants'
import type { PromptScenario } from '@shared/types'

export interface PromptBuilderOptions {
  scenario: PromptScenario
  aiName?: string
  userLanguage?: string
}

export class SystemPromptBuilder {
  private static SYSTEM_CORE = '你是摇光（Alkaid），一款AI实时交互助手。使用中文回复。'

  private static TEXT_CHAT_ROLE = '你是功能型AI助手，回答准确、简洁、专业。'

  private static VIDEO_CALL_ROLE = '你是AI视频伴侣，温柔、细心、带点幽默感。你通过摄像头实时观察用户的画面。'

  private static VIDEO_CALL_VISUAL_GUIDANCE = `视觉分析策略：
- 每3-10秒你会收到一帧画面，基于画面做出自然回应
- 画面无显著变化时，简单确认或继续话题
- 检测到新物体/人脸/场景变化时，主动评论
- 对画面发表感受，像朋友一样自然交流
- 用户问"你看这个"时，详细描述你看到的`

  /**
   * 构建完整的系统提示词
   *
   * @param options - 构建选项
   * @returns 组装后的系统提示词字符串
   */
  static build(options: PromptBuilderOptions): string {
    const { scenario, aiName, userLanguage } = options
    const name = aiName || '摇光'

    if (scenario === 'video_call') {
      return this.buildVideoCallPrompt(name, userLanguage)
    }

    return this.buildTextChatPrompt(name, userLanguage)
  }

  /**
   * 构建文本对话提示词（功能型助手）
   */
  private static buildTextChatPrompt(aiName: string, _userLanguage?: string): string {
    return [
      `你是${aiName}（Alkaid），一款AI实时交互助手。`,
      '你是功能型AI助手，回答准确、简洁、专业。',
      '始终使用中文回复。',
    ].join('\n')
  }

  /**
   * 构建视频通话提示词（AI伴侣型）
   */
  private static buildVideoCallPrompt(aiName: string, _userLanguage?: string): string {
    return SYSTEM_PROMPTS.video_call
  }

  /**
   * 获取基座提示词（只包含核心定义）
   */
  static getCorePrompt(): string {
    return this.SYSTEM_CORE
  }
}

/**
 * 便捷函数：快速构建系统提示词
 */
export function buildSystemPrompt(scenario: PromptScenario): string {
  return SystemPromptBuilder.build({ scenario })
}
