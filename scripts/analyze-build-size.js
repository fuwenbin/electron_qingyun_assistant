#!/usr/bin/env node

/**
 * 构建大小分析脚本
 * 分析 macOS 和 Windows 构建包的大小差异
 */

const fs = require('fs-extra');
const path = require('path');

async function analyzeBuildSize() {
  console.log('📊 分析构建包大小...\n');
  
  const distDir = 'dist_electron';
  const macAppPath = path.join(distDir, 'mac-arm64/剪辑助手.app');
  const winUnpackedPath = path.join(distDir, 'win-unpacked');
  
  const analysis = {
    mac: {},
    windows: {},
    comparison: {}
  };
  
  // 分析 macOS 构建
  if (await fs.pathExists(macAppPath)) {
    console.log('🍎 分析 macOS 构建...');
    analysis.mac = await analyzeMacApp(macAppPath);
  }
  
  // 分析 Windows 构建
  if (await fs.pathExists(winUnpackedPath)) {
    console.log('🪟 分析 Windows 构建...');
    analysis.windows = await analyzeWindowsApp(winUnpackedPath);
  }
  
  // 生成对比报告
  generateComparisonReport(analysis);
}

async function analyzeMacApp(appPath) {
  const analysis = {};
  
  // 分析主要目录
  const contentsPath = path.join(appPath, 'Contents');
  const frameworksPath = path.join(contentsPath, 'Frameworks');
  const resourcesPath = path.join(contentsPath, 'Resources');
  
  // Frameworks 分析
  if (await fs.pathExists(frameworksPath)) {
    analysis.frameworks = {};
    const frameworks = await fs.readdir(frameworksPath);
    
    for (const framework of frameworks) {
      const frameworkPath = path.join(frameworksPath, framework);
      const size = await getDirSize(frameworkPath);
      analysis.frameworks[framework] = {
        size: size,
        sizeFormatted: formatSize(size)
      };
    }
  }
  
  // Resources 分析
  if (await fs.pathExists(resourcesPath)) {
    analysis.resources = {};
    const resources = await fs.readdir(resourcesPath);
    
    for (const resource of resources) {
      const resourcePath = path.join(resourcesPath, resource);
      const stat = await fs.stat(resourcePath);
      const size = stat.isDirectory() ? await getDirSize(resourcePath) : stat.size;
      
      analysis.resources[resource] = {
        size: size,
        sizeFormatted: formatSize(size),
        type: stat.isDirectory() ? 'directory' : 'file'
      };
    }
  }
  
  // 总大小
  analysis.totalSize = await getDirSize(appPath);
  analysis.totalSizeFormatted = formatSize(analysis.totalSize);
  
  return analysis;
}

async function analyzeWindowsApp(appPath) {
  const analysis = {};
  
  // 分析主要文件和目录
  const items = await fs.readdir(appPath);
  analysis.items = {};
  
  for (const item of items) {
    const itemPath = path.join(appPath, item);
    const stat = await fs.stat(itemPath);
    const size = stat.isDirectory() ? await getDirSize(itemPath) : stat.size;
    
    analysis.items[item] = {
      size: size,
      sizeFormatted: formatSize(size),
      type: stat.isDirectory() ? 'directory' : 'file'
    };
  }
  
  // 总大小
  analysis.totalSize = await getDirSize(appPath);
  analysis.totalSizeFormatted = formatSize(analysis.totalSize);
  
  return analysis;
}

function generateComparisonReport(analysis) {
  console.log('\n' + '='.repeat(80));
  console.log('📋 构建大小分析报告');
  console.log('='.repeat(80));
  
  // 总体对比
  if (analysis.mac.totalSize && analysis.windows.totalSize) {
    const macSize = analysis.mac.totalSize;
    const winSize = analysis.windows.totalSize;
    const difference = macSize - winSize;
    const percentDiff = ((difference / winSize) * 100).toFixed(1);
    
    console.log(`\n📊 总体大小对比:`);
    console.log(`   macOS 应用:     ${analysis.mac.totalSizeFormatted}`);
    console.log(`   Windows 应用:   ${analysis.windows.totalSizeFormatted}`);
    console.log(`   差异:          ${formatSize(Math.abs(difference))} (${percentDiff > 0 ? '+' : ''}${percentDiff}%)`);
  }
  
  // macOS 详细分析
  if (analysis.mac.frameworks) {
    console.log(`\n🍎 macOS Frameworks 分析:`);
    const sortedFrameworks = Object.entries(analysis.mac.frameworks)
      .sort(([,a], [,b]) => b.size - a.size)
      .slice(0, 10);
    
    for (const [name, info] of sortedFrameworks) {
      console.log(`   ${name.padEnd(40)} ${info.sizeFormatted.padStart(10)}`);
    }
  }
  
  if (analysis.mac.resources) {
    console.log(`\n📁 macOS Resources 分析 (前10大):`);
    const sortedResources = Object.entries(analysis.mac.resources)
      .sort(([,a], [,b]) => b.size - a.size)
      .slice(0, 10);
    
    for (const [name, info] of sortedResources) {
      const type = info.type === 'directory' ? '📁' : '📄';
      console.log(`   ${type} ${name.padEnd(35)} ${info.sizeFormatted.padStart(10)}`);
    }
  }
  
  // Windows 详细分析
  if (analysis.windows.items) {
    console.log(`\n🪟 Windows 应用分析 (前10大):`);
    const sortedItems = Object.entries(analysis.windows.items)
      .sort(([,a], [,b]) => b.size - a.size)
      .slice(0, 10);
    
    for (const [name, info] of sortedItems) {
      const type = info.type === 'directory' ? '📁' : '📄';
      console.log(`   ${type} ${name.padEnd(35)} ${info.sizeFormatted.padStart(10)}`);
    }
  }
  
  // 优化建议
  console.log(`\n💡 优化建议:`);
  
  if (analysis.mac.frameworks && analysis.mac.frameworks['Electron Framework.framework']) {
    const electronSize = analysis.mac.frameworks['Electron Framework.framework'].size;
    if (electronSize > 200 * 1024 * 1024) { // 200MB
      console.log(`   • Electron Framework 占用 ${formatSize(electronSize)}，考虑使用更轻量的 Electron 版本`);
    }
  }
  
  if (analysis.mac.resources) {
    const locales = Object.keys(analysis.mac.resources).filter(name => name.endsWith('.lproj'));
    if (locales.length > 5) {
      console.log(`   • 发现 ${locales.length} 个语言包，可移除不需要的语言以节省空间`);
    }
    
    if (analysis.mac.resources['chrome-win']) {
      console.log(`   • 发现 Windows 专用文件，应在 macOS 构建中排除`);
    }
  }
  
  console.log(`   • 使用 'npm run electron:build:mac:optimized' 进行优化构建`);
  console.log(`   • 考虑使用 FFmpeg 下载模式减少包大小`);
  
  console.log('\n' + '='.repeat(80));
}

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

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// 运行分析
if (require.main === module) {
  analyzeBuildSize().catch(console.error);
}

module.exports = { analyzeBuildSize };
