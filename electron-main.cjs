const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Membuat window browser utama
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, 'ai.ico'), 
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, 
      devTools: false
    },
    autoHideMenuBar: true, 
  });

  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});