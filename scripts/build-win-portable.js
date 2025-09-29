#!/usr/bin/env node

/**
 * Windows Portable 版本构建脚本
 * 避开 NSIS 安装程序的问题，直接构建可执行版本
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

async function buildWinPortable() {
  console.log('🪟 开始构建 Windows Portable 版本...');
  
  try {
    // 1. 清理之前的构建
    console.log('🧹 清理之前的构建...');
    await fs.remove('dist_electron/');
    
    // 2. 下载 Windows 版本的 Electron
    console.log('⬇️  下载 Windows Electron...');
    const electronCacheDir = '/tmp/electron-cache';
    const electronWinDir = path.join(electronCacheDir, 'electron-win32-x64');
    
    if (!await fs.pathExists(electronWinDir)) {
      console.log('   下载 Windows x64 Electron 36.9.1...');
      await runCommand('npx', ['electron-download', '--version=36.9.1', '--platform=win32', '--arch=x64', `--cache=${electronCacheDir}`]);
      
      console.log('   解压 Electron...');
      const electronZip = path.join(electronCacheDir, 'electron-v36.9.1-win32-x64.zip');
      await runCommand('unzip', ['-q', electronZip, '-d', electronWinDir]);
    } else {
      console.log('   Windows Electron 已存在，跳过下载');
    }
    
    // 3. 运行构建步骤
    console.log('🔨 运行构建步骤...');
    await runCommand('npm', ['run', 'setup:ffmpeg']);
    await runCommand('npm', ['run', 'build:renderer']);
    await runCommand('npm', ['run', 'build:main']);
    
    // 4. 临时修改 electron-builder 配置
    console.log('⚙️  更新构建配置...');
    const configPath = 'electron-builder.json';
    const config = await fs.readJson(configPath);
    const originalElectronDist = config.electronDist;
    config.electronDist = electronWinDir;
    await fs.writeJson(configPath, config, { spaces: 2 });
    
    try {
      // 5. 只构建 portable 版本
      console.log('📦 构建 Portable 版本...');
      
      const buildEnv = {
        npm_config_target_arch: 'x64',
        npm_config_target_platform: 'win32',
        npm_config_arch: 'x64',
        npm_config_platform: 'win32',
        ELECTRON_CACHE: electronCacheDir
      };
      
      await runCommand('npx', ['electron-builder', '--config', 'electron-builder.json', '--win', 'portable', '--publish=never', '--x64'], buildEnv);
    } finally {
      // 恢复原始配置
      console.log('🔄 恢复构建配置...');
      config.electronDist = originalElectronDist;
      await fs.writeJson(configPath, config, { spaces: 2 });
    }
    
    // 4. 验证构建结果
    console.log('✅ 验证构建结果...');
    const distDir = 'dist_electron';
    const files = await fs.readdir(distDir);
    
    console.log(`📂 构建文件: ${files.join(', ')}`);
    
    // 查找 portable 可执行文件
    const portableFile = files.find(f => f.includes('portable') && f.endsWith('.exe'));
    const regularExe = files.find(f => f.endsWith('.exe') && !f.includes('Setup') && !f.includes('portable'));
    
    if (portableFile) {
      const portablePath = path.join(distDir, portableFile);
      const stats = await fs.stat(portablePath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
      
      console.log(`📊 Portable 版本大小: ${sizeMB} MB`);
      console.log(`📁 文件位置: ${portablePath}`);
    }
    
    if (regularExe) {
      const exePath = path.join(distDir, regularExe);
      const stats = await fs.stat(exePath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
      
      console.log(`📊 可执行文件大小: ${sizeMB} MB`);
      console.log(`📁 文件位置: ${exePath}`);
    }
    
    // 5. 检查解压目录
    console.log('🔍 检查解压目录...');
    const unpackedDirs = files.filter(f => f.includes('unpacked'));
    
    for (const unpackedDirName of unpackedDirs) {
      const unpackedDir = path.join(distDir, unpackedDirName);
      if (await fs.pathExists(unpackedDir)) {
        const unpackedFiles = await fs.readdir(unpackedDir);
        console.log(`📂 ${unpackedDirName} 包含 ${unpackedFiles.length} 个文件`);
        
        // 检查主要文件
        const hasMainExe = unpackedFiles.includes('剪辑助手.exe');
        const hasResources = unpackedFiles.includes('resources');
        
        console.log(`${hasMainExe ? '✅' : '❌'} 主程序: 剪辑助手.exe`);
        console.log(`${hasResources ? '✅' : '❌'} 资源目录: resources`);
        
        if (hasResources) {
          const resourcesDir = path.join(unpackedDir, 'resources');
          const resourceFiles = await fs.readdir(resourcesDir);
          console.log(`📁 resources 包含: ${resourceFiles.slice(0, 5).join(', ')}${resourceFiles.length > 5 ? '...' : ''}`);
        }
      }
    }
    
    console.log('🎉 Windows Portable 构建完成！');
    console.log('💡 提示: Portable 版本可以直接运行，无需安装');
    
  } catch (error) {
    console.error('❌ 构建失败:', error);
    process.exit(1);
  }
}

function runCommand(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    console.log(`   运行: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ...env }
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`命令失败，退出码: ${code}`));
      }
    });
    
    child.on('error', reject);
  });
}

// 运行构建
if (require.main === module) {
  buildWinPortable().catch(console.error);
}

module.exports = { buildWinPortable };

