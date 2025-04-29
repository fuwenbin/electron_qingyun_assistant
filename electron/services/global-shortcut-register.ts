import { globalShortcut } from "electron"

export function initGlobalShortcutRegister(win) {
  globalShortcut.register('CommandOrControl+R', () => {
    if (win) win.reload()
  })
}
