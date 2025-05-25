import { PlatformAccount } from "../entities/platform-account";
import { databaseService } from "../services/database-service";
import { generateTextID } from "../utils/database-utils";
import dayjs from "dayjs";

const BASE_SELECT = `SELECT id, platform_id as platformId, platform_account_id as platformAccountId, 
  name, logo, status, login_status as loginStatus, state_data as stateData, remark, 
  last_login_time as lastLoginTime, created_at as createdAt, updated_at as updatedAt`;

export class PlatformAccountDao { 
  constructor() {}

  insert(entity: PlatformAccount): number {
    const sql = `INSERT INTO platform_accounts 
    (id, platform_id, platform_account_id, name, logo, status, login_status, state_data, 
      remark, last_login_time, created_at, updated_at) 
    VALUES 
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const currentTime  = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const params = [
      entity.id,
      entity.platformId,
      entity.platformAccountId,
      entity.name,
      entity.logo,
      entity.status,
      entity.loginStatus,
      entity.stateData,
      entity.remark,
      entity.lastLoginTime,
      currentTime,
      currentTime
    ]
    const rows = databaseService.execute(sql, params);
    databaseService.save()
    return rows
  }

  update(entity: PlatformAccount): number {
    console.log('更新账号信息：' + JSON.stringify(entity))
    const sql = `UPDATE platform_accounts SET platform_id = ?, platform_account_id = ?, name = ?, logo = ?, 
      status = ?, login_status = ?, state_data = ?, remark = ?, last_login_time = ?, updated_at = ? WHERE id = ?`;
    const currentTime  = dayjs().format('YYYY-MM-DD HH:mm:ss')
      const params = [
      entity.platformId,
      entity.platformAccountId,
      entity.name,
      entity.logo,
      entity.status,
      entity.loginStatus,
      entity.stateData,
      entity.remark,
      entity.lastLoginTime,
      currentTime,
      entity.id
    ]
    const rows = databaseService.execute(sql, params);
    databaseService.save()
    return rows
  }

  save(entity: PlatformAccount) {
    if (entity.id) {
      this.update(entity)
    } else {
      entity.id = generateTextID()
      this.insert(entity)
    }
  }

  list() {
      const sql = `${BASE_SELECT}
      FROM platform_accounts`;
      const records = databaseService.query(sql)
      if (records && records.length > 0) {
        return records
      } else {
        return []
      }
    }

  findById(id: string) {
    const sql = `${BASE_SELECT}
    FROM platform_accounts WHERE id = ?`;
    const params = [id];
    const records = databaseService.query(sql, params)
    if (records && records.length > 0) {
      return records[0]
    } else {
      return null
    }
  }

  findByPlatformIdAndPlatformAccountId(platformId: number, platformAccountId: string) { 
    const sql = `${BASE_SELECT}
    FROM platform_accounts WHERE platform_id = ? AND platform_account_id = ?
    limit 1`;
    const params = [platformId, platformAccountId];
    const records = databaseService.query(sql, params)
    if (records && records.length) {
      return records[0]
    } else {
      return null
    }
  }

}