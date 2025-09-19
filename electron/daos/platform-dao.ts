import { databaseService } from "../services/database-service";
import { BaseDao } from "./base-dao";

const BASE_SELECT = `SELECT id, name, logo, login_url as loginUrl, publish_video_url as publishVideoUrl, 
  status, 
  created_at as createdAt, updated_at as updatedAt`;

export class PlatformDao extends BaseDao {

  constructor() {
    super("platforms", BASE_SELECT)
  }

}
