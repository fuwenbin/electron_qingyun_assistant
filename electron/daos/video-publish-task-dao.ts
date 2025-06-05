import { BaseDao } from "./base-dao";
import VideoPublishTask from "../entities/video-publish-task";
import dayjs from "dayjs";
import { databaseService } from "../services/database-service";

const BASE_SELECT = `SELECT id, 
  file_path as filePath, title, description, topic, platform_data as platformData,
  account_id as accountId, platform_id as platformId, publish_type as publishType,
  publish_time as publishTime, scheduled_start_time as scheduledStartTime, 
  start_time as startTime, end_time as endTime,
  status, item_id as itemId,
  created_at as createdAt, updated_at as updatedAt`;

export default class VideoPublishTaskDao extends BaseDao {
  constructor() {
    super("video_publish_tasks", BASE_SELECT)
  }

  insert(entity: VideoPublishTask): number {
    const currentTime  = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const columns = [
      "id",
      "file_path",
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
      "created_at",
      "updated_at"
    ];
    const values = [
      entity.id,
      entity.filePath,
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
      currentTime,
      currentTime
    ];
    return this.insertByMapping(columns, values)
  }
  
  update(entity: VideoPublishTask): number {
    const currentTime  = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const columns = [
      "status",
      "item_id",
      "start_time",
      "end_time",
      "updated_at",
      "id"
    ];
    const values = [
      entity.status,
      entity.itemId,
      entity.startTime,
      entity.endTime,
      currentTime,
      entity.id
    ];
    return this.updateByMapping(columns, values);
  }

  getLatestTaskToPublish(): VideoPublishTask | undefined {
    const currentTime = dayjs().format('YYYY-MM-DD HH:mm');
    const sql = `${this.baseSelect} FROM ${this.tableName} 
      WHERE status = 0 AND scheduled_start_time <= '${currentTime}'
      ORDER BY scheduled_start_time ASC 
      LIMIT 1`;
    const records = databaseService.query(sql);
    if (records && records.length > 0) {
      return records[0];
    } else {
      return undefined;
    }
  }

}