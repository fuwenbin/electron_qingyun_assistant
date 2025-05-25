const initSqlJs = require('sql.js')
import fs from 'fs'
import path from 'path'
import { getPlatformAppDataPath, getInstallationDirectory } from './default-save-path'
import log from 'electron-log'

class DatabaseService {
  static instance: any;
  dbPath: string;
  db: any;
  private isInitialized: boolean = false;
  public static getInstance() {
    if  (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private constructor() {
    log.info('数据库实例创建')
  }
  public async init() {
    log.info('开始初始化数据库')
    if (this.isInitialized) {
      return;
    }
    try {
      // 初始化 SQL.js
      const SQL = await initSqlJs({
        locateFile: file => {
          // 在生产环境中使用本地文件
          const localPath = path.join(getInstallationDirectory(), 'resources', 'database', file);
          log.info('localPath: ' + localPath)
          return fs.existsSync(localPath) 
            ? localPath 
            : `https://sql.js.org/dist/${file}`;
        }
      });
      log.info('SQL.js初始化完成')
      this.dbPath = path.join(getPlatformAppDataPath(), 'database.sqlite')
      log.info('数据库文件路径：' + this.dbPath)
      
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(new Uint8Array(data));
      } else {
        this.db = new SQL.Database();
        const initTableSqlPath = path.join(getInstallationDirectory(), 'resources', 'database', 'init_table.sql');
        this.executeSqlFile(initTableSqlPath);
        const initDataSqlPath = path.join(getInstallationDirectory(), 'resources', 'database', 'init_data.sql');
        this.executeSqlFile(initDataSqlPath);
        this.save();
      }
      this.isInitialized = true;
      log.log('Database initialized');
    } catch (err) {
      log.error('Database initialization error:', err);
    }
  }

  executeSqlFile(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const sqlFileData = fs.readFileSync(filePath, 'utf8');
    const sqlList = sqlFileData.split(';');
    for (const sql of sqlList) {
      this.executeSqlScript(sql);
    }
  }
  executeSqlScript(sql: string) {
    log.log('开始执行SQL：' + sql);
    try {
      this.db.run(sql);
      log.log('SQL script executed successfully.');
    } catch (err) {
      log.error('Error executing SQL script:', err);
    }
  }

  public query(sql: string, params: any[] = []): any[] {
    if (!this.isInitialized) {
      throw new Error('Database service not initialized');
    }

    try {
      const stmt = this.db.prepare(sql);
      if (params && params.length) {
        stmt.bind(params);
      }
      
      const results: any[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      
      stmt.free();
      return results;
    } catch (err) {
      log.error('Query error:', err);
      throw err;
    }
  }

  public execute(sql: string, params: any[] = []): number {
    if (!this.isInitialized) {
      throw new Error('Database service not initialized');
    }

    if (!sql.trim()) return 0;

    try {
      console.debug('Executing SQL:', sql);
      console.log('Parameters:', JSON.stringify(params))
      const stmt = this.db.prepare(sql);
      // 绑定参数
      if (params && params.length) {
        stmt.bind(params);
      }
      // 执行语句
      stmt.step();
      const rowsAffected = this.db.getRowsModified();
      stmt.free();
      return rowsAffected
    } catch (err) {
      log.error('SQL execution error:', err);
      throw err;
    }
  }

  public async transaction(operations: () => Promise<void>): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Database service not initialized');
    }

    try {
      this.db.exec('BEGIN TRANSACTION');
      await operations();
      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      log.error('Transaction failed:', err);
      throw err;
    }
  }

  public save() {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
    log.log('Database saved to', this.dbPath);
  }

  public close(): void {
    if (this.db) {
      this.save();
      this.db.close();
      this.isInitialized = false;
      log.log('Database connection closed');
    }
  }
  public generateTextID(): string {
    const uuid: string =  crypto.randomUUID();
    return uuid.replace(/-/g, '')
  }

  public generateIntegerID(tableName: string, idColumnName = 'id'): number {
    if (!this.isInitialized) {
      throw new Error('Database service not initialized');
    }
    const sql = `SELECT MAX(${idColumnName}) AS max_id FROM ${tableName};`
    const results = this.query(sql)
    if (results && results.length > 0) {
      const maxId = results[0].max_id;
      return maxId ? maxId + 1 : 1;
    } else {
      return 1;
    }
  }
}


export const databaseService = DatabaseService.getInstance();