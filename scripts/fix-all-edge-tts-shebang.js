#!/usr/bin/env node

/**
 * 修复所有 edge-tts 脚本的 shebang 路径
 * 确保在 Windows 环境下能正确执行
 */

const fs = require('fs');
const path = require('path');

async function fixAllEdgeTTSShebang() {
  console.log('🔧 修复所有 edge-tts 脚本的 shebang 路径...');
  
  const possiblePaths = [
    'python-portable/bin/edge-tts',
    'dist_electron/python/bin/edge-tts',
    'dist_electron/win-unpacked/resources/python/bin/edge-tts',
    'dist_electron/win-unpacked/resources/python-portable/bin/edge-tts'
  ];
  
  let fixedCount = 0;
  
  for (const filePath of possiblePaths) {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (fs.existsSync(fullPath)) {
      try {
        console.log(`📝 处理文件: ${filePath}`);
        
        // 读取原始文件
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // 检查是否需要修复
        if (content.includes('#!/Users/fuwenbin/workspace/qingyun/vue3-electron-app/venv/bin/python3.13')) {
          // 修复 shebang 路径
          const fixedContent = content.replace(
            /^#!.*$/m,
            '#!/usr/bin/env python'
          );
          
          // 写回文件
          fs.writeFileSync(fullPath, fixedContent);
          
          console.log(`✅ 已修复: ${filePath}`);
          fixedCount++;
        } else {
          console.log(`ℹ️  无需修复: ${filePath}`);
        }
        
      } catch (error) {
        console.error(`❌ 修复失败 ${filePath}:`, error.message);
      }
    } else {
      console.log(`⚠️  文件不存在: ${filePath}`);
    }
  }
  
  console.log(`\n📊 修复完成: ${fixedCount} 个文件`);
  
  if (fixedCount > 0) {
    console.log('\n💡 修复说明:');
    console.log('- 将硬编码的 macOS Python 路径改为通用的 /usr/bin/env python');
    console.log('- 这样在 Windows 环境下也能正确执行');
    console.log('- 路径检测已调整为优先使用 python-portable 目录');
  }
}

if (require.main === module) {
  fixAllEdgeTTSShebang().catch(console.error);
}

module.exports = { fixAllEdgeTTSShebang };
