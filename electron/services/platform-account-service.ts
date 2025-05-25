import { PlatformAccount } from "../entities/platform-account";
import dayjs from 'dayjs'
import { PlatformAccountDao } from "../daos/platform-account-dao";

export class PlatformAccountService {

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

  public list() {
    return this.dao.list();
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