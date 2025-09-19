import { BrowserWindow } from 'electron'
import process from 'process'
import v8 from 'v8'

// 监控内存使用
export function setupMemoryMonitor(win: BrowserWindow) {
  setInterval(() => {
    const memoryUsage = process.memoryUsage()
    const usedMB = Math.round(memoryUsage.rss / 1024 / 1024)
    const maxMB = Math.round(v8.getHeapStatistics().total_available_size / 1024 / 1024)
    
    console.log(`Memory usage: ${usedMB}MB / ${maxMB}MB`)
    
    if (usedMB > maxMB * 0.8) { // 使用超过80%时采取措施
      win.webContents.executeJavaScript('alert("High memory usage!")')
      // 或者触发内存清理逻辑
    }
  }, 5000) // 每5秒检查一次
}