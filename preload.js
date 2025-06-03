const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  fetchTimeline: (userId, date) => ipcRenderer.invoke('fetch-daily-timeline', userId, date),
  saveTimeline: (timelineData) => ipcRenderer.invoke('save-daily-timeline', timelineData)
});
