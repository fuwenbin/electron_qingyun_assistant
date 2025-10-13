#!/usr/bin/env node

/**
 * Python 环境设置脚本
 * 为开发和打包准备 Python 环境
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

async function setupPython() {
  console.log('🐍 开始设置 Python 环境...');
  
  try {
    const projectRoot = process.cwd();
    const venvPath = path.join(projectRoot, 'venv');
    
    // 1. 检查虚拟环境是否存在
    if (!await fs.pathExists(venvPath)) {
      console.log('📦 创建虚拟环境...');
      await runCommand('python3', ['-m', 'venv', 'venv']);
    } else {
      console.log('✅ 虚拟环境已存在');
    }
    
    // 2. 激活虚拟环境并安装依赖
    console.log('📥 安装 Python 依赖...');
    
    const pipPath = process.platform === 'win32' 
      ? path.join(venvPath, 'Scripts', 'pip.exe')
      : path.join(venvPath, 'bin', 'pip');
    
    await runCommand(pipPath, ['install', '--upgrade', 'pip']);
    await runCommand(pipPath, ['install', 'edge-tts']);
    
    // 3. 验证安装
    console.log('🔍 验证 Edge TTS 安装...');
    const edgeTtsPath = process.platform === 'win32'
      ? path.join(venvPath, 'Scripts', 'edge-tts.exe')
      : path.join(venvPath, 'bin', 'edge-tts');
    
    if (await fs.pathExists(edgeTtsPath)) {
      console.log('✅ Edge TTS 安装成功');
      
      // 测试 Edge TTS
      try {
        await runCommand(edgeTtsPath, ['--list-voices'], { timeout: 10000 });
        console.log('✅ Edge TTS 功能正常');
      } catch (error) {
        console.warn('⚠️  Edge TTS 测试失败，但已安装');
      }
    } else {
      console.error('❌ Edge TTS 安装失败');
      throw new Error('Edge TTS 安装失败');
    }
    
    console.log('🎉 Python 环境设置完成！');
    
  } catch (error) {
    console.error('❌ Python 环境设置失败:', error);
    process.exit(1);
  }
}

async function createPortablePython() {
  console.log('📦 创建便携式 Python 环境...');
  
  try {
    const projectRoot = process.cwd();
    const venvPath = path.join(projectRoot, 'venv');
    const portablePath = path.join(projectRoot, 'python-portable');
    
    // 清理之前的便携式环境
    if (await fs.pathExists(portablePath)) {
      await fs.remove(portablePath);
    }
    
    // 复制虚拟环境
    console.log('📋 复制虚拟环境...');
    await fs.copy(venvPath, portablePath);
    
    // 清理不必要的文件
    console.log('🧹 清理不必要的文件...');
    const cleanupPaths = [
      path.join(portablePath, 'pyvenv.cfg'),
      path.join(portablePath, 'include'),
      path.join(portablePath, 'lib', 'python3.*', 'site-packages', 'pip'),
      path.join(portablePath, 'lib', 'python3.*', 'site-packages', 'setuptools'),
      path.join(portablePath, 'lib', 'python3.*', 'site-packages', 'wheel')
    ];
    
    for (const cleanupPath of cleanupPaths) {
      if (await fs.pathExists(cleanupPath)) {
        await fs.remove(cleanupPath);
      }
    }
    
    // 创建启动脚本
    console.log('📝 创建启动脚本...');
    const startScript = process.platform === 'win32' 
      ? `@echo off
set PYTHONPATH=%CD%
python.exe -c "import edge_tts; print('Edge TTS ready')"
`
      : `#!/bin/bash
export PYTHONPATH=$PWD
python -c "import edge_tts; print('Edge TTS ready')"
`;
    
    const scriptPath = path.join(portablePath, process.platform === 'win32' ? 'start.bat' : 'start.sh');
    await fs.writeFile(scriptPath, startScript);
    
    if (process.platform !== 'win32') {
      await fs.chmod(scriptPath, '755');
    }
    
    console.log('✅ 便携式 Python 环境创建完成');
    console.log(`📁 位置: ${portablePath}`);
    
  } catch (error) {
    console.error('❌ 便携式 Python 环境创建失败:', error);
    throw error;
  }
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`   运行: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    const timeout = options.timeout || 30000;
    let timeoutId;
    
    if (timeout) {
      timeoutId = setTimeout(() => {
        child.kill();
        reject(new Error(`命令超时: ${command} ${args.join(' ')}`));
      }, timeout);
    }
    
    child.on('close', (code) => {
      if (timeoutId) clearTimeout(timeoutId);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`命令失败，退出码: ${code}`));
      }
    });
    
    child.on('error', (error) => {
      if (timeoutId) clearTimeout(timeoutId);
      reject(error);
    });
  });
}

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0];

if (command === 'setup') {
  setupPython().catch(console.error);
} else if (command === 'portable') {
  createPortablePython().catch(console.error);
} else {
  console.log('用法:');
  console.log('  node setup-python.js setup     - 设置开发环境');
  console.log('  node setup-python.js portable  - 创建便携式环境');
}

module.exports = { setupPython, createPortablePython };
