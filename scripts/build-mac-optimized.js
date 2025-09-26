#!/usr/bin/env node

/**
 * 优化的 macOS 构建脚本
 * 在构建前排除不必要的文件，而不是构建后清理
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

async function buildMacOptimized() {
  console.log('🍎 开始优化的 macOS 构建...');
  
  const backupDir = 'temp_backup';
  const filesToBackup = [
    'resources/chrome-win',
    'bin/ffmpeg.exe',
    'bin/ffprobe.exe', 
    'bin/ffplay.exe'
  ];
  
  try {
    // 1. 备份 Windows 专用文件
    console.log('📦 备份 Windows 专用文件...');
    await fs.ensureDir(backupDir);
    
    for (const file of filesToBackup) {
      if (await fs.pathExists(file)) {
        const backupPath = path.join(backupDir, file);
        await fs.ensureDir(path.dirname(backupPath));
        await fs.move(file, backupPath);
        console.log(`   备份: ${file} -> ${backupPath}`);
      }
    }
    
    // 2. 运行 macOS 构建
    console.log('🔨 运行 macOS 构建...');
    await runCommand('npm', ['run', 'setup:ffmpeg']);
    await runCommand('npm', ['run', 'build:renderer']);
    await runCommand('npm', ['run', 'build:main']);
    await runCommand('npx', ['electron-builder', '--mac', '--publish=never']);
    
    // 3. 恢复备份的文件
    console.log('🔄 恢复 Windows 专用文件...');
    for (const file of filesToBackup) {
      const backupPath = path.join(backupDir, file);
      if (await fs.pathExists(backupPath)) {
        await fs.ensureDir(path.dirname(file));
        await fs.move(backupPath, file);
        console.log(`   恢复: ${backupPath} -> ${file}`);
      }
    }
    
    // 4. 清理备份目录
    await fs.remove(backupDir);
    
    // 5. 显示结果
    const dmgFiles = await fs.readdir('dist_electron/');
    const dmgFile = dmgFiles.find(f => f.endsWith('.dmg'));
    
    if (dmgFile) {
      const dmgPath = path.join('dist_electron', dmgFile);
      const stats = await fs.stat(dmgPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
      
      console.log(`✅ 构建完成！`);
      console.log(`📊 DMG 文件大小: ${sizeMB} MB`);
      console.log(`📁 文件位置: ${dmgPath}`);
    }
    
  } catch (error) {
    console.error('❌ 构建失败:', error);
    
    // 出错时也要恢复文件
    console.log('🔄 恢复备份文件...');
    for (const file of filesToBackup) {
      const backupPath = path.join(backupDir, file);
      if (await fs.pathExists(backupPath)) {
        await fs.ensureDir(path.dirname(file));
        await fs.move(backupPath, file).catch(() => {});
      }
    }
    await fs.remove(backupDir).catch(() => {});
    
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
  buildMacOptimized().catch(console.error);
}

module.exports = { buildMacOptimized };
