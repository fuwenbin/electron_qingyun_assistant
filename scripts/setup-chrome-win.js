#!/usr/bin/env node

/**
 * 下载并设置 Windows Chrome 环境
 * 为 Playwright 自动化提供完整的 Chrome 浏览器
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');

async function setupChromeWin() {
  console.log('🌐 开始设置 Windows Chrome 环境...');
  
  try {
    // 1. 创建临时目录
    const tempDir = path.join(__dirname, '..', 'temp-chrome-win');
    const targetDir = path.join(__dirname, '..', 'resources', 'chrome-win');
    
    await fs.ensureDir(tempDir);
    await fs.ensureDir(path.dirname(targetDir));
    
    console.log(`📁 临时目录: ${tempDir}`);
    console.log(`📂 目标目录: ${targetDir}`);
    
    // 2. 检查是否已经存在chrome-win目录
    if (await fs.pathExists(targetDir)) {
      const chromeExe = path.join(targetDir, 'chrome.exe');
      if (await fs.pathExists(chromeExe)) {
        console.log('✅ chrome-win 环境已存在，跳过下载');
        return;
      }
    }
    
    // 3. 直接下载 Windows Chrome
    console.log('📦 直接下载 Chrome for Windows...');
    await downloadChromeWin(tempDir, targetDir);
    
    // 5. 验证安装
    await validateChromeWin(targetDir);
    
    // 6. 清理临时文件
    console.log('🧹 清理临时文件...');
    await fs.remove(tempDir);
    
    console.log('🎉 Windows Chrome 环境设置完成！');
    
  } catch (error) {
    console.error('❌ 设置失败:', error);
    throw error;
  }
}

async function findChromiumDirs(searchDir) {
  const dirs = [];
  
  try {
    const entries = await fs.readdir(searchDir);
    
    for (const entry of entries) {
      const fullPath = path.join(searchDir, entry);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        if (entry.startsWith('chromium-')) {
          dirs.push(fullPath);
        } else {
          // 递归搜索子目录
          const subDirs = await findChromiumDirs(fullPath);
          dirs.push(...subDirs);
        }
      }
    }
  } catch (error) {
    // 忽略权限错误等
  }
  
  return dirs;
}

async function downloadChromeWin(tempDir, targetDir) {
  console.log('🌐 直接下载 Chrome for Windows...');
  
  // 使用最新的 Chrome for Testing 下载链接
  const chromeUrl = 'https://storage.googleapis.com/chrome-for-testing-public/121.0.6167.85/win64/chrome-win64.zip';
  const zipPath = path.join(tempDir, 'chrome-win64.zip');
  
  // 下载文件
  await downloadFile(chromeUrl, zipPath);
  
  // 解压文件 (在Mac/Linux上使用unzip命令)
  console.log('📦 解压 Chrome...');
  await runCommand('unzip', ['-q', zipPath, '-d', tempDir]);
  
  // 查找解压后的目录
  const extractedDir = path.join(tempDir, 'chrome-win64');
  if (await fs.pathExists(extractedDir)) {
    console.log('📂 复制解压的 Chrome...');
    await fs.copy(extractedDir, targetDir);
  } else {
    // 尝试其他可能的目录名
    const possibleDirs = ['chrome-win', 'chrome', 'win64'];
    for (const dirName of possibleDirs) {
      const testDir = path.join(tempDir, dirName);
      if (await fs.pathExists(testDir)) {
        console.log(`📂 找到目录: ${dirName}，复制中...`);
        await fs.copy(testDir, targetDir);
        break;
      }
    }
  }
}

function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    console.log(`⬇️  下载: ${url}`);
    
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // 处理重定向
        return downloadFile(response.headers.location, filePath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`下载失败: ${response.statusCode}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'] || '0', 10);
      let downloadedSize = 0;
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (totalSize > 0) {
          const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
          process.stdout.write(`\r   进度: ${percent}%`);
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('\n✅ 下载完成');
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath);
        reject(err);
      });
    }).on('error', reject);
  });
}

async function validateChromeWin(chromeWinDir) {
  console.log('🔍 验证 chrome-win 环境...');
  
  const requiredFiles = [
    'chrome.exe',
    'chrome_elf.dll',
    'chrome_100_percent.pak',
    'resources.pak'
  ];
  
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    const filePath = path.join(chromeWinDir, file);
    if (!(await fs.pathExists(filePath))) {
      missingFiles.push(file);
    } else {
      console.log(`✅ ${file}`);
    }
  }
  
  if (missingFiles.length > 0) {
    console.warn(`⚠️  缺少文件: ${missingFiles.join(', ')}`);
  }
  
  // 检查目录结构
  const entries = await fs.readdir(chromeWinDir);
  console.log(`📊 chrome-win 包含 ${entries.length} 个文件/目录:`);
  console.log(`   ${entries.slice(0, 10).join(', ')}${entries.length > 10 ? '...' : ''}`);
  
  // 检查文件大小
  const chromeExe = path.join(chromeWinDir, 'chrome.exe');
  if (await fs.pathExists(chromeExe)) {
    const stats = await fs.stat(chromeExe);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    console.log(`📏 chrome.exe 大小: ${sizeMB} MB`);
  }
}

function runCommand(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    console.log(`   运行: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env
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

// 运行脚本
if (require.main === module) {
  setupChromeWin().catch(console.error);
}

module.exports = { setupChromeWin };
