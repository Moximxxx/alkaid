import { chromium } from '@playwright/test';
import * as fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  // 捕获控制台日志
  const consoleLogs = { info: [], warn: [], error: [] };
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') consoleLogs.error.push(text);
    else if (type === 'warn') consoleLogs.warn.push(text);
    else consoleLogs.info.push(text);
  });

  // 捕获 page error
  const pageErrors = [];
  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  console.log('Navigating to http://localhost:5173 ...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });

  // 等待 JS 完全加载
  console.log('Waiting 5s for JS to fully load...');
  await page.waitForTimeout(5000);

  // 检查是否有 React 错误 overlay
  const hasErrorOverlay = await page.evaluate(() => {
    return document.querySelector("body > div#vite-plugin-react-error-overlay") !== null;
  }).catch(() => false);

  // 检查是否有 Vite 错误 overlay
  const hasViteErrorOverlay = await page.evaluate(() => {
    return document.querySelector("vite-error-overlay") !== null || document.querySelector("vite-plugin-error-overlay") !== null;
  }).catch(() => false);

  // 检查页面标题
  const title = await page.title().catch(() => '(no title)');

  // 截图
  const screenshotPath = '.opencode/tmp/screenshot.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved to ${screenshotPath}`);

  // 获取页面可见文本摘要
  const pageText = await page.evaluate(() => {
    const body = document.body;
    if (!body) return '(no body)';
    const clone = body.cloneNode(true);
    // 移除 script/style/svg/canvas 元素
    const removeTags = clone.querySelectorAll('script, style, svg, canvas');
    removeTags.forEach(el => el.remove());
    return clone.innerText.substring(0, 3000);
  }).catch(() => '(page text unavailable)');

  // 获取所有可见元素类型数量
  const elementCounts = await page.evaluate(() => {
    const all = document.querySelectorAll("*");
    const counts = {};
    all.forEach(el => {
      const tag = el.tagName.toLowerCase();
      counts[tag] = (counts[tag] || 0) + 1;
    });
    return counts;
  }).catch(() => ({}));

  // 检查是否有 canvas 元素（摄像头区域）
  const hasCanvas = await page.evaluate(() => {
    return document.querySelectorAll("canvas").length;
  }).catch(() => 0);

  // 检查是否有 video 元素
  const hasVideo = await page.evaluate(() => {
    return document.querySelectorAll("video").length;
  }).catch(() => 0);

  // 检查是否有报错信息显示在页面上
  const errorTexts = await page.evaluate(() => {
    const errors = [];
    document.querySelectorAll('[class*="error"], [class*="Error"], [role="alert"]').forEach(el => {
      const t = el.textContent;
      if (t) errors.push(t.substring(0, 500));
    });
    return errors;
  }).catch(() => []);

  const result = {
    url: page.url(),
    title,
    hasErrorOverlay,
    hasViteErrorOverlay,
    hasCanvas,
    hasVideo,
    elementCounts,
    consoleLogs,
    pageErrors,
    errorTexts,
    pageTextPreview: pageText.substring(0, 2000),
    screenshotPath,
  };

  // 输出结果到 JSON
  fs.writeFileSync('.opencode/tmp/smoke-result.json', JSON.stringify(result, null, 2));
  console.log('Result saved to .opencode/tmp/smoke-result.json');

  // 打印关键信息
  console.log('\n=== 烟雾测试结果 ===');
  console.log(`URL: ${result.url}`);
  console.log(`Title: ${result.title}`);
  console.log(`Error Overlay (React): ${result.hasErrorOverlay}`);
  console.log(`Error Overlay (Vite): ${result.hasViteErrorOverlay}`);
  console.log(`Canvas elements: ${result.hasCanvas}`);
  console.log(`Video elements: ${result.hasVideo}`);
  console.log(`Console errors: ${result.consoleLogs.error.length}`);
  console.log(`Page errors: ${result.pageErrors.length}`);
  console.log(`Error texts in DOM: ${result.errorTexts.length}`);
  console.log(`\nConsole errors:`);
  result.consoleLogs.error.forEach(e => console.log(`  ERROR: ${e}`));
  result.pageErrors.forEach(e => console.log(`  PAGE_ERROR: ${e}`));
  console.log('\nDOM error texts:');
  result.errorTexts.forEach(e => console.log(`  ${e}`));
  console.log('\n=== Page text preview ===');
  console.log(result.pageTextPreview.substring(0, 1000));

  await browser.close();
})();
