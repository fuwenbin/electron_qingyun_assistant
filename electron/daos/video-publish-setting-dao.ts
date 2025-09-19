import VideoPublishSetting from "../entities/video-publish-setting";
import { BaseDao } from "./base-dao";
import dayjs from "dayjs";

const BASE_SELECT = `SELECT id, file_path as filePath, title, description, 
  topic_group1 as topicGroup1, topic_group2 as topicGroup2, platform_data as platformData,
  created_at as createdAt, updated_at as updatedAt`;

export default class VideoPublishSettingDao extends BaseDao {

  constructor() {
    super("video_publish_settings", BASE_SELECT)
  }

  insert(entity: VideoPublishSetting): number {
    const currentTime  = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const columns = [
      'id', 'file_path', 'title', 'description', 'topic_group1', 'topic_group2', 'platform_data', 
      'created_at', 'updated_at'
    ];
    const values = [
      entity.id,
      entity.filePath,
      entity.title,
      entity.description,
      entity.topicGroup1,
      entity.topicGroup2,
      entity.platformData,
      currentTime,
      currentTime
     ]
     return this.insertByMapping(columns, values)
    }
  
    update(entity: VideoPublishSetting): number {
      const currentTime  = dayjs().format('YYYY-MM-DD HH:mm:ss');
      const columns = ['file_path', 'title', 'description', 'topic_group1', 
        'topic_group2', 'platform_data', 'updated_at', 'id'
      ];
      const values = [
        entity.filePath,
        entity.title,
        entity.description,
        entity.topicGroup1,
        entity.topicGroup2,
        entity.platformData,
        currentTime,
        entity.id
      ]
      return this.updateByMapping(columns, values)
    }
  
}
