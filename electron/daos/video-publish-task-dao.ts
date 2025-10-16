import { BaseDao } from "./base-dao";
import VideoPublishTask from "../entities/video-publish-task";
import dayjs from "dayjs";
import { databaseService } from "../services/database-service";

const BASE_SELECT = `SELECT id, 
  file_path as filePath, file_name as fileName, title, description, topic, platform_data as platformData,
  account_id as accountId, platform_id as platformId, publish_type as publishType,
  publish_time as publishTime, scheduled_start_time as scheduledStartTime, 
  start_time as startTime, end_time as endTime,
  status, item_id as itemId,
  collect_count as collectCount, comment_count as commentCount, digg_count as diggCount,
  play_count as playCount, share_count as shareCount, live_watch_count as liveWatchCount,
  forward_count as forwardCount, city_name as cityName, tag_name as tagName,
  created_at as createdAt, updated_at as updatedAt`;

export default class VideoPublishTaskDao extends BaseDao {
  constructor() {
    super("video_publish_tasks", BASE_SELECT)
  }

  insert(entity: VideoPublishTask): number {
    const currentTime  = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const columns = [
      "file_path",
      "file_name",
      "title",
      "description",
      "topic",
      "platform_data",
      "account_id",
      "platform_id",
      "publish_type",
      "publish_time",
      "scheduled_start_time",
      "start_time",
      "end_time",
      "status",
      "item_id",
      "collect_count",
      "comment_count",
      "digg_count",
      "forward_count",
      "live_watch_count",
      "play_count",
      "share_count",
      "city_name",
      "tag_name",
      "created_at",
      "updated_at"
    ];
    const values = [
      entity.filePath,
      entity.fileName,
      entity.title,
      entity.description,
      entity.topic,
      entity.platformData,
      entity.accountId,
      entity.platformId,
      entity.publishType,
      entity.publishTime,
      entity.scheduledStartTime,
      entity.startTime,
      entity.endTime,
      entity.status,
      entity.itemId,
      entity.collectCount,
      entity.commentCount,
      entity.diggCount,
      entity.forwardCount,
      entity.liveWatchCount,
      entity.playCount,
      entity.shareCount,
      entity.cityName || '',
      entity.tagName || '',
      currentTime,
      currentTime
    ];
    const generatedId = this.insertAndGetId(columns, values);
    entity.id = generatedId; // Set the generated ID back to the entity
    return generatedId;
  }
  
  update(entity: VideoPublishTask): number {
    const currentTime  = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const columns = [
      "status",
      "item_id",
      "start_time",
      "end_time",
      "collect_count",
      "comment_count",
      "digg_count",
      "forward_count",
      "live_watch_count",
      "play_count",
      "share_count",
      "updated_at",
      "id"
    ];
    const values = [
      entity.status,
      entity.itemId,
      entity.startTime,
      entity.endTime,
      entity.collectCount,
      entity.commentCount,
      entity.diggCount,
      entity.forwardCount,
      entity.liveWatchCount,
      entity.playCount,
      entity.shareCount,
      currentTime,
      entity.id
    ];
    return this.updateByMapping(columns, values);
  }

  save(entity: VideoPublishTask): VideoPublishTask {
    if (entity.id && entity.id > 0) {
      this.update(entity);
    } else {
      this.insert(entity); // insert method will set the generated ID
    }
    return entity;
  }

  getLatestTaskToPublish(): VideoPublishTask | undefined {
    // const currentTime = dayjs().format('YYYY-MM-DD HH:mm');
    const sql = `${this.baseSelect} FROM ${this.tableName} 
      WHERE status = 0 
      ORDER BY id ASC 
      LIMIT 1`;
    const records = databaseService.query(sql);
    if (records && records.length > 0) {
      return records[0];
    } else {
      return undefined;
    }
  }

  statisticVideoPublishPlatform(fileNameList: string[]) {
    const placeholder = fileNameList.map(() => '?').join(',');
    const sql = `
      ${this.baseSelect}
      from ${this.tableName}
      where file_name in (${placeholder})
      order by file_name, platform_id;
    `
    return databaseService.query(sql, fileNameList)
  }

  findByItemId(itemId: string) {
    const sql = `
      ${this.baseSelect}
      from ${this.tableName}
      where item_id = ?
      limit 1;
    `
    const params = [itemId]
    const records = databaseService.query(sql, params)
    if (records && records.length > 0) {
      return records[0]
    } else {
      return null
    }

  }

  listPaged(params: {
    id?: number,
    status?: number,
    keyword?: string,
    page?: number,
    pageSize?: number,
  }): { list: any[]; total: number } {
    const whereSql: string[] = []
    const whereParams: any[] = []

    if (params.id !== undefined && params.id !== null && `${params.id}`.trim() !== '') {
      whereSql.push('id = ?')
      whereParams.push(params.id)
    }

    if (params.status !== undefined && params.status !== null && `${params.status}`.trim() !== '') {
      whereSql.push('status = ?')
      whereParams.push(params.status)
    }

    if (params.keyword && params.keyword.trim()) {
      whereSql.push('(file_name LIKE ? OR title LIKE ?)')
      const like = `%${params.keyword.trim()}%`
      whereParams.push(like, like)
    }

    const page = Math.max(1, Number(params.page || 1))
    const pageSize = Math.max(1, Number(params.pageSize || 10))
    const offset = (page - 1) * pageSize

    const whereClause = whereSql.length ? `WHERE ${whereSql.join(' AND ')}` : ''

    const countSql = `SELECT COUNT(1) as total FROM ${this.tableName} ${whereClause};`
    const countRes = databaseService.query(countSql, whereParams)
    const total = (countRes && countRes.length > 0) ? Number(countRes[0].total || 0) : 0

    const listSql = `
      ${this.baseSelect}
      FROM ${this.tableName}
      ${whereClause}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `
    const listParams = [...whereParams, pageSize, offset]
    const list = databaseService.query(listSql, listParams)

    return { list, total }
  }

  getFilePathsByAccountAndPlatform(accountId: string, platformId: number): string[] {
    const sql = `SELECT file_path FROM ${this.tableName} WHERE account_id = ? AND platform_id = ?`;
    const params = [accountId, platformId];
    const records = databaseService.query(sql, params);
    
    if (records && records.length > 0) {
      return records.map(record => record.file_path);
    } else {
      return [];
    }
  }
}