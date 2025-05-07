import { app, BrowserWindow, globalShortcut } from 'electron'
import path from 'path'
import initShowSaveDialog from './services/show-save-dialog';
import initOpenFile from './services/open-file';
import { initAliyunTTS } from './services/aliyun-tts';
import { electronCrypto } from './utils/crypto-polyfill';
import { setupLogger } from './services/logger';
import { ensureAppDataSaveDir, initAppDataSaveDir } from './services/default-save-path';
import { initVideoMixAndCut } from './services/video-mix-and-cut';
import { initOpenFileDialog } from './services/open-file-dialog';
import { initProtocolCustom } from './services/protocol-custom';
import { initGlobalShortcutRegister } from './services/global-shortcut-register';
import { setupFFmpeg } from './utils/ffmpeg-utils';
global.crypto = electronCrypto;
// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.LANG = 'zh_CN.UTF-8';
process.env.LC_ALL = 'zh_CN.UTF-8';

// 对于Windows特别设置
if (process.platform === 'win32') {
  process.env.CHCP = '65001';
}
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')
// 限制内存
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=8192')

let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC as string, 'vite.svg'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST as string, 'index.html'))
  }
}

setupLogger();
initShowSaveDialog();
initOpenFile();
initAliyunTTS();
initAppDataSaveDir();
initVideoMixAndCut();

app.whenReady().then(() => {
  ensureAppDataSaveDir();
  setupFFmpeg();
  initProtocolCustom();
  createWindow();
  initOpenFileDialog(win as BrowserWindow);
  initGlobalShortcutRegister(win);
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
}) 

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})


