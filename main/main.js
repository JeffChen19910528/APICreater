const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { generateProject } = require('../generator/codeBuilder');

const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_DEV === 'true';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    title: 'API Generator'
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// IPC: 選擇輸出目錄
ipcMain.handle('select-output-dir', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: '選擇專案輸出資料夾'
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// IPC: 選擇 SQLite 資料庫檔案
ipcMain.handle('select-sqlite-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    title: '選擇 SQLite 資料庫檔案',
    filters: [
      { name: 'SQLite Database', extensions: ['db', 'sqlite', 'sqlite3'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// IPC: 連接資料庫並讀取 Schema
ipcMain.handle('db-connect', async (event, dbConfig) => {
  try {
    const { connectAndGetSchema } = require('../generator/dbSchemaReader');
    const schema = await connectAndGetSchema(dbConfig);
    return { success: true, schema };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC: 產生專案
ipcMain.handle('generate-project', async (event, { apis, projectName, language, version, outputDir, dbConfig }) => {
  try {
    const projectPath = path.join(outputDir, projectName);
    await generateProject({ apis, projectName, language, version, outputDir: projectPath, dbConfig });
    return { success: true, projectPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC: 產生程式碼預覽（不寫檔案）
ipcMain.handle('preview-code', async (event, { apis, projectName, language, version, dbConfig }) => {
  try {
    const { generatePreview } = require('../generator/codeBuilder');
    const preview = await generatePreview({ apis, projectName, language, version, dbConfig });
    return { success: true, preview };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
