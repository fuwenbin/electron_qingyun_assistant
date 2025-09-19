import { globalShortcut } from "electron"

export function initGlobalShortcutRegister(win) {
  globalShortcut.register('CommandOrControl+R', () => {
    if (win) win.reload()
  })
  
  // Register F12 or Ctrl+Shift+I to open Developer Tools
  globalShortcut.register('F12', () => {
    if (win) win.webContents.toggleDevTools()
  })
  
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (win) win.webContents.toggleDevTools()
  })
}
