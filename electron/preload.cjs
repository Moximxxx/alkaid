const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  isDev: !process.env.NODE_ENV || process.env.NODE_ENV === 'development',
  onReady: (callback) => ipcRenderer.on('ready', callback),
});
