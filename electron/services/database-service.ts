const initSqlJs = require('sql.js')
import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { getPlatformAppDataPath, getInstallationDirectory } from './default-save-path'
import log from 'electron-log'

// 获取数据库资源文件路径的辅助函数
function getDatabaseResourcePath(filename: string): string {
  const installDir = getInstallationDirectory();
  // 在开发环境中，数据库文件在 resources/database/ 目录下
  // 在打包环境中，数据库文件在 database/ 目录下
  const dbDir = app.isPackaged ? 'database' : 'resources/database';
  return path.join(installDir, dbDir, filename);
}

class DatabaseService {
  static instance: any;
  dbPath: string;
  db: any;
  private _isInitialized: boolean = false;
  
  public get isInitialized(): boolean {
    return this._isInitialized;
  }
  public static getInstance() {
    if  (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
      log.info('Creating new DatabaseService instance');
    } else {
      log.debug('Returning existing DatabaseService instance');
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
      // 初始化 SQL.js - 直接提供 WASM 文件内容
      const installDir = getInstallationDirectory();
      log.info('Installation directory: ' + installDir);
      log.info('App is packaged: ' + app.isPackaged);
      log.info('Process execPath: ' + process.execPath);
      
      const wasmPath = getDatabaseResourcePath('sql-wasm.wasm');
      log.info('WASM file path: ' + wasmPath);
      log.info('WASM file exists: ' + fs.existsSync(wasmPath));
      
      let SQL;
      if (fs.existsSync(wasmPath)) {
        // 直接读取 WASM 文件内容
        const wasmBuffer = fs.readFileSync(wasmPath);
        SQL = await initSqlJs({
          wasmBinary: wasmBuffer
        });
        log.info('SQL.js initialized with local WASM binary');
      } else {
        // 回退到默认方式
        SQL = await initSqlJs();
        log.warn('Using default SQL.js initialization (will download from CDN)');
      }
      log.info('SQL.js初始化完成')
      this.dbPath = path.join(getPlatformAppDataPath(), 'database.sqlite')
      log.info('数据库文件路径：' + this.dbPath)
      const databaseExists = fs.existsSync(this.dbPath);
      
      if (databaseExists) {
        const data = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(new Uint8Array(data));
        const initTableSqlPath = getDatabaseResourcePath('init_table.sql');
        log.info('Init table SQL path (existing DB): ' + initTableSqlPath);
        log.info('Init table SQL file exists (existing DB): ' + fs.existsSync(initTableSqlPath));
        this.executeSqlFile(initTableSqlPath);
        // Run migrations for existing databases
        this.runMigrations();
        this.save();
      } else {
        this.db = new SQL.Database();
        const initTableSqlPath = getDatabaseResourcePath('init_table.sql');
        log.info('Init table SQL path (new DB): ' + initTableSqlPath);
        log.info('Init table SQL file exists (new DB): ' + fs.existsSync(initTableSqlPath));
        this.executeSqlFile(initTableSqlPath);
        const initDataSqlPath = getDatabaseResourcePath('init_data.sql');
        log.info('Init data SQL path (new DB): ' + initDataSqlPath);
        log.info('Init data SQL file exists (new DB): ' + fs.existsSync(initDataSqlPath));
        this.executeSqlFile(initDataSqlPath);
        this.save();
      }
      this._isInitialized = true;
      log.log('Database initialized');
    } catch (err) {
      log.error('Database initialization error:', err);
      throw err; // 重新抛出错误，确保调用者知道初始化失败
    }
  }

  runMigrations() {
    try {
      // Check if video_publish_settings columns exist and add if missing
      this.addColumnIfNotExists('video_publish_settings', 'frequency', 'TEXT DEFAULT \'minutes\'');
      this.addColumnIfNotExists('video_publish_settings', 'frequency_value', 'INTEGER DEFAULT 5');
      this.addColumnIfNotExists('video_publish_settings', 'daily_time', 'TEXT');
      this.addColumnIfNotExists('video_publish_settings', 'status', 'INTEGER DEFAULT 0');
      this.addColumnIfNotExists('video_publish_settings', 'task_ids', 'TEXT DEFAULT \'\'');
      this.addColumnIfNotExists('video_publish_settings', 'account_ids', 'TEXT DEFAULT \'\'');
      this.addColumnIfNotExists('video_publish_settings', 'platform_id', 'INTEGER');
      
      // Add location fields to video_publish_tasks table
      this.addColumnIfNotExists('video_publish_tasks', 'city_name', 'TEXT');
      this.addColumnIfNotExists('video_publish_tasks', 'tag_name', 'TEXT');
      
      // Add location fields to video_publish_settings table
      this.addColumnIfNotExists('video_publish_settings', 'city_name', 'TEXT');
      this.addColumnIfNotExists('video_publish_settings', 'tag_name', 'TEXT');
      
      log.log('Migrations completed successfully');
    } catch (err) {
      log.error('Migration error:', err);
    }
  }

  addColumnIfNotExists(tableName: string, columnName: string, columnDefinition: string) {
    try {
      // Check if column exists by querying table info
      const stmt = this.db.prepare(`PRAGMA table_info(${tableName})`);
      const tableInfo: any[] = [];
      while (stmt.step()) {
        tableInfo.push(stmt.getAsObject());
      }
      stmt.free();
      
      const columnExists = tableInfo.some(column => column.name === columnName);
      
      if (!columnExists) {
        const sql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`;
        this.executeSqlScript(sql);
        log.log(`Added column ${columnName} to table ${tableName}`);
      } else {
        log.log(`Column ${columnName} already exists in table ${tableName}`);
      }
    } catch (err) {
      log.error(`Error adding column ${columnName} to table ${tableName}:`, err);
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
    if (!this._isInitialized) {
      log.error('Database service not initialized when calling query:', {
        sql: sql.substring(0, 100),
        stackTrace: new Error().stack
      });
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
    if (!this._isInitialized) {
      log.error('Database service not initialized when calling execute:', {
        sql: sql.substring(0, 100),
        stackTrace: new Error().stack
      });
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
    if (!this._isInitialized) {
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
      this._isInitialized = false;
      log.log('Database connection closed');
    }
  }
  public generateTextID(): string {
    const uuid: string =  crypto.randomUUID();
    return uuid.replace(/-/g, '')
  }

  public generateIntegerID(tableName: string, idColumnName = 'id'): number {
    if (!this._isInitialized) {
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