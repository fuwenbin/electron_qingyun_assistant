#!/usr/bin/env node

/**
 * 修复 edge-tts 脚本的 shebang 路径
 * 确保在 Windows 环境下能正确执行
 */

const fs = require('fs');
const path = require('path');

async function fixEdgeTTSShebang() {
  console.log('🔧 修复 edge-tts 脚本的 shebang 路径...');
  
  const edgeTtsPath = path.join(__dirname, '../python-portable/bin/edge-tts');
  
  if (!fs.existsSync(edgeTtsPath)) {
    console.error('❌ edge-tts 文件不存在:', edgeTtsPath);
    return;
  }
  
  try {
    // 读取原始文件
    const content = fs.readFileSync(edgeTtsPath, 'utf8');
    
    // 修复 shebang 路径
    const fixedContent = content.replace(
      /^#!.*$/m,
      '#!/usr/bin/env python'
    );
    
    // 写回文件
    fs.writeFileSync(edgeTtsPath, fixedContent);
    
    console.log('✅ 已修复 edge-tts shebang 路径');
    console.log('   原路径: #!/Users/fuwenbin/workspace/qingyun/vue3-electron-app/venv/bin/python3.13');
    console.log('   新路径: #!/usr/bin/env python');
    
    // 验证修复结果
    const newContent = fs.readFileSync(edgeTtsPath, 'utf8');
    const firstLine = newContent.split('\n')[0];
    console.log('   实际内容:', firstLine);
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  }
}

if (require.main === module) {
  fixEdgeTTSShebang().catch(console.error);
}

module.exports = { fixEdgeTTSShebang };
