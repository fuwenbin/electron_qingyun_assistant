import fs from 'fs'
import path from 'path'
import { app, ipcMain } from 'electron'

const APP_NAME = 'zhushou'

export function getInstallationDirectory() {
  // 对于打包后的应用
  if (app.isPackaged) {
    return path.dirname(process.execPath);
  }
  // 开发环境下返回项目根目录
  return app.getAppPath();
}

// 获取平台特定的路径
export function getPlatformAppDataPath() {
  try {
    const appRootPath = getInstallationDirectory();
    const appDataPath = path.join(appRootPath, 'data');
    if (!fs.existsSync(appDataPath)) {
      fs.mkdirSync(appDataPath, { recursive: true });
      return appDataPath;
    } else {
      return appDataPath;
    }
  } catch (error) {
    console.error('Failed to create zhushou directory:', error)
    switch (process.platform) {
      case 'win32':
        return path.join(app.getPath('appData'), APP_NAME)
      case 'darwin':
        return path.join(app.getPath('appData'), APP_NAME)
      case 'linux':
        return path.join(app.getPath('appData'), APP_NAME)
      default:
        return path.join(app.getPath('documents'), APP_NAME)
    }
  }
}

export function ensureAppDataSaveDir() {
  try {
    const appDataPath = getPlatformAppDataPath()
    
    // 检查目录是否存在
    if (!fs.existsSync(appDataPath)) {
      fs.mkdirSync(appDataPath)
      console.log('Created zhushou directory at:', appDataPath)
    }
    
    // 检查目录是否可写
    try {
      fs.accessSync(appDataPath, fs.constants.W_OK)
    } catch (err) {
      console.error('No write permission for zhushou directory, falling back to documents')
      return path.join(app.getPath('documents'), APP_NAME)
    }
    
    return appDataPath
  } catch (error) {
    console.error('Failed to create zhushou directory:', error)
    // 回退到文档目录
    return path.join(app.getPath('documents'), APP_NAME)
  }
}

export function initAppDataSaveDir() {
  ipcMain.handle('get-default-save-path', () => {
    return ensureAppDataSaveDir();
  });
}
