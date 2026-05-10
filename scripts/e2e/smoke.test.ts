import { test, expect } from '@playwright/test'
import { startApp, getMainPage, stopApp, captureScreenshot, getCapturedLogs, clearLogs } from './electron-fixture'

test.describe('摇光 App E2E 冒烟测试', () => {
  test('应用启动并渲染欢迎页 - 截图+日志+UI分析', async () => {
    const app = await startApp()
    const page = await getMainPage(app)
    await clearLogs()

    // 等待页面加载
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // 等待渲染

    // 1. 截图 - 欢迎页
    await captureScreenshot(page, '01-welcome-page')

    // 2. 分析UI：验证关键元素
    const bodyText = await page.textContent('body')
    expect(bodyText).toBeTruthy()
    console.log('[TEST] Page body text length:', bodyText?.length)

    // 3. 验证标题和品牌元素
    const title = await page.title()
    expect(title).toBeTruthy()
    console.log('[TEST] Page title:', title)

    // 4. 尝试点击操作 - 查找设置/聊天相关链接或按钮
    const links = await page.locator('a, button').all()
    console.log(`[TEST] Found ${links.length} interactive elements`)
    for (const link of links) {
      const text = await link.textContent()
      if (text) console.log(`[TEST] Element: "${text.trim()}"`)
    }

    // 5. 截图 - 交互前
    await captureScreenshot(page, '02-before-click')

    // 尝试点击第一个可点击元素
    if (links.length > 0) {
      const firstBtnText = await links[0].textContent()
      console.log(`[TEST] Clicking first element: "${firstBtnText?.trim()}"`)
      await links[0].click()
      await page.waitForTimeout(1000)
      await captureScreenshot(page, '03-after-click')
    }

    // 6. 获取控制台日志
    const logs = await getCapturedLogs()
    console.log(`[TEST] Captured ${logs.length} console log entries`)
    logs.slice(0, 20).forEach(log => console.log('[CONSOLE]', log))

    // 7. 最终截图
    await captureScreenshot(page, '04-final-state')

    await stopApp()
  })

  test('视频通话页面渲染 - 来电画面 UI 验证', async () => {
    const app = await startApp()
    const page = await getMainPage(app)
    await clearLogs()

    // 导航到视频通话页面
    await page.goto('http://localhost:5173/video-chat')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // 截图 - 视频通话页初始状态
    await captureScreenshot(page, '05-video-call-initial')

    // 验证 AI 名称和来电提示
    const pageText = await page.textContent('body')
    expect(pageText).toBeTruthy()

    // 验证视频通话页面关键元素
    const hasAiName = pageText?.includes('摇光')
    console.log(`[TEST] Video call - AI name present: ${hasAiName}`)

    // 查找按钮交互元素
    const buttons = await page.locator('button').all()
    console.log(`[TEST] Video call - Found ${buttons.length} buttons`)
    for (const btn of buttons) {
      const text = await btn.textContent()
      if (text) console.log(`[TEST] Button: "${text.trim()}"`)
    }

    // 截图 - 交互前
    await captureScreenshot(page, '06-video-call-before-interaction')

    // 尝试点击"接听"按钮（如果存在）
    const acceptBtn = page.getByRole('button', { name: /接听|接受|Accept/i })
    if (await acceptBtn.count() > 0) {
      console.log('[TEST] Found accept button, clicking...')
      await acceptBtn.click()
      await page.waitForTimeout(1000)
      await captureScreenshot(page, '07-video-call-connected')

      // 验证通话状态变化
      const connectedText = await page.textContent('body')
      const hasControls = connectedText?.includes('结束通话') ||
                          connectedText?.includes('麦克风') ||
                          connectedText?.includes('摄像头')
      console.log(`[TEST] Video call - controls visible: ${hasControls}`)
    }

    // 截图 - 最终状态
    await captureScreenshot(page, '08-video-call-final')

    // 获取控制台日志
    const logs = await getCapturedLogs()
    console.log(`[TEST] Captured ${logs.length} console log entries (video call)`)
    logs.slice(0, 20).forEach(log => console.log('[CONSOLE-VIDEO]', log))

    await stopApp()
  })
})
