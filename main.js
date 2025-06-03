const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const mongoose = require('mongoose');
const DailyTimeline = require('./models/DailyTimeline');

const MONGODB_URI = 'mongodb://localhost:27017/tracker';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  await win.loadFile('index.html');
}

app.whenReady().then(async () => {
  await connectDB();
  await createWindow();
});

ipcMain.handle('fetch-daily-timeline', async (event, userId, date) => {
  try {
    const timeline = await DailyTimeline.findOne({ userId, date }).lean();
    return timeline || null;
  } catch (err) {
    console.error(err);
    return null;
  }
});

ipcMain.handle('save-daily-timeline', async (event, timelineData) => {
  try {
    const existing = await DailyTimeline.findOne({ userId: timelineData.userId, date: timelineData.date });
    if (existing) {
      existing.tasks = timelineData.tasks;
      existing.activity = timelineData.activity;
      existing.browser = timelineData.browser;
      await existing.save();
      return { status: 'updated' };
    } else {
      const newRecord = new DailyTimeline(timelineData);
      await newRecord.save();
      return { status: 'created' };
    }
  } catch (err) {
    console.error(err);
    return { status: 'error', error: err.message };
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
