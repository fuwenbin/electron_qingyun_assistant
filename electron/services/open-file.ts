import { ipcMain } from "electron";

export default function initOpenFile() {
  ipcMain.handle('open-file', async (_, path) => {
    const { shell } = require('electron');
    await shell.openPath(path);
  });
}


