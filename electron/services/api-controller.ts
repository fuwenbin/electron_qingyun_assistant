import { ipcMain } from 'electron'
import PlatformService from '../services/platform-service'
import PlatformAccountService from './platform-account-service';
import VideoPublishSettingService from './video-publish-setting-service';
import VideoPublishTaskService from './video-publish-task-service';
import { decodeArg } from '../utils';
import BusinessException from '../exception/business-exception';

const platformService = new PlatformService();
const platformAccountService = new PlatformAccountService();
const videoPublishSettingService = new VideoPublishSettingService();
const videoPublishTaskService = new VideoPublishTaskService();
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