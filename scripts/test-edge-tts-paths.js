#!/usr/bin/env node

/**
 * 测试 Edge TTS 路径检查脚本
 * 用于验证打包后的路径是否正确
 */

const fs = require('fs');
const path = require('path');

function testEdgeTTSPaths() {
  console.log('🔍 测试 Edge TTS 路径...');
  
  // 模拟打包环境
  const resourcesPath = process.resourcesPath || path.join(__dirname, '../dist_electron');
  console.log(`📁 Resources Path: ${resourcesPath}`);
  
  const possiblePaths = [
    path.join(resourcesPath, 'python', 'Scripts', 'edge-tts.exe'),
    path.join(resourcesPath, 'python', 'bin', 'edge-tts'),
    path.join(resourcesPath, 'python-portable', 'bin', 'edge-tts'),
    path.join(resourcesPath, 'python-portable', 'Scripts', 'edge-tts.exe'),
    path.join(__dirname, '../python-portable/bin/edge-tts'),
    path.join(__dirname, '../python-portable/Scripts/edge-tts.exe')
  ];
  
  console.log('\n📋 检查路径:');
  let found = false;
  
  for (const possiblePath of possiblePaths) {
    const exists = fs.existsSync(possiblePath);
    console.log(`  ${exists ? '✅' : '❌'} ${possiblePath}`);
    
    if (exists) {
      const stats = fs.statSync(possiblePath);
      console.log(`     类型: ${stats.isFile() ? '文件' : '目录'}`);
      console.log(`     大小: ${stats.size} bytes`);
      console.log(`     权限: ${stats.mode.toString(8)}`);
      found = true;
    }
  }
  
  if (!found) {
    console.log('\n❌ 未找到任何 Edge TTS 可执行文件');
    console.log('\n💡 解决方案:');
    console.log('1. 确保已运行 npm run setup:python:portable');
    console.log('2. 检查 python-portable 目录是否存在');
    console.log('3. 检查 electron-builder.json 中的 extraResources 配置');
  } else {
    console.log('\n✅ 找到 Edge TTS 可执行文件');
  }
  
  // 检查 python-portable 目录结构
  console.log('\n📁 检查 python-portable 目录结构:');
  const pythonPortablePath = path.join(__dirname, '../python-portable');
  if (fs.existsSync(pythonPortablePath)) {
    console.log(`✅ python-portable 目录存在: ${pythonPortablePath}`);
    
    // 列出目录内容
    try {
      const contents = fs.readdirSync(pythonPortablePath);
      console.log(`   内容: ${contents.join(', ')}`);
      
      // 检查 bin 目录
      const binPath = path.join(pythonPortablePath, 'bin');
      if (fs.existsSync(binPath)) {
        const binContents = fs.readdirSync(binPath);
        console.log(`   bin/ 内容: ${binContents.join(', ')}`);
        
        if (binContents.includes('edge-tts')) {
          console.log('   ✅ 找到 edge-tts 可执行文件');
        } else {
          console.log('   ❌ 未找到 edge-tts 可执行文件');
        }
      } else {
        console.log('   ❌ bin 目录不存在');
      }
    } catch (error) {
      console.log(`   ❌ 读取目录失败: ${error.message}`);
    }
  } else {
    console.log(`❌ python-portable 目录不存在: ${pythonPortablePath}`);
  }
}

if (require.main === module) {
  testEdgeTTSPaths();
}

module.exports = { testEdgeTTSPaths };
