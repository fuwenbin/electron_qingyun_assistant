const { chromium } = require('playwright');
import { ipcMain } from "electron";
import path from 'path';
import { getPlatformAppDataPath } from "./default-save-path";
import { decodeArg } from "../utils";
import { PlatformAccountService } from "./platform-account-service";
import { waitForRandomTime } from "../utils/playwright-utils";
export function initPlaywright() {
  ipcMain.handle('playwright-action', async (event, paramsStr) => {
    const params = JSON.parse(decodeArg(paramsStr));
    const {  action, payload, sessionId } = params;
    const browser = await chromium.launch({
      executablePath: chromium.executablePath(),
      headless: false,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox', 
        '--disable-setuid-sandbox'
      ]
    });
    if (action === 'douyin-publish-video') {
      douyinPublishVideo(browser, payload, sessionId)
    } else if (action === 'platform-account-add') {
      const platformId = payload.platformId;
      const loginUrl = payload.loginUrl;
      try {
        douyinLogin(browser, platformId, loginUrl)
        event.sender.send('platform-login-finished', {
          success: true
        })
      } catch (error) {
        event.sender.send('platform-login-finished', {
          success: false,
          errorMsg: error.message
        })
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

    await page.goto(loginUrl, {
      waitUtil: 'domcontentloaded',
      timeout: 30000
    });
     // 等待用户手动登录
    console.log('请在浏览器中完成抖音登录...');
    await page.waitForNavigation({ url: /douyin\.com\/.?/, timeout: 0 });
    await waitForRandomTime(page, 10000);
    await page.waitForSelector('[data-e2e="live-avatar"]', { timeout: 600000 })
    // 保存登录状态
    const state = await context.storageState();
    const localStorageItems = state.origins.find(v => v.origin === 'https://www.douyin.com').localStorage
    console.log(JSON.stringify(localStorageItems))
    const userInfoItem = localStorageItems.find(v => v.name === 'user_info');
    const userInfo = JSON.parse(userInfoItem.value);
    console.log(userInfo);
    const platformAccountId = userInfo.uid;
    const logoUrl = userInfo.avatarUrl;
    const name = userInfo.nickname;
    const platformAccountService = new PlatformAccountService();
    platformAccountService.addAccount(platformId, platformAccountId, name, logoUrl, JSON.stringify(state))
    await waitForRandomTime(page, 2000);
    page.close();
    context.close();
    browser.close();
  }

  async function douyinPublishVideo(browser: any, payload: any, sessionId: string) {
    // 读取保存的状态
    const statePath = path.join(getPlatformAppDataPath(), 'dy_state.json');
    const context = await browser.newContext({
      storageState: statePath
    });
    const page = await context.newPage();
    await page.goto('https://creator.douyin.com/creator-micro/content/upload');
    // 检查是否仍处于登录状态
    try {
      await page.waitForSelector('#header-avatar', { timeout: 15000 });
      console.log('登录状态恢复成功');
    } catch {
      console.log('登录状态已过期，需要重新登录');
      await browser.close();
    }
    // 触发上传
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('.container-drag-icon') // 抖音的上传拖拽区域
    ]);

    // 设置视频文件
    // await fileChooser.setFiles(payload.filePath);

    const fileInputElement = await page.$('input[type="file"]');
    fileInputElement.setInputFiles(payload.filePath);
    // 验证上传完成
    await page.waitForTimeout(5000);
    // 检查是否处于描述页
    await page.waitForSelector('.editor-comp-publish', { timeout: 15000 })
    const descriptionLineElement = await page.$('.zone-container .ace-line');
    await descriptionLineElement.click();
    await page.keyboard.type(payload.description);
    await page.waitForTimeout(5000);
    const publishButtonElement = await page.locator('button:text("发布")');
    await publishButtonElement.click('text=发布');
  }
}