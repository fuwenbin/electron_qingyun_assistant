import DouyinService from "./douyin-service";

export default class PlatformAccountSyncTaskService {

  douyinService: DouyinService;

  constructor() {
    this.douyinService = new DouyinService();
  }
  
  async add(accountIdList: string[]) {
    for (let i = 0; i < accountIdList.length; i++) {
      const accountId = accountIdList[i];
      await this.douyinService.syncAccount(accountId)
    }
  }
}