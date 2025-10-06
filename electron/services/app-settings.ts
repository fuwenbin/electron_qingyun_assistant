import { ipcMain } from 'electron'
import appSettingsService from './app-settings-service'
import { decodeArg } from '../utils'
import log from 'electron-log'

export function initAppSettings() {
  // 获取应用设置
  ipcMain.handle('get-app-settings', async () => {
    try {
      const settings = appSettingsService.getSettings()
      log.info('Retrieved app settings:', settings)
      return settings
    } catch (error) {
      log.error('Failed to get app settings:', error)
      throw error
    }
  })

  // 保存应用设置
  ipcMain.handle('save-app-settings', async (_, settingsStr: string) => {
    try {
      const settings = JSON.parse(decodeArg(settingsStr))
      appSettingsService.saveSettings(settings)
      log.info('Saved app settings:', settings)
    } catch (error) {
      log.error('Failed to save app settings:', error)
      throw error
    }
  })

  log.info('App settings IPC handlers initialized')
}
