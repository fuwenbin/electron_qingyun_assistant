import { ipcMain } from 'electron'
import { PlatformService } from '../services/platform-service'
import { PlatformAccountService } from './platform-account-service';
import { decodeArg } from '../utils';

const platformService = new PlatformService();
const platformAccountService = new PlatformAccountService();
export function initApiController() {
  ipcMain.handle('api-request', async (_, paramsStr) => {
    const params = JSON.parse(decodeArg(paramsStr))
    const { url, method, data } = params
    if (url === '/platform/list' && method.toLowerCase() === 'GET') {
      const resData = platformService.list()
      return {
        code: 0,
        data: resData,
        message: 'success'
      }
    } else if (url === '/platform-account/list') {
      const resData = platformAccountService.list()
      return {
        code: 0,
        data: resData,
        message: 'success'
      }
    } else {
      return {
        code: 404,
        message: '请求的服务不存在'
      }
    }
  })
}