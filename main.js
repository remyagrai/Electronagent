const { app, BrowserWindow, ipcMain } = require('electron');

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

app.whenReady().then(() => {
  createWindow();

  wss = new WebSocket.Server({ port: 8765 });
  console.log('WebSocket server listening on ws://localhost:8765');

  wss.on('connection', (ws) => {
    console.log('Browser extension connected');

    ws.on('message', (message) => {
      // Forward browser activity message to renderer process
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
