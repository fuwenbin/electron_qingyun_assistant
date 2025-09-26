#!/usr/bin/env node

/**
 * macOS 构建优化脚本
 * 减少 DMG 包大小，移除不必要的组件
 */

const fs = require('fs-extra');
const path = require('path');

async function optimizeMacBuild() {
  console.log('🍎 开始优化 macOS 构建...');
  
  const appPath = 'dist_electron/mac-arm64/剪辑助手.app';
  const resourcesPath = path.join(appPath, 'Contents/Resources');
  const frameworksPath = path.join(appPath, 'Contents/Frameworks');
  
  if (!await fs.pathExists(appPath)) {
    console.log('❌ 未找到 macOS 应用，请先构建应用');
    return;
  }
  
  let savedSize = 0;
  
  try {
    // 1. 移除不必要的语言包（保留中文、英文）
    const keepLocales = ['zh_CN.lproj', 'en.lproj', 'en_GB.lproj'];
    const localesDir = resourcesPath;
    
    if (await fs.pathExists(localesDir)) {
      const items = await fs.readdir(localesDir);
      for (const item of items) {
        if (item.endsWith('.lproj') && !keepLocales.includes(item)) {
          const localePath = path.join(localesDir, item);
          const stat = await fs.stat(localePath);
          if (stat.isDirectory()) {
            await fs.remove(localePath);
            savedSize += await getDirSize(localePath);
            console.log(`🗑️  移除语言包: ${item}`);
          }
        }
      }
    }
    
    // 2. 移除 Windows 专用文件（如果存在）
    const windowsFiles = [
      'chrome-win',
      'ffmpeg.exe',
      'chrome.exe',
      'chrome_proxy.exe'
    ];
    
    for (const file of windowsFiles) {
      const filePath = path.join(resourcesPath, file);
      if (await fs.pathExists(filePath)) {
        const stat = await fs.stat(filePath);
        const size = stat.isDirectory() ? await getDirSize(filePath) : stat.size;
        await fs.remove(filePath);
        savedSize += size;
        console.log(`🗑️  移除 Windows 文件: ${file}`);
      }
    }
    
    // 3. 优化 Electron Framework（移除调试信息）
    const electronFramework = path.join(frameworksPath, 'Electron Framework.framework');
    if (await fs.pathExists(electronFramework)) {
      // 移除调试符号
      const debugDir = path.join(electronFramework, 'Versions/A/Resources/debug');
      if (await fs.pathExists(debugDir)) {
        const size = await getDirSize(debugDir);
        await fs.remove(debugDir);
        savedSize += size;
        console.log('🗑️  移除调试符号');
      }
    }
    
    // 4. 压缩字体文件（如果可能）
    const fontsDir = path.join(resourcesPath, 'fonts');
    if (await fs.pathExists(fontsDir)) {
      console.log('📝 保留字体文件（视频处理需要）');
    }
    
    // 5. 清理临时文件和缓存
    const tempDirs = [
      path.join(appPath, 'Contents/tmp'),
      path.join(appPath, 'Contents/cache'),
    ];
    
    for (const tempDir of tempDirs) {
      if (await fs.pathExists(tempDir)) {
        const size = await getDirSize(tempDir);
        await fs.remove(tempDir);
        savedSize += size;
        console.log(`🗑️  清理临时目录: ${path.basename(tempDir)}`);
      }
    }
    
    console.log(`✅ 优化完成！预计节省空间: ${(savedSize / 1024 / 1024).toFixed(2)} MB`);
    
    // 显示优化后的大小
    const finalSize = await getDirSize(appPath);
    console.log(`📊 优化后应用大小: ${(finalSize / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('❌ 优化过程中出错:', error);
  }
}

/**
 * 获取目录大小
 */
async function getDirSize(dirPath) {
  if (!await fs.pathExists(dirPath)) return 0;
  
  let totalSize = 0;
  const items = await fs.readdir(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = await fs.stat(itemPath);
    
    if (stat.isDirectory()) {
      totalSize += await getDirSize(itemPath);
    } else {
      totalSize += stat.size;
    }
  }
  
  return totalSize;
}

// 运行优化
if (require.main === module) {
  optimizeMacBuild().catch(console.error);
}

module.exports = { optimizeMacBuild };
