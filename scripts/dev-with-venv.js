#!/usr/bin/env node

/**
 * 开发环境启动脚本
 * 确保虚拟环境被正确激活
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

async function startDevWithVenv() {
  console.log('🚀 启动开发环境 (带虚拟环境)...');
  
  try {
    const projectRoot = process.cwd();
    const venvPath = path.join(projectRoot, 'venv');
    
    // 检查虚拟环境是否存在
    if (!await fs.pathExists(venvPath)) {
      console.log('📦 虚拟环境不存在，正在创建...');
      const { setupPython } = require('./setup-python');
      await setupPython();
    }
    
    // 设置环境变量
    const env = { ...process.env };
    
    if (process.platform === 'win32') {
      const venvScripts = path.join(venvPath, 'Scripts');
      env.PATH = `${venvScripts};${env.PATH}`;
      env.PYTHONPATH = venvPath;
    } else {
      const venvBin = path.join(venvPath, 'bin');
      env.PATH = `${venvBin}:${env.PATH}`;
      env.PYTHONPATH = venvPath;
    }
    
    console.log('🐍 虚拟环境已激活');
    console.log(`   Python 路径: ${env.PYTHONPATH}`);
    
    // 启动开发服务器
    console.log('🔨 启动 Electron 开发服务器...');
    const child = spawn('npm', ['run', 'electron:dev'], {
      stdio: 'inherit',
      shell: true,
      env: env
    });
    
    child.on('close', (code) => {
      console.log(`开发服务器退出，代码: ${code}`);
    });
    
    child.on('error', (error) => {
      console.error('启动开发服务器失败:', error);
    });
    
  } catch (error) {
    console.error('❌ 启动开发环境失败:', error);
    process.exit(1);
  }
}

// 运行开发环境
if (require.main === module) {
  startDevWithVenv().catch(console.error);
}

module.exports = { startDevWithVenv };
