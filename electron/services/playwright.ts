const { chromium } = require('playwright');
import { ipcMain } from "electron";
import path from 'path';
import fs from 'fs';
import { getPlatformAppDataPath } from "./default-save-path";
import { decodeArg } from "../utils";
export function initPlaywright() {
  ipcMain.handle('playwright-action', async (_, paramsStr) => {
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
    if (action === 'douyin-login') {
      douyinLogin(browser)
    } else if (action === 'douyin-publish-video') {
      douyinPublishVideo(browser, payload, sessionId)
    }
  });

  async function douyinLogin(browser) {
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

    await page.goto('https://www.douyin.com');
     // 等待用户手动登录
    console.log('请在浏览器中完成抖音登录...');
    await page.waitForNavigation({ url: /douyin\.com\/.?/, timeout: 0 });
    // 保存登录状态
    const state = await context.storageState();
    const statePath = path.join(getPlatformAppDataPath(), 'dy_state.json');
    fs.writeFileSync(statePath, JSON.stringify(state));
  }

  async function douyinPublishVideo(browser: any, payload: string, sessionId: string) {
    const context = await browser.newContext();
     // 读取保存的状态
     const statePath = path.join(getPlatformAppDataPath(), 'dy_state.json');
    const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    const page = await context.newPage();
    await page.goto('https://creator.douyin.com');
    // 检查是否仍处于登录状态
    try {
      await page.waitForSelector('.user-info', { timeout: 5000 });
      console.log('登录状态恢复成功');
    } catch {
      console.log('登录状态已过期，需要重新登录');
      await browser.close();
    }
  }
}