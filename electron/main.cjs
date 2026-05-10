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
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version')
      res.end()
      return
    }
    if (req.method === 'POST' && req.url === '/api/ai/chat') {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, anthropic-version')
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
          const apiUrl = isClaude
            ? `${providerConfig.baseUrl}/messages`
            : `${providerConfig.baseUrl}/chat/completions`
          console.log('[Proxy] Forwarding to:', apiUrl)

          const headers = {
            'Content-Type': 'application/json',
            ...(isClaude
              ? { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
              : { 'Authorization': `Bearer ${apiKey}` }),
          }

          const body = isClaude
            ? { model, max_tokens: 4096, messages, stream }
            : { model, messages, stream }

          const upstream = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
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
