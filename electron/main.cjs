const { app, BrowserWindow, ipcMain, globalShortcut, session } = require('electron');
const path = require('path');
const http = require('http');
const { createLogger } = require('./lib/logger.cjs');

const PROVIDER_CONFIGS = {
  doubao: { baseUrl: 'https://ark.cn-beijing.volces.com/api/v3' },
  openai: { baseUrl: 'https://api.openai.com/v1' },
  glm: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4' },
  minimax: { baseUrl: 'https://api.minimax.chat/v1' },
  xiaomi: { baseUrl: 'https://api.mimo.minimax.io/v1' },
  kimi: { baseUrl: 'https://api.moonshot.cn/v1' },
  deepseek: { baseUrl: 'https://api.deepseek.com/v1' },
  claude: { baseUrl: 'https://api.anthropic.com/v1' },
  google: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
  google_vision: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
}

let mainWindow = null;
let proxyServer = null;
let isProxyServerRunning = false;
let isReady = false;
let isWaitingForServer = false;
let log = null;

function waitForViteServer(maxWaitTime = 30000) {
  if (isWaitingForServer || isReady) {
    return Promise.resolve();
  }
  isWaitingForServer = true;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    log?.info('Waiting for Vite server...');

    function checkServer() {
      const req = http.get('http://localhost:5173', (res) => {
        if (res.statusCode === 200) {
          log?.info('Vite server is ready!');
          resolve();
        } else {
          retry();
        }
      });

      req.on('error', () => {
        retry();
      });

      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    }

    function retry() {
      if (Date.now() - startTime > maxWaitTime) {
        reject(new Error('Vite server timeout'));
        return;
      }
      setTimeout(checkServer, 500);
    }

    checkServer();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: '摇光 - 摄像头AI助手',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('ready')
  })

  log?.info('Window created');
}

app.whenReady().then(async () => {
  if (isReady) {
    return;
  }
  isReady = true;

  // 设置 Content-Security-Policy（必须在 app ready 之后）
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws://localhost:* https://*; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self' data:"
        ]
      }
    })
  })

  log = createLogger(app.getPath('userData'));
  log.info('App starting...');

  log?.info('App ready, waiting for Vite server...');

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    try {
      await waitForViteServer();
    } catch (err) {
      log.error(`Failed to wait for Vite server: ${err.message}`);
      log.error('Please make sure Vite dev server is running on http://localhost:5173');
      app.quit();
      return;
    }
  }

  createWindow();

  // 注册全局快捷键 CommandOrControl+Shift+A
  const shortcutRegistered = globalShortcut.register('CommandOrControl+Shift+A', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
  if (!shortcutRegistered) {
    log.error('Failed to register global shortcut');
    // 降级为窗口级快捷键
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      win.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.shift && input.key.toLowerCase() === 'a' && !input.type.startsWith('keyUp')) {
          event.preventDefault();
          if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
          }
        }
      });
      log.info('Fallback: registered window-level Ctrl+Shift+A');
      // 通知 renderer 显示提示
      win.webContents.send('shortcut-warning', '全局快捷键被占用，已降级为窗口内快捷键');
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  log?.info('App quitting...');
  globalShortcut.unregisterAll()
  if (proxyServer) proxyServer.close()
});

// IPC handlers for window controls
ipcMain.handle('window:minimize', () => mainWindow?.minimize())
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.handle('window:close', () => mainWindow?.close())

const VALID_LOG_LEVELS = ['debug', 'info', 'warn', 'error'];

// IPC handler for renderer-side log forwarding
ipcMain.handle('log:write', (event, { level, message, source }) => {
  if (log && VALID_LOG_LEVELS.includes(level)) {
    log[level](message, source || 'renderer');
  }
});

function startProxyServer() {
  if (isProxyServerRunning) return
  isProxyServerRunning = true

  proxyServer = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS' && req.url === '/api/ai/chat') {
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version, x-goog-api-key')
      res.end()
      return
    }
    if (req.method === 'POST' && req.url === '/api/ai/chat') {
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version, x-goog-api-key')
      let body = ''
      let bodySize = 0
      req.on('data', chunk => {
        bodySize += chunk.length
        if (bodySize > 10 * 1024 * 1024) {
          res.writeHead(413, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Request too large' }))
          req.destroy()
          return
        }
        body += chunk
      })
      req.on('end', async () => {
        try {
          const { provider, model, messages, apiKey, stream } = JSON.parse(body)
          const providerConfig = PROVIDER_CONFIGS[provider]
          if (!providerConfig) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: `Unknown provider: ${provider}` }))
            return
          }

          const isClaude = provider === 'claude'
          const isGoogle = provider === 'google' || provider === 'google_vision'

          // Build API URL
          let apiUrl
          if (isClaude) {
            apiUrl = `${providerConfig.baseUrl}/messages`
          } else if (isGoogle) {
            apiUrl = `${providerConfig.baseUrl}/models/${model}:streamGenerateContent?alt=sse`
          } else {
            apiUrl = `${providerConfig.baseUrl}/chat/completions`
          }
          log?.info(`Forwarding to: ${apiUrl}`, 'proxy')

          // Build headers
          const headers = { 'Content-Type': 'application/json' }
          if (isClaude) {
            headers['x-api-key'] = apiKey
            headers['anthropic-version'] = '2023-06-01'
          } else if (isGoogle) {
            headers['x-goog-api-key'] = apiKey
          } else {
            headers['Authorization'] = `Bearer ${apiKey}`
          }

          // Build request body
          let requestBody
          if (isClaude) {
            requestBody = { model, max_tokens: 4096, messages, stream }
          } else if (isGoogle) {
            // Gemini 格式：contents 替代 messages，role assistant → model
            const contents = messages
              .filter(m => m.role === 'user' || m.role === 'assistant')
              .map(m => {
                const role = m.role === 'assistant' ? 'model' : 'user'
                // 处理 content 为字符串（纯文本）或数组（多模态）
                if (typeof m.content === 'string') {
                  return { role, parts: [{ text: m.content }] }
                }
                if (Array.isArray(m.content)) {
                  return {
                    role,
                    parts: m.content.map(item => {
                      if (item.type === 'text') return { text: item.text }
                      if (item.type === 'image') {
                        return {
                          inlineData: {
                            mimeType: item.source?.media_type || 'image/jpeg',
                            data: item.source?.data || ''
                          }
                        }
                      }
                      return { text: JSON.stringify(item) }
                    })
                  }
                }
                return { role, parts: [{ text: String(m.content) }] }
              })
            // 处理 system prompt → system_instruction
            const systemMessage = messages.find(m => m.role === 'system')
            requestBody = {
              contents,
              ...(systemMessage ? { system_instruction: { parts: [{ text: systemMessage.content }] } } : {}),
              generationConfig: { maxOutputTokens: 4096 }
            }
          } else {
            requestBody = { model, messages, stream }
          }

          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 60000)
          const upstream = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          })
          clearTimeout(timeout)

          if (stream) {
            res.setHeader('Content-Type', 'text/event-stream')
            res.setHeader('Cache-Control', 'no-cache')
            res.setHeader('Connection', 'keep-alive')
            log?.info(`Upstream status: ${upstream.status}`, 'proxy')
            log?.info(`Upstream body type: ${typeof upstream.body}`, 'proxy')
            for await (const chunk of upstream.body) {
              log?.debug(`Forwarding chunk: ${chunk.toString().substring(0, 100)}`, 'proxy')
              res.write(chunk)
            }
            res.end()
          } else {
            const data = await upstream.json()
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(data))
          }
        } catch (err) {
          log?.error(`Proxy error: ${err.message}`, 'proxy')
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
    }
  })

  proxyServer.listen(3000, () => {
    log?.info('Proxy server listening on http://localhost:3000', 'proxy')
  })
}

startProxyServer()
