/**
 * 简易日志工具 — 替代裸 console.log
 * 在浏览器开发工具和 Node.js 环境下均可工作
 */

const LOG_PREFIX = '[Alkaid]'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// 声明 electronAPI 类型，用于 IPC 日志转发
declare global {
  interface Window {
    electronAPI?: {
      logToFile?: (level: LogLevel, message: string, source: string) => void;
    }
  }
}

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

/**
 * 通过 IPC 将日志传输到 Electron 主进程进行文件落盘
 */
function transport(level: LogLevel, args: unknown[]): void {
  try {
    if (typeof window !== 'undefined' && window.electronAPI?.logToFile) {
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      window.electronAPI.logToFile(level, message, 'renderer');
    }
  } catch { /* 静默失败，不影响主功能 */ }
}

export const logger = {
  debug: (...args: unknown[]): void => {
    if (isDev) {
      console.debug(formatMessage('debug'), ...args)
    }
    transport('debug', args)
  },
  info: (...args: unknown[]): void => {
    console.info(formatMessage('info'), ...args)
    transport('info', args)
  },
  warn: (...args: unknown[]): void => {
    console.warn(formatMessage('warn'), ...args)
    transport('warn', args)
  },
  error: (...args: unknown[]): void => {
    console.error(formatMessage('error'), ...args)
    transport('error', args)
  },
}
