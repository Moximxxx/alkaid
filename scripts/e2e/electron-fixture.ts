// Electron 启动夹具

import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import * as path from 'path'

let electronApp: ElectronApplication | null = null
let capturedLogs: string[] = []

export async function startApp(): Promise<ElectronApplication> {
  electronApp = await electron.launch({
    args: [path.resolve(process.cwd(), 'electron', 'main.cjs')],
    env: {
      ...process.env,
      NODE_ENV: 'development',
    },
  })

  // 等待并获取主窗口（跳过 DevTools 窗口）
  const page = await waitForAppWindow(electronApp)

  // 监听控制台日志
  if (page) {
    page.on('console', (msg) => {
      capturedLogs.push(`[${msg.type()}] ${msg.text()}`)
    })
    page.on('pageerror', (err) => {
      capturedLogs.push(`[PAGE_ERROR] ${err.message}`)
    })
  }

  return electronApp
}

export async function getMainPage(app: ElectronApplication): Promise<Page> {
  const page = await waitForAppWindow(app)
  if (!page) throw new Error('No app window found')
  return page
}

async function waitForAppWindow(app: ElectronApplication): Promise<Page> {
  // DevTools 窗口打开时，firstWindow() 可能返回 DevTools 而非 App 窗口
  // 遍历所有窗口找到加载了本地应用的窗口（URL 含 localhost:5173 或 dist/index.html）
  const maxWait = 10000
  const startTime = Date.now()

  while (Date.now() - startTime < maxWait) {
    const windows = app.windows()
    for (const w of windows) {
      const url = w.url()
      // App 窗口 URL 包含 localhost:5173（开发模式）或 index.html（生产模式）
      if (url.includes('localhost:5173') || url.includes('index.html')) {
        return w
      }
    }
    await new Promise(r => setTimeout(r, 500))
  }

  // 降级：如果没有找到，返回第一个窗口
  return app.firstWindow()
}

export async function getCapturedLogs(): Promise<string[]> {
  return capturedLogs
}

export async function clearLogs(): Promise<void> {
  capturedLogs = []
}

export async function stopApp(): Promise<void> {
  if (electronApp) {
    await electronApp.close()
    electronApp = null
  }
}

export async function captureScreenshot(page: Page, name: string): Promise<string> {
  const screenshotDir = path.resolve(process.cwd(), 'scripts', 'e2e', 'screenshots')
  const filePath = path.join(screenshotDir, `${name}.png`)
  await page.screenshot({ path: filePath, fullPage: true })
  return filePath
}
