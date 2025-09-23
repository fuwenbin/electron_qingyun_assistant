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

  update(entity: VideoPublishSetting) {
    return this.dao.update(entity);
  }

  findById(id: string) {
    return this.dao.findById(id);
  }

  list() {
    return this.dao.list();
  }

  delete(id: string) {
    return this.dao.deleteById(id);
  }

  findOneByStatus(status: number) {
    return this.dao.findOneByStatus(status);
  }
}

export default new VideoPublishSettingService();