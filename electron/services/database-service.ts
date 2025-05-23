import initSqlJs from 'sql.js'


let SQL;
let db;

export async function initializeDatabase() {
  try {
    // 初始化 SQL.js
    SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
    
    // 创建新数据库
    db = new SQL.Database();
    
    // 或者加载现有数据库文件（如果存在）
    // const fs = require('fs');
    // const data = fs.readFileSync('path/to/database.sqlite');
    // db = new SQL.Database(new Uint8Array(data));
    
    // 创建表
    db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER);');
    
    console.log('Database initialized');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}