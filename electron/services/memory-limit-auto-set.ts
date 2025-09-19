import { app } from 'electron'
import os from 'os'

export function autoSetOptimalMemoryLimit() {
  // 获取系统总内存（字节）
  const totalSystemMemory = os.totalmem()
  // 计算一半的系统内存（MB）
  const halfSystemMemoryMB = Math.floor(totalSystemMemory / (1024 * 1024) / 2)
  // 设置最小4GB限制
  const minMemoryMB = 4096
  // 确定最终内存限制
  const memoryLimitMB = Math.max(halfSystemMemoryMB, minMemoryMB)
  
  console.log(`System total memory: ${(totalSystemMemory / (1024 * 1024 * 1024)).toFixed(2)}GB`)
  console.log(`Setting memory limit to: ${memoryLimitMB}MB (${(memoryLimitMB / 1024).toFixed(2)}GB)`)

  // 设置Chromium内存限制
  app.commandLine.appendSwitch('js-flags', `--max-old-space-size=${memoryLimitMB}`)
}