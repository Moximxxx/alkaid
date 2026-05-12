/**
 * 简易日志工具 — 替代裸 console.log
 * 在浏览器开发工具和 Node.js 环境下均可工作
 */

const LOG_PREFIX = '[Alkaid]'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_ICON: Record<LogLevel, string> = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
}

function formatMessage(level: LogLevel): string {
  return `${LEVEL_ICON[level]} ${LOG_PREFIX} [${level.toUpperCase()}]`
}

// 检测开发环境：优先使用 import.meta.env（Vite/renderer），回退到 process.env（Node.js/main）
function checkDev(): boolean {
  try {
    return (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true
  } catch {
    return typeof process !== 'undefined' && process.env.NODE_ENV === 'development'
  }
}

const isDev = checkDev()

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug(formatMessage('debug'), ...args)
    }
  },
  info: (...args: unknown[]) => {
    console.info(formatMessage('info'), ...args)
  },
  warn: (...args: unknown[]) => {
    console.warn(formatMessage('warn'), ...args)
  },
  error: (...args: unknown[]) => {
    console.error(formatMessage('error'), ...args)
  },
}
