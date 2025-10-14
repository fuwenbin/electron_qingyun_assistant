import fs from 'fs'
import path from 'path'
import { app, ipcMain } from 'electron'

const APP_NAME = 'zhushou'

export function getInstallationDirectory() {
  // 对于打包后的应用
  if (app.isPackaged) {
    // 在 macOS 中，execPath 是 .app/Contents/MacOS/appName
    // 但资源文件在 .app/Contents/Resources/ 中
    if (process.platform === 'darwin') {
      return path.join(path.dirname(process.execPath), '..', 'Resources');
    }
    // 在 Windows 中，使用 process.resourcesPath 更可靠
    if (process.platform === 'win32') {
      return process.resourcesPath;
    }
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

/**
 * 获取视频缓存路径（用于存放临时文件）
 * 路径结构：
 * - macOS: ~/Library/Caches/zhushou/.cache
 * - Windows: %LOCALAPPDATA%/zhushou/.cache
 * - Linux: ~/.cache/zhushou/.cache
 */
export function getVideoCachePath() {
  let cacheBasePath: string;
  
  switch (process.platform) {
    case 'darwin':
      // macOS: ~/Library/Caches/zhushou
      cacheBasePath = path.join(app.getPath('home'), 'Library', 'Caches', APP_NAME);
      break;
    case 'win32':
      // Windows: %LOCALAPPDATA%/zhushou
      cacheBasePath = path.join(app.getPath('appData'), '..', 'Local', APP_NAME);
      break;
    case 'linux':
      // Linux: ~/.cache/zhushou
      cacheBasePath = path.join(app.getPath('home'), '.cache', APP_NAME);
      break;
    default:
      // 其他平台使用 temp
      cacheBasePath = path.join(app.getPath('temp'), APP_NAME);
  }
  
  const cachePath = path.join(cacheBasePath, '.cache');
  
  // 确保基础目录存在
  try {
    if (!fs.existsSync(cacheBasePath)) {
      fs.mkdirSync(cacheBasePath, { recursive: true });
      console.log(`创建缓存基础目录: ${cacheBasePath}`);
    }
    
    // 确保 .cache 目录存在
    if (!fs.existsSync(cachePath)) {
      fs.mkdirSync(cachePath, { recursive: true });
      console.log(`创建缓存目录: ${cachePath}`);
    }
  } catch (error) {
    console.error('创建缓存目录失败:', error);
    // 如果创建失败，使用临时目录作为后备
    const fallbackPath = path.join(app.getPath('temp'), APP_NAME, '.cache');
    if (!fs.existsSync(fallbackPath)) {
      fs.mkdirSync(fallbackPath, { recursive: true });
    }
    return fallbackPath;
  }
  
  return cachePath;
}

/**
 * 清空视频缓存目录
 */
export function clearVideoCache() {
  const cachePath = getVideoCachePath();
  
  try {
    if (fs.existsSync(cachePath)) {
      // 删除目录中的所有文件
      const files = fs.readdirSync(cachePath);
      for (const file of files) {
        const filePath = path.join(cachePath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // 递归删除子目录
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          // 删除文件
          fs.unlinkSync(filePath);
        }
      }
      console.log(`已清空缓存目录: ${cachePath}`);
    }
  } catch (error) {
    console.error('清空缓存目录失败:', error);
    throw error;
  }
}

export function initAppDataSaveDir() {
  ipcMain.handle('get-default-save-path', () => {
    return ensureAppDataSaveDir();
  });
  
  ipcMain.handle('get-video-cache-path', () => {
    return getVideoCachePath();
  });
  
  ipcMain.handle('clear-video-cache', () => {
    clearVideoCache();
  });
}
