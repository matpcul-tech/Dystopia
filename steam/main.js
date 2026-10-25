// Electron scaffold. Not wired to steamworks.js.
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow(){
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: '#07070b',
    webPreferences: { contextIsolation: true },
  });
  win.loadFile(path.join(__dirname, '..', 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
