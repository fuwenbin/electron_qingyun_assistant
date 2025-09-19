import { PlatformDao } from "../daos/platform-dao";

export class PlatformService {

  dao: PlatformDao;
  constructor() {
    this.dao = new PlatformDao();
  }

  async addPlatform(name: string, logo: string, url: string) {
    return [];
  }

  public list() {
    return this.dao.list();
  }

  public findById(id: number) {
    return this.dao.findById(id);
  }

  public listByIds(ids: number[]) {
    return this.dao.listByIds(ids);
  }
}

export default new PlatformService();