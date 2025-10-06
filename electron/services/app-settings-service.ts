import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import log from 'electron-log'

export interface AppSettings {
  showBrowser: boolean
  retryCount: number
  publishInterval: number
  startMinimized: boolean
  autoUpdate: boolean
}

export class AppSettingsService {
  private settingsPath: string
  private defaultSettings: AppSettings = {
    showBrowser: false,
    retryCount: 3,
    publishInterval: 30,
    startMinimized: false,
    autoUpdate: true
  }

  constructor() {
    const userDataPath = app.getPath('userData')
    this.settingsPath = path.join(userDataPath, 'app-settings.json')
    log.info('Settings file path:', this.settingsPath)
  }

  /**
   * 获取应用设置
   */
  getSettings(): AppSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const settingsData = fs.readFileSync(this.settingsPath, 'utf-8')
        const savedSettings = JSON.parse(settingsData)
        // 合并默认设置和保存的设置，确保新增的设置项有默认值
        return { ...this.defaultSettings, ...savedSettings }
      }
    } catch (error) {
      log.error('读取设置文件失败:', error)
    }
    
    // 如果文件不存在或读取失败，返回默认设置
    return { ...this.defaultSettings }
  }

  /**
   * 保存应用设置
   */
  saveSettings(settings: Partial<AppSettings>): void {
    try {
      // 获取当前设置
      const currentSettings = this.getSettings()
      
      // 合并新设置
      const newSettings = { ...currentSettings, ...settings }
      
      // 确保目录存在
      const settingsDir = path.dirname(this.settingsPath)
      if (!fs.existsSync(settingsDir)) {
        fs.mkdirSync(settingsDir, { recursive: true })
      }
      
      // 保存到文件
      fs.writeFileSync(this.settingsPath, JSON.stringify(newSettings, null, 2), 'utf-8')
      log.info('设置已保存:', newSettings)
    } catch (error) {
      log.error('保存设置文件失败:', error)
      throw new Error('保存设置失败: ' + error.message)
    }
  }

  /**
   * 重置为默认设置
   */
  resetToDefault(): void {
    this.saveSettings(this.defaultSettings)
  }

  /**
   * 获取特定设置项
   */
  getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    const settings = this.getSettings()
    return settings[key]
  }

  /**
   * 设置特定设置项
   */
  setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    const settings = this.getSettings()
    settings[key] = value
    this.saveSettings(settings)
  }
}

export default new AppSettingsService()
