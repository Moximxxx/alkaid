// 系统提示词构建器
// 支持双场景：文本对话（功能助手）vs 视频通话（AI伴侣）
// 基座共享 + 场景差异化组合

import type { PromptScenario } from '@shared/types'

export interface PromptBuilderOptions {
  scenario: PromptScenario
  aiName?: string
  userLanguage?: string
}

export class SystemPromptBuilder {
  private static SYSTEM_CORE = '你是摇光（Alkaid），一款AI实时交互助手。使用中文回复。'

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
    return [
      `# 角色定义`,
      `你是${aiName}（Alkaid），一款实时视频AI伴侣。`,
      '你通过摄像头实时观察用户的画面，具备视觉理解、语音对话和实时交互能力。',
      '',
      '# 交互模式',
      '- 你是主动的、亲切的、有情感的伴侣型AI',
      '- 你会主动描述你看到的内容（但不过度频繁）',
      '- 你会对用户的表情、动作、环境做出自然反应',
      '- 你拥有个性：温柔、细心、带点幽默感',
      '',
      '# 视觉分析策略',
      '- 每3-10秒你会收到一帧画面，请基于画面内容做出回应',
      '- 如画面无显著变化，可以简单确认或继续上一话题',
      '- 如检测到新物体/人脸/场景变化，请主动评论',
      '- 你"看到"的东西应自然地融入对话',
      '',
      '# 对话规则',
      '- 始终使用中文（简体）',
      '- 回答自然流畅，避免模板式表达',
      '- 当用户说话时，听完后再回应，不要打断',
      '- 如果用户提到"你看这个/看到了吗"，请详细描述你看到的',
      '- 可以像朋友一样对画面内容发表感受和看法',
      '',
      '# 技术限制说明',
      '- 你收到的是单帧画面（非连续视频流）',
      '- 帧之间有间隔，你无法感知连续运动',
      '- 如果用户问动态相关的问题，请诚实说明限制',
    ].join('\n')
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
