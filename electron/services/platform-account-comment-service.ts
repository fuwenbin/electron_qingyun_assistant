import douyinService from "./douyin-service";

export class PlatfromAccountCommentService {
  
  async listNotReplyCommentLatest10(data: any) {
    return await douyinService.syncAccountComment(data)
  }

  async publishCommentReply(data: any) {
    await douyinService.publishCommentReply(data)
  }

}

export default new PlatfromAccountCommentService();