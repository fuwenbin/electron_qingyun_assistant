import { app, BrowserWindow, globalShortcut, session } from 'electron'
import path from 'path'
import initShowSaveDialog from './services/show-save-dialog';
import initOpenFile from './services/open-file';
import { initAliyunTTS } from './services/aliyun-tts';
import { setupLogger } from './services/logger';
import { ensureAppDataSaveDir, initAppDataSaveDir } from './services/default-save-path';
import { initVideoMixAndCut } from './services/video-mix-and-cut';
import { initOpenFileDialog } from './services/open-file-dialog';
import { initProtocolCustom, initProtocolCustomBeforeAppReady } from './services/protocol-custom';
import { initGlobalShortcutRegister } from './services/global-shortcut-register';
import { initWindowControl } from './services/window-control';
import { autoSetOptimalMemoryLimit } from './services/memory-limit-auto-set';
import { initVideoAss } from './services/video-ass';
import { setupFFmpeg } from './utils/ffmpeg-utils';
import { initPlaywright } from './services/playwright';
import { databaseService } from './services/database-service';
import { initApiController } from './services/api-controller';
import { videoPublishTaskManager } from './utils/video-publish-task-manager';

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
if (typeof crypto === 'undefined') {
  global.crypto = require('crypto').webcrypto;
}
process.env.LANG = 'zh_CN.UTF-8';
process.env.LC_ALL = 'zh_CN.UTF-8';

// 对于Windows特别设置
if (process.platform === 'win32') {
  process.env.CHCP = '65001';
}
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')
// 限制内存
autoSetOptimalMemoryLimit();

let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC as string, 'vite.svg'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      scrollBounce: true,
      webviewTag: true,
      webSecurity: false,
      enableBlinkFeatures: 'CSSVariables,KeyboardMap',
      experimentalFeatures: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    },
    width: 1400,
    height: 900,
    autoHideMenuBar: true
  })

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    if (details.url.includes('douyin.com')) {
      details.requestHeaders['User-Agent'] = 
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36';
    }
    callback({ requestHeaders: details.requestHeaders });
  });

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
setupFFmpeg();
initShowSaveDialog();
initOpenFile();
initAliyunTTS();
initAppDataSaveDir();
initVideoMixAndCut();
initVideoAss();
initPlaywright();
initProtocolCustomBeforeAppReady();

const initializeAppAfterCreateWindow = async (win: BrowserWindow) => {
  // 注册打开文件对话框逻辑
  initOpenFileDialog(win);
  // 注册全局快捷键逻辑
  initGlobalShortcutRegister(win);
  // 注册窗口控制逻辑
  initWindowControl();
}

app.whenReady().then(async () => {
  await databaseService.init();
  app.commandLine.appendSwitch('disable-direct-write');
  ensureAppDataSaveDir();
  initProtocolCustom();
  createWindow();
  initializeAppAfterCreateWindow(win as BrowserWindow);
  initApiController();
  videoPublishTaskManager.start();
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
  if (databaseService) {
    databaseService.close()
  }
  globalShortcut.unregisterAll()
})


