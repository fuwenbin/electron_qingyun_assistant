import { databaseService } from "../services/database-service";

export class BaseDao {

  tableName: string;
  baseSelect: string;
  constructor(tableName: string, baseSelect: string) {
    this.tableName = tableName;
    this.baseSelect = baseSelect;
  }

  findById(id: any) {
    const sql = `${this.baseSelect}
      FROM ${this.tableName} WHERE id = ?`;
    const params = [id];
    const records = databaseService.query(sql, params)
    if (records && records.length > 0) {
      return records[0]
    } else {
      return null
    }
  }

  listByIds(ids: any[]) {
    if (ids && ids.length > 0) {
      const placeholders = ids.map(_ => '?')
      const sql = `${this.baseSelect}
        FROM ${this.tableName} WHERE id in (${placeholders.join(', ')})`;
      const params = ids;
      return databaseService.query(sql, params)
    } else {
      return []
    }
  }

  list() {
    const sql = `${this.baseSelect}
      FROM ${this.tableName}`;
      const records = databaseService.query(sql)
      if (records && records.length > 0) {
        return records
      } else {
        return []
      }
  }


  deleteById(id: any): number {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const params = [id];
    const rows = databaseService.execute(sql, params);
    databaseService.save();
    return rows;
  }

  insertByMapping(columns: string[], values: any[]) {
    const valuePlaceholders = columns.map(_ => '?')
    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) 
      VALUES (${valuePlaceholders.join(', ')});
    `;
    const rows = databaseService.execute(sql, values);
    databaseService.save()
    return rows
  }

  insertAndGetId(columns: string[], values: any[]): number {
    const valuePlaceholders = columns.map(_ => '?')
    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) 
      VALUES (${valuePlaceholders.join(', ')});
    `;
    databaseService.execute(sql, values);
    
    // Get the last inserted row ID
    const lastIdSql = `SELECT last_insert_rowid() as id`;
    const result = databaseService.query(lastIdSql);
    databaseService.save()
    
    return result && result.length > 0 ? result[0].id : 0;
  }

  updateByMapping(columns: string[], values: any[]) {
    let sql = `UPDATE ${this.tableName} SET `;
    for (let i = 0; i < columns.length - 1; i++) {
      if (i === 0) {
        sql += `${columns[i]} = ?`
      } else {
        sql += `, ${columns[i]} = ?`
      }
    }
    sql += ` WHERE id = ?`;
    const rows = databaseService.execute(sql, values);
    databaseService.save()
    return rows
  }

  insert(entity: any): number {
    throw new Error('insert method need to be implemented');
  }

  update(entity: any): number {
    throw new Error('update method need to be implemented');
  }
  save(entity: any) {
    if (entity.id) {
      this.update(entity)
    } else {
      entity.id = databaseService.generateTextID()
      this.insert(entity)
    }
    return entity;
  }

}