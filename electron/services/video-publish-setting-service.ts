import VideoPublishSettingDao from "../daos/video-publish-setting-dao";
import VideoPublishSetting from  "../entities/video-publish-setting";

export class VideoPublishSettingService {
  dao: VideoPublishSettingDao;

  constructor() {
    this.dao = new VideoPublishSettingDao();
  }

  save(entity: VideoPublishSetting) {
    return this.dao.save(entity);
  }

  findById(id: string) {
    return this.dao.findById(id);
  }

  list() {
    return this.dao.list();
  }
}

export default new VideoPublishSettingService();