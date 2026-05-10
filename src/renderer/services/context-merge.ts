// 上下文裁决器
// 决定每次 LLM 请求包含哪些模态数据（视觉帧 + 语音文本 + 文字输入）

import type { ChatMessage, PromptScenario } from '@shared/types'

/** 视觉相关关键词 —— 用户提到这些词时应当附带画面 */
const VISION_KEYWORDS = [
  '看', '画面', '图片', '图像', '照片', '摄像头', '镜头',
  '这个', '那个', '什么', '谁', '哪里',
  '看到', '看见', '发现', '注意',
  'look', 'see', 'watch', 'picture', 'image', 'photo',
  'what', 'who', 'where', 'this', 'that',
]

export interface ContextMergeInput {
  userText?: string
  sttText?: string
  latestFrame?: string
  previousFrames?: string[]
  conversationHistory: ChatMessage[]
}

export interface ContextMergeOutput {
  promptText: string
  image?: string
  tokenEstimate: number
  includedVision: boolean
  scenario: PromptScenario
}

/**
 * 检查文本是否包含视觉相关意图
 */
function hasVisionIntent(text: string): boolean {
  const lower = text.toLowerCase()
  return VISION_KEYWORDS.some((kw) => lower.includes(kw))
}

/**
 * 简单 token 估算
 */
function estimateTokens(text: string): number {
  let chineseChars = 0
  let otherChars = 0
  for (const char of text) {
    if (/[\u4e00-\u9fff]/.test(char)) {
      chineseChars++
    } else {
      otherChars++
    }
  }
  return Math.ceil(chineseChars * 1.5 + otherChars * 0.25)
}

/**
 * 比较两帧是否相似（基于 base64 长度变化率）
 */
function isFrameSimilar(frameA: string, frameB: string): boolean {
  if (!frameA || !frameB) return false
  const lenA = frameA.length
  const lenB = frameB.length
  const changeRate = Math.abs(lenA - lenB) / Math.max(lenA, lenB)
  return changeRate < 0.05
}

/**
 * 上下文合并主函数
 *
 * 逻辑：
 * - 如果用户明确问视觉相关内容 → 附带最新帧
 * - 纯语音聊天（无视觉相关）→ 不附带帧（省 token）
 * - 如果帧在上次分析后无变化 → 跳过帧
 * - 合并 STT 结果和用户输入文本（去重）
 * - 返回预估 token 数
 */
export function mergeContext(input: ContextMergeInput): ContextMergeOutput {
  const { userText, sttText, latestFrame, previousFrames, conversationHistory } = input

  // 合并文本（STT + 用户输入），去重
  const combinedText = [userText, sttText]
    .filter(Boolean)
    .join(' ')
    .trim()

  // 如果合并文本为空，可能是纯自动分析请求
  const promptText = combinedText || (latestFrame ? '请描述你看到的画面。' : '')

  // 判断是否需要附带图像
  let includedVision = false
  let image: string | undefined

  if (latestFrame) {
    const visionRelevant = hasVisionIntent(promptText)

    // 检查与上一帧是否相似
    const lastFrame = previousFrames && previousFrames.length > 0
      ? previousFrames[previousFrames.length - 1]
      : undefined
    const frameChanged = lastFrame ? !isFrameSimilar(latestFrame, lastFrame) : true

    if (visionRelevant || frameChanged) {
      image = latestFrame
      includedVision = true
    }
  }

  // 总 token 估算
  let tokenEstimate = estimateTokens(promptText)
  if (image) {
    tokenEstimate += 500 // 图片约 500 tokens
  }
  // 加上历史消息估算
  for (const msg of conversationHistory.slice(-10)) {
    tokenEstimate += estimateTokens(msg.content)
    if (msg.image) tokenEstimate += 500
  }

  // 根据是否包含视觉内容判断场景
  const scenario: PromptScenario = (includedVision || hasVisionIntent(promptText)) ? 'video_call' : 'text_chat'

  return {
    promptText,
    image,
    tokenEstimate,
    includedVision,
    scenario,
  }
}
