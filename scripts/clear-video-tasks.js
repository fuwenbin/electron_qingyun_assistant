#!/usr/bin/env node

/**
 * 清空 video_publish_tasks 表数据的脚本
 * 仅用于开发环境，使用项目目录下的数据库文件
 * 
 * 使用方法:
 * node scripts/clear-video-tasks.js
 * 或
 * npm run clear:video-tasks
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// 获取开发环境数据库路径（项目目录下）
function getDevDatabasePath() {
  return path.join(getInstallationDirectory(), 'data');
}

// 获取安装目录
function getInstallationDirectory() {
  return path.resolve(__dirname, '..');
}

async function clearVideoTasks() {
  try {
    console.log('🚀 开始清空 video_publish_tasks 表数据...');
    
    // 初始化 SQL.js
    const SQL = await initSqlJs({
      locateFile: file => {
        const localPath = path.join(getInstallationDirectory(), 'resources', 'database', file);
        return fs.existsSync(localPath) 
          ? localPath 
          : `https://sql.js.org/dist/${file}`;
      }
    });
    
    // 数据库文件路径（开发环境，使用项目目录下的数据库）
    const dbPath = path.join(getDevDatabasePath(), 'database.sqlite');
    console.log('📁 数据库文件路径:', dbPath);
    
    // 检查数据库文件是否存在
    if (!fs.existsSync(dbPath)) {
      console.log('❌ 数据库文件不存在:', dbPath);
      console.log('💡 请先运行应用程序创建数据库文件');
      return;
    }
    
    // 读取数据库文件
    const data = fs.readFileSync(dbPath);
    const db = new SQL.Database(new Uint8Array(data));
    
    // 查询清空前的记录数量
    const countBeforeStmt = db.prepare('SELECT COUNT(*) as count FROM video_publish_tasks');
    countBeforeStmt.step();
    const countBefore = countBeforeStmt.getAsObject().count;
    countBeforeStmt.free();
    
    console.log(`📊 清空前记录数量: ${countBefore}`);
    
    if (countBefore === 0) {
      console.log('✅ 表中没有数据，无需清空');
      db.close();
      return;
    }
    
    // 询问用户确认
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question(`⚠️  即将删除 ${countBefore} 条记录，确定要继续吗？(y/N): `, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
    
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ 操作已取消');
      db.close();
      return;
    }
    
    // 清空表数据
    console.log('🗑️  正在清空表数据...');
    db.exec('DELETE FROM video_publish_tasks');
    
    // 重置自增ID（如果有的话）
    // db.exec('DELETE FROM sqlite_sequence WHERE name="video_publish_tasks"');
    
    // 验证清空结果
    const countAfterStmt = db.prepare('SELECT COUNT(*) as count FROM video_publish_tasks');
    countAfterStmt.step();
    const countAfter = countAfterStmt.getAsObject().count;
    countAfterStmt.free();
    
    console.log(`📊 清空后记录数量: ${countAfter}`);
    
    // 保存数据库
    const exportedData = db.export();
    const buffer = Buffer.from(exportedData);
    fs.writeFileSync(dbPath, buffer);
    
    console.log('💾 数据库已保存');
    console.log('✅ video_publish_tasks 表数据清空完成！');
    
    db.close();
    
  } catch (error) {
    console.error('❌ 清空数据时发生错误:', error);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  clearVideoTasks().then(() => {
    console.log('🎉 脚本执行完成');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { clearVideoTasks };