const { app, BrowserWindow, ipcMain } = require('electron');
const activeWin = require('active-win');

app.commandLine.appendSwitch('disable-features', 'AutofillServerCommunication');

const path = require('path');
const WebSocket = require('ws');

let mainWindow;
let wss;

function createWindow() {
mainWindow = new BrowserWindow({
  width: 900,
  height: 700,
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: false,
    additionalArguments: ['--disable-features=AutofillServerCommunication'],
  },
});

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}
ipcMain.handle('get-active-app', async () => {
  const info = await activeWin();
  return info;
});

app.whenReady().then(() => {
  createWindow();

  let lastApp = null;
  setInterval(async () => {
    const info = await activeWin();
    if (!info) return;

    if (
      lastApp?.appName !== info.owner.name ||
      lastApp?.title !== info.title
    ) {
      lastApp = {
        appName: info.owner.name,
        title: info.title,
      };
      mainWindow.webContents.send('active-app', {
        appName: info.owner.name,
        title: info.title,
        timestamp: new Date().toISOString(),
      });
    }
  }, 3000);

  wss = new WebSocket.Server({ port: 8765 });
  console.log('WebSocket server listening on ws://localhost:8765');

  wss.on('connection', (ws) => {
    console.log('Browser extension connected');

    ws.on('message', (message) => {
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('browser-activity', message.toString());
      }
    });

    ws.on('close', () => {
      console.log('Browser extension disconnected');
    });
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (wss) wss.close();
    app.quit();
  }
});