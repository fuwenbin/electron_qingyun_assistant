// src/utils/logger.ts
import log from 'electron-log';
import { app } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { getPlatformAppDataPath } from './default-save-path';

// 1. 初始化日志系统
export function setupLogger() {
  const isDev = !app.isPackaged;

  // 基础配置
  log.initialize({
    preload: true,       // 自动注入渲染进程
    spyRendererConsole: isDev // 开发时捕获渲染进程console
  });

  // 2. 文件路径配置
  const logDir = path.join(getPlatformAppDataPath(), 'logs');
  const logPath = path.join(logDir, 'app.log');

  // 确保日志目录存在
  fs.ensureDirSync(logDir);

  // 3. 文件日志设置（生产环境）
  log.transports.file.level = isDev ? 'debug' : 'info';
  log.transports.file.resolvePathFn = () => logPath;
  log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB

  // 4. 开发环境增强配置
  if (isDev) {
    log.transports.console.level = 'debug';
    log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
  }

  // 5. 打印日志路径方便调试
  console.log(`[Logger] 日志文件路径: ${logPath}`);
}