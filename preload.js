const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onActiveApp: (callback) => ipcRenderer.on('active-app', (event, data) => callback(data)),
onBrowserActivity: (callback) => ipcRenderer.on('browser-activity', (event, data) => callback(data)),
});
