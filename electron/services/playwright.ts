const { chromium } = require('playwright');
import { ipcMain } from "electron";
import { decodeArg } from "../utils";
import platformAccountService from "./platform-account-service";
import { waitForRandomTimeout } from "../utils/playwright-utils";
import platformService from "./platform-service";
import log from 'electron-log';
import { getInstallationDirectory } from "./default-save-path";
import path from "path";

export async function getBrowser(headless: boolean = true) {
  let rootPath = getInstallationDirectory()
  let browserPath = path.join(rootPath, 'resources', 'chrome-win', 'chrome.exe');
  return await chromium.launch({
    executablePath: browserPath,
    headless,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox', 
      '--disable-setuid-sandbox'
    ]
  });
}
export function initPlaywright() {
  ipcMain.handle('playwright-action', async (event, paramsStr) => {
    const params = JSON.parse(decodeArg(paramsStr));
    const {  action, payload} = params;
    if (action === 'platform-account-add') {
      const browser = await getBrowser(false);
      const platformId = payload.platformId;
      const loginUrl = payload.loginUrl;
      try {
        await douyinLogin(browser, platformId, loginUrl)
        return {
          code: 0,
          message: 'success'
        }
      } catch (error) {
        return {
          code: 500,
          message: error.message
        }
      }
    } else if (action === 'publish-video') {
      const browser = await getBrowser();
      const platformId = payload.platformId;
      const platformAccountList = payload.accountList;
      try {
        for (let i = 0; i < platformAccountList.length; i++) {
          if (platformId === 1) {
            await douyinPublishVideo(browser, {
              platformId,
              platformAccountId: platformAccountList[i].id,
              ...payload
            })
          }
        }
        return {
          code: 0,
          message: 'success'
        }
      } catch (error) {
        console.log(error);
        return {
          code: 500,
          message: error.message
        }
      }
    }
  });

  async function douyinLogin(browser, platformId: number, loginUrl: string) {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 隐藏自动化特征
    await page.addInitScript(() => {
      // @ts-ignore
      delete navigator.__proto__.webdriver;
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false
      });
    });

    try {
      await page.goto(loginUrl, {
        waitUtil: 'domcontentloaded',
        timeout: 120000
      });
      // 等待用户手动登录
      log.log('请在浏览器中完成抖音登录...');
      await page.waitForNavigation({ url: /douyin\.com\/.?/, timeout: 0 });
      await page.waitForSelector('[data-e2e="live-avatar"]', { timeout: 120000 })
      // 保存登录状态
      const state = await context.storageState();
      const localStorageItems = state.origins.find(v => v.origin === 'https://www.douyin.com').localStorage
      const userInfoItem = localStorageItems.find(v => v.name === 'user_info');
      log.log('localStorage用户信息项：' + JSON.stringify(userInfoItem))
      const userInfo = JSON.parse(userInfoItem.value);
      log.log(userInfo);
      const platformAccountId = userInfo.uid;
      const logoUrl = userInfo.avatarUrl;
      const name = userInfo.nickname;
      platformAccountService.addAccount(platformId, platformAccountId, name, logoUrl, JSON.stringify(state))
    } catch (error) {
      log.log(error);
      throw error;
    } finally {
      await page?.close().catch(() => {});
      await context?.close().catch(() => {});
      await browser?.close().catch(() => {});
    }
  }

  async function douyinPublishVideo(browser: any, payload: any) {
    const platformId = payload.platformId;
    const platform = platformService.findById(platformId);
    // 读取保存的状态
    const stateStr = platformAccountService.getStateData(payload.platformAccountId)
    const context = await browser.newContext({
      storageState: JSON.parse(stateStr)
    });
    const page = await context.newPage();
    const publishVideoUrl = platform.publishVideoUrl;

    try {
      await page.goto(publishVideoUrl);
      // 检查是否仍处于登录状态
      try {
        await page.waitForSelector('#header-avatar', { timeout: 15000 });
        console.log('登录状态恢复成功');
      } catch {
        throw new Error('登录状态已过期，需要重新登录');
      }
      // 开始操作
      // 等待上传区域加载完成
      console.log('等待上传按钮图标加载完成')
      await page.waitForSelector('.container-drag-icon', {
        state: 'visible',
        timeout: 30000 
      });
      await waitForRandomTimeout(page, 2000);
      // 触发上传
      console.log('等待上传文件：' + payload.filePath)
      console.log('等待触发文件上传事件')
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.click('.container-drag-icon', { force: true, delay: 300 }) // 抖音的上传拖拽区域
      ]);
      console.log('触发文件上传事件')

      // 设置视频文件
      await fileChooser.setFiles(payload.filePath);
      if (!fileChooser.files) {
        const fileInputElement = await page.locator('input[type="file"]');
        fileInputElement.setInputFiles(payload.filePath);
        console.log("直接设置文件上传input：" + fileInputElement.files)
      }
      
      // 检查是否处于描述页
      console.log('上传文件后，等待页面跳转到视频发布页面')
      await page.waitForURL('https://creator.douyin.com/creator-micro/content/post/video**', {
        timeout: 60000
      })
      console.log('页面跳转到视频发布页面')
      await page.waitForSelector('.editor-comp-publish', { timeout: 15000 })
      const descriptionLineElement = await page.locator('.zone-container .ace-line');
      await descriptionLineElement.click();
      await page.keyboard.type(payload.description);
      await waitForRandomTimeout(page, 1000);
      await page.mouse.wheel(0, 600);
      if (payload.isTimingPublish) {
        const timingPublishCheckboxTextElement = await page.waitForSelector('label:has-text("定时发布") input[type="checkbox"]', {
          timeout: 5000
        })
        console.log(await timingPublishCheckboxTextElement.textContent())
        await timingPublishCheckboxTextElement.click();
        await waitForRandomTimeout(page, 1000);
        const timingPublishTimeInputElement = await page.waitForSelector('input[placeholder="日期和时间"]')
        timingPublishTimeInputElement.fill(payload.timingPublishTime)
      }
      const publishButtonElement = await page.waitForSelector('button:text("发布")');
      await publishButtonElement.click();
      await page.waitForURL('https://creator.douyin.com/creator-micro/content/manage**', {
        timeout: 30000
      })
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      await page?.close().catch(() => {});
      await context?.close().catch(() => {});
      await browser?.close().catch(() => {});
    }
  }
}