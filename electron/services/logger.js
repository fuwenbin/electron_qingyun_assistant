import log from 'electron-log';
import fs from 'fs';
import path from 'path';

export function setupLogger() {
  // 1. 设置文件日志
  log.transports.file.encoding = 'utf8';
  log.transports.file.level = 'info';
  log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
  
  // 2. 确保UTF-8编码
  const logFile = log.transports.file.getFile().path;
  log.transports.file.stream = fs.createWriteStream(logFile, { 
    flags: 'a', 
    encoding: 'utf8' 
  });

  // 3. 处理Windows控制台编码
  if (process.platform === 'win32') {
    process.env.CHCP = '65001';
    try {
      require('child_process').execSync('chcp 65001');
    } catch (e) {}
  }

  // 4. 覆盖console输出
  const originalConsole = global.console;
  global.console = log;
  
  return {
    restore: () => { global.console = originalConsole; }
  };
}

// 初始化
setupLogger();