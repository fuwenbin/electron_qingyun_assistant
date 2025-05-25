import { databaseService } from "../services/database-service";

const BASE_SELECT = `SELECT id, name, logo, login_url as loginUrl, publish_video_url as publishVideoUrl, 
  status, 
  created_at as createdAt, updated_at as updatedAt`;

export class PlatformDao {

  constructor() {}
  list() {
    const sql = `${BASE_SELECT}
    FROM platforms`;
    const records = databaseService.query(sql)
    if (records && records.length > 0) {
      return records
    } else {
      return []
    }
  }
}
