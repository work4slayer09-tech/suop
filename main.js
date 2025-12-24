// Electron main process (updated to spawn backend when packaged)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess = null;

function startEmbeddedBackend() {
  try {
    const backendPath = path.join(process.resourcesPath || __dirname, 'backend', 'server.js');
    backendProcess = spawn(process.execPath, [backendPath], {
      detached: true,
      stdio: 'ignore',
      env: Object.assign({}, process.env, { NODE_ENV: 'production' })
    });
    backendProcess.unref();
    console.log('Spawned embedded backend:', backendPath);
  } catch (err) {
    console.error('Failed to spawn embedded backend:', err);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      sandbox: false
    }
  });

  const indexPath = path.join(__dirname, 'frontend', 'index.html');
  win.loadFile(indexPath);
}

app.whenReady().then(() => {
  if (app.isPackaged) {
    startEmbeddedBackend();
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (backendProcess && !backendProcess.killed) {
      try { backendProcess.kill(); } catch (e) {}
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
