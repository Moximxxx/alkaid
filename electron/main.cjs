const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow = null;
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
