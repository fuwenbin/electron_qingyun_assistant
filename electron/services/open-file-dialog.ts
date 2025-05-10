import { ipcMain, BrowserWindow, dialog, app } from "electron";
import path from 'path';
import { getDurationWithFfmpeg } from '../utils/ffmpeg-utils'
import { getMimeType } from "../utils";
import { getLastOpenedDirectory, setLastOpenedDirectory } from "./user-config";

export function initOpenFileDialog(mainWindow: BrowserWindow) {
  ipcMain.handle('open-file-dialog', async (_, options) => {
    if (!mainWindow) return null;
    
    const defaultPath = options?.defaultPath || getLastOpenedDirectory();
    const properties = options?.properties || ['openFile'];
    const title = options?.title || '选择文件';
    const buttonLabel = options?.buttonLabel || '选择';
    const filters = options?.filters || [
      { name: 'All Files', extensions: ['*'] }
    ];
    if (options?.multiple && !properties.includes('multiSelections')) {
      properties.push('multiSelections');
    }
    const result: any = await dialog.showOpenDialog(mainWindow, {
      title,
      defaultPath,
      buttonLabel,
      filters,
      properties
    });
    if (result.canceled) {
      return [];
    } else {
      const currentDir = path.dirname(result.filePaths[0]);
      setLastOpenedDirectory(currentDir);
      const resultListPromise = result.filePaths.map(async v => {
        const duration = await getDurationWithFfmpeg(v);
        const url = `media://${encodeURIComponent(v)}`;
        return {
          path: path.normalize(v),
          name: path.basename(v),
          ext: path.extname(v),
          mimeType: getMimeType(v),
          duration,
          url
        }
      });
      return await Promise.all(resultListPromise);
    }
  });
}

