const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onBrowserActivity: (callback) => ipcRenderer.on('browser-activity', (event, data) => callback(data))
});
