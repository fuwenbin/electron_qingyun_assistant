import douyinService from "./douyin-service";

export class TestService {

  async test(data: any) {
    return await douyinService.syncAccountComment(data)
  }
}

export default new TestService();