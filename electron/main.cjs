const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');

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
let isProxyServerRunning = false;
let isReady = false;
let isWaitingForServer = false;

function waitForViteServer(maxWaitTime = 30000) {
  if (isWaitingForServer || isReady) {
    return Promise.resolve();
  }
  isWaitingForServer = true;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    console.log('[Electron] Waiting for Vite server...');

    function checkServer() {
      const req = http.get('http://localhost:5173', (res) => {
        if (res.statusCode === 200) {
          console.log('[Electron] Vite server is ready!');
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

  console.log('[Electron] Window created');
}

app.whenReady().then(async () => {
  if (isReady) {
    return;
  }
  isReady = true;

  console.log('[Electron] App ready, waiting for Vite server...');

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    try {
      await waitForViteServer();
    } catch (err) {
      console.error('[Electron] Failed to wait for Vite server:', err.message);
      console.error('[Electron] Please make sure Vite dev server is running on http://localhost:5173');
      app.quit();
      return;
    }
  }

  createWindow();

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
  console.log('[Electron] App quitting...');
});

function startProxyServer() {
  if (isProxyServerRunning) return
  isProxyServerRunning = true

  const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS' && req.url === '/api/ai/chat') {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version, x-goog-api-key')
      res.end()
      return
    }
    if (req.method === 'POST' && req.url === '/api/ai/chat') {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version, x-goog-api-key')
      let body = ''
      req.on('data', chunk => { body += chunk })
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
          console.log('[Proxy] Forwarding to:', apiUrl)

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

          const upstream = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
          })

          if (stream) {
            res.setHeader('Content-Type', 'text/event-stream')
            res.setHeader('Cache-Control', 'no-cache')
            res.setHeader('Connection', 'keep-alive')
            console.log('[Proxy] Upstream status:', upstream.status)
            console.log('[Proxy] Upstream body type:', typeof upstream.body)
            for await (const chunk of upstream.body) {
              console.log('[Proxy] Forwarding chunk:', chunk.toString().substring(0, 100))
              res.write(chunk)
            }
            res.end()
          } else {
            const data = await upstream.json()
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(data))
          }
        } catch (err) {
          console.error('[Proxy] Error:', err.message)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
    }
  })

  server.listen(3000, () => {
    console.log('[Proxy] Server listening on http://localhost:3000')
  })
}

startProxyServer()
