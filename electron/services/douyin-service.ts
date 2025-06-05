import { waitForRandomTimeout } from "../utils/playwright-utils";
import PlatformAccountService from "./platform-account-service";
import PlatformService from "./platform-service";
import { getBrowser } from "./playwright";
import VideoPublishTaskService from "./video-publish-task-service";
import dayjs from "dayjs";

export default class DouyinService {

  platformService: PlatformService;
  platformAccountService: PlatformAccountService;
  videoPublishTaskService: VideoPublishTaskService;
  constructor() {
    this.platformService = new PlatformService();
    this.platformAccountService = new PlatformAccountService();
    this.videoPublishTaskService = new VideoPublishTaskService();
  }
  async publishVideo(payload: any) {
    const taskId = payload.id;
    const task = this.videoPublishTaskService.findById(taskId);
    task.status = 1;
    task.startTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    this.videoPublishTaskService.save(task);
    const browser = await getBrowser();
    const platformId = payload.platformId;
    const platform = this.platformService.findById(platformId);
    // 读取保存的状态
    const stateStr = this.platformAccountService.getStateData(payload.accountId)
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
      // 填写作品标题
      const titleInputElement = await page.waitForSelector('input[placeholder="填写作品标题，为作品获得更多流量"]')
      await titleInputElement.fill(payload.title);
      await waitForRandomTimeout(page, 1000);
      // 填写作品描述
      const descriptionLineElement = await page.locator('.zone-container .ace-line');
      await descriptionLineElement.click();
      await page.keyboard.type(payload.description);
      await waitForRandomTimeout(page, 1000);
      await page.mouse.wheel(0, 600);
      if (payload.publishType === 1) {
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
      task.status = 2;
      task.endTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
      this.videoPublishTaskService.save(task);
    } catch (error) {
      console.log(error);
      task.status = 3;
      task.endTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
      this.videoPublishTaskService.save(task);
      throw error;
    } finally {
      await page?.close().catch(() => {});
      await context?.close().catch(() => {});
      await browser?.close().catch(() => {});
    }
  }
}
