import { PlatformAccount } from "../entities/platform-account";
import dayjs from 'dayjs'
import { PlatformAccountDao } from "../daos/platform-account-dao";

export default class PlatformAccountService {

  dao: PlatformAccountDao;
  constructor() {
    this.dao = new PlatformAccountDao();
  }

  public addAccount(platformId: number, platformAccountId: string, name: string, logo: string, stateData: string) {
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
    let platformAccount = this.dao.findByPlatformIdAndPlatformAccountId(platformId, platformAccountId);
    if (!platformAccount) {
      platformAccount = new PlatformAccount();
      platformAccount.remark = '';
    }
    platformAccount.platformId = platformId;
    platformAccount.platformAccountId = platformAccountId;
    platformAccount.name = name;
    platformAccount.logo = logo;
    platformAccount.stateData = stateData;
    platformAccount.status = 1;
    platformAccount.loginStatus = 1;
    platformAccount.lastLoginTime = timestamp;
    this.dao.save(platformAccount);
  }

  public findById(id: string) {
    return this.dao.findById(id);
  }

  public list() {
    return this.dao.list();
  }
  public listByIds(ids: string[]) {
    return this.dao.listByIds(ids);
  }

  getStateData(id: string) {
    const account = this.dao.findById(id);
    if (account) {
      return account.stateData;
    } else {
      return null;
    }
  }

  updateAccountRemark(id: string, remark: string) {

  }
}