import { app, BrowserWindow, Menu } from 'electron';
import { devMode } from './init';

const loadingFile = devMode ? 'http://localhost:8080' : `file:///${__dirname}/index.html`;

let win;

const createWindow = () => {
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    },
    width: 800,
    height: 600,
  });
  win.setFullScreen(true);
  win.loadURL(loadingFile);
  if (devMode) {
    win.webContents.openDevTools();
  }

  win.on('closed', () => {
    win = null;
  });
};

const windowAllClosed = () => {
  app.quit();
};

const activateWindow = () => {
  if (win === null) {
    createWindow();
  }
};

app.on('ready', createWindow);
app.on('window-all-closed', windowAllClosed);
app.on('activate', activateWindow);

app.on('before-quit', () => console.log('on before-quit'));
app.on('will-quit ', () => console.log('on will-quit '));
