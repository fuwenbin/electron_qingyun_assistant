import { ipcMain } from 'electron'
import platformService from '../services/platform-service'
import platformAccountService from './platform-account-service';
import videoPublishSettingService from './video-publish-setting-service';
import videoPublishTaskService from './video-publish-task-service';
import platformAccountSyncTaskService from './platform-account-sync-task-service';
import { decodeArg } from '../utils';
import BusinessException from '../exception/business-exception';
import testService from './test';
import platfromAccountCommentService from './platform-account-comment-service';
export function initApiController() {
  ipcMain.handle('api-request', async (_, paramsStr) => {
    const params = JSON.parse(decodeArg(paramsStr))
    const { url, method, data } = params
    try {
      if (url === '/platform/list' && method.toLowerCase() === 'get') {
        const resData = platformService.list()
        return {
          code: 0,
          data: resData,
          message: 'success'
        }
      } else if (url === '/platform-account/addAccount' && method.toLowerCase() === 'post') {
        const resData = await platformAccountService.addAccountLogin(data)
        return {
          code: 0,
          data: resData,
          message: 'success'
        }
      } else if (url === '/platform-account/list' && method.toLowerCase() === 'get') {
        const resData = platformAccountService.list()
        return {
          code: 0,
          data: resData,
          message: 'success'
        }
      } else if (url === '/video-publish-setting/save' && method.toLowerCase() === 'post') {
        const resData = videoPublishSettingService.save(data)
        return {
          code: 0,
          message: 'success',
          data: resData
        }
      } else if (url === '/video-publish-setting/list' && method.toLowerCase() === 'get') {
        const resData = videoPublishSettingService.list()
        return {
          code: 0,
          message: 'success',
          data: resData
        }
      } else if (url === '/video-publish-task/publish' && method.toLowerCase() === 'post') {
        const resData = videoPublishTaskService.publish(data)
        return {
          code: 0,
          message: 'success',
          data: resData
        }
      } else if (url === '/video-publish-task/list' && method.toLowerCase() === 'get') {
        const resData = videoPublishTaskService.list()
        return {
          code: 0,
          message: 'success',
          data: resData
        }
      } else if (url === '/video-publish-task/statistic-by-filename' && method.toLowerCase() === 'get') {
        const resData = videoPublishTaskService.statisticVideoPublishPlatform(data)
        return {
          code: 0,
          message: 'success',
          data: resData
        }
      } else if (url === '/platform-account-sync-task/add') {
        const resData = await platformAccountSyncTaskService.add(data)
        return {
          code: 0,
          message: 'success',
          data: resData
        }
      } else if (url === '/platform-account-comment/listNotReplyCommentLatest10' && method.toLowerCase() === 'get') {
        const resData = await platfromAccountCommentService.listNotReplyCommentLatest10(data)
        return {
          code: 0,
          message: 'success',
          data: resData
        }
      } else if (url === '/platform-account-comment/publishCommentReply' && method.toLowerCase() === 'post') {
        await platfromAccountCommentService.publishCommentReply(data)
        return {
          code: 0,
          message: 'success'
        }
      } else {
        throw new BusinessException(404, '请求的服务不存在')
      }
    } catch (error: any) {
      console.error(error);
      if (error instanceof BusinessException) {
        return { code: error.code, message: error.message }
      } else if (error instanceof Error) {
        return { code: 500, message: error.message }
      } else {
        return { code: 500, message: error }
      }
    }
  })
}