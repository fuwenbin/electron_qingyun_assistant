#!/usr/bin/env node

/**
 * 优化的 Windows 构建脚本
 * 确保构建包的完整性和正确性
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

async function buildWinOptimized() {
  console.log('🪟 开始优化的 Windows 构建...');
  
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
    
    // 3. 确保必要的文件存在
    console.log('📋 检查必要文件...');
    const requiredFiles = [
      'bin/ffmpeg.exe',
      'bin/ffprobe.exe', 
      'bin/ffplay.exe',
      'resources/chrome-win',
      'resources/database',
      'resources/fonts'
    ];
    
    for (const file of requiredFiles) {
      if (!await fs.pathExists(file)) {
        console.warn(`⚠️  警告: 文件不存在 ${file}`);
      } else {
        console.log(`✅ 文件存在: ${file}`);
      }
    }
    
    // 4. 运行构建步骤
    console.log('🔨 运行 Windows 构建...');
    await runCommand('npm', ['run', 'setup:ffmpeg']);
    await runCommand('npm', ['run', 'build:renderer']);
    await runCommand('npm', ['run', 'build:main']);
    
    // 5. 临时修改 electron-builder 配置
    console.log('⚙️  更新构建配置...');
    const configPath = 'electron-builder.json';
    const config = await fs.readJson(configPath);
    const originalElectronDist = config.electronDist;
    config.electronDist = electronWinDir;
    await fs.writeJson(configPath, config, { spaces: 2 });
    
    try {
      // 6. 运行 electron-builder 进行打包
      console.log('📦 开始打包...');
      
      const buildEnv = {
        npm_config_target_arch: 'x64',
        npm_config_target_platform: 'win32',
        npm_config_arch: 'x64',
        npm_config_platform: 'win32',
        ELECTRON_CACHE: electronCacheDir
      };
      
      await runCommand('npx', ['electron-builder', '--config', 'electron-builder.json', '--win', '--publish=never', '--x64'], buildEnv);
    } finally {
      // 恢复原始配置
      console.log('🔄 恢复构建配置...');
      config.electronDist = originalElectronDist;
      await fs.writeJson(configPath, config, { spaces: 2 });
    }
    
    // 5. 验证构建结果
    console.log('✅ 验证构建结果...');
    const distDir = 'dist_electron';
    const files = await fs.readdir(distDir);
    
    const exeFile = files.find(f => f.endsWith('.exe') && f.includes('Setup'));
    
    if (exeFile) {
      const exePath = path.join(distDir, exeFile);
      const stats = await fs.stat(exePath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
      
      console.log(`📊 安装包大小: ${sizeMB} MB`);
      console.log(`📁 文件位置: ${exePath}`);
    }
    
    // 6. 检查构建完整性
    console.log('🔍 检查构建完整性...');
    const unpackedDirs = files.filter(f => f.includes('unpacked'));
    
    for (const unpackedDirName of unpackedDirs) {
      const unpackedDir = path.join(distDir, unpackedDirName);
      if (await fs.pathExists(unpackedDir)) {
        const unpackedFiles = await fs.readdir(unpackedDir);
        console.log(`📂 ${unpackedDirName} 包含 ${unpackedFiles.length} 个文件/目录`);
        
        // 检查关键文件
        const keyFiles = ['剪辑助手.exe', 'resources'];
        for (const keyFile of keyFiles) {
          if (unpackedFiles.includes(keyFile)) {
            console.log(`✅ 关键文件存在: ${keyFile}`);
          } else {
            console.warn(`⚠️  关键文件缺失: ${keyFile}`);
          }
        }
        
        // 检查 resources 目录内容
        const resourcesDir = path.join(unpackedDir, 'resources');
        if (await fs.pathExists(resourcesDir)) {
          const resourceFiles = await fs.readdir(resourcesDir);
          console.log(`📁 resources 目录包含: ${resourceFiles.join(', ')}`);
          
          // 检查关键资源
          const keyResources = ['app.asar', 'database', 'chrome-win'];
          for (const keyResource of keyResources) {
            if (resourceFiles.includes(keyResource)) {
              console.log(`✅ 关键资源存在: ${keyResource}`);
            } else {
              console.warn(`⚠️  关键资源缺失: ${keyResource}`);
            }
          }
        }
      }
    }
    
    console.log('🎉 Windows 构建完成！');
    
  } catch (error) {
    console.error('❌ 构建失败:', error);
    process.exit(1);
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`   运行: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
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
  buildWinOptimized().catch(console.error);
}

module.exports = { buildWinOptimized };
