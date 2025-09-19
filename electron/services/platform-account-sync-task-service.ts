import douyinService from "./douyin-service";

export class PlatformAccountSyncTaskService {
  
  async add(accountIdList: string[]) {
    for (let i = 0; i < accountIdList.length; i++) {
      const accountId = accountIdList[i];
      await douyinService.syncAccount(accountId)
    }
  }
}

export default new PlatformAccountSyncTaskService();