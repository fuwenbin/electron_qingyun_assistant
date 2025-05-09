import { ipcMain, dialog, app } from "electron";
import { decodeArg } from "../utils";

export default function initShowSaveDialog() {
  // 保存对话框
  ipcMain.handle('show-save-dialog', async (_, options) => {
    const result = await dialog.showSaveDialog({
      title: options.title || '保存文件',
      defaultPath: options.defaultPath || app.getPath('documents'),
      filters: options.filters || [
        { name: 'MP4 Videos', extensions: ['mp4'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    return result;
  });

  
ipcMain.handle('select-directory', async (_, optionsStr: string) => {
  const options = optionsStr && JSON.parse(decodeArg(optionsStr));
  const result: any = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '选择保存目录',
    defaultPath: options?.defaultPath || app.getPath('documents') // 默认从文档目录开始
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0]; // 返回选择的目录路径
  }
  return null; // 用户取消了选择
});
}
