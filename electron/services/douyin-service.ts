import { waitForRandomTimeout } from "../utils/playwright-utils";
import platformAccountService from "./platform-account-service";
import platformService from "./platform-service";
import { getBrowser } from "./playwright";
import videoPublishTaskService from "./video-publish-task-service";
import dayjs from "dayjs";
import log from "electron-log";

export class DouyinService {

  async login(payload: any) {
    const browser = await getBrowser(false);
    const platformId = payload.platformId;
    const loginUrl = "https://creator.douyin.com";
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
      const infoResponsePromise = page.waitForResponse(
        (response: any) => response.url().includes('/aweme/v1/creator/user/info/')
      )
      await page.waitForURL("**/creator-micro/home", {timeout: 120000 });
      const state = await context.storageState();
      const infoRes = await infoResponsePromise;
      const infoResData = await infoRes.json();
      const userInfo = infoResData.user_profile;
      const platformAccountId = userInfo.unique_id;
      const logoUrl = userInfo.avatar_url;
      const name = userInfo.nick_name;
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
  async publishVideo(payload: any) {
    const taskId = payload.id;
    const task = videoPublishTaskService.findById(taskId);
    task.status = 1;
    task.startTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    videoPublishTaskService.save(task);
    const browser = await getBrowser();
    const platformId = payload.platformId;
    const platform = platformService.findById(platformId);
    // 读取保存的状态
    const stateStr = platformAccountService.getStateData(payload.accountId)
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
      const publishResponse = await page.waitForResponse((response) => response.url().includes('/api/media/aweme/create_v2') && response.status() === 200);
      const publishResponseJson = await publishResponse.json();

      if (publishResponseJson?.status_code === 0) {
        const item_id  = publishResponseJson?.item_id;
        console.log('发布成功，平台id：' + item_id)
        task.itemId = item_id;
      }
      await page.waitForURL('https://creator.douyin.com/creator-micro/content/manage**', {
        timeout: 30000
      })
      task.status = 2;
      task.endTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
      videoPublishTaskService.save(task);
    } catch (error) {
      console.log(error);
      task.status = 3;
      task.endTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
      videoPublishTaskService.save(task);
      throw error;
    } finally {
      await page?.close().catch(() => {});
      await context?.close().catch(() => {});
      await browser?.close().catch(() => {});
    }
  }

  async syncAccount(accountId: string) {
    console.log('开始同步账号信息：' + accountId)
    const browser = await getBrowser(true);
    // 读取保存的状态
    const stateStr = platformAccountService.getStateData(accountId)
    const context = await browser.newContext({
      storageState: JSON.parse(stateStr)
    });
    const page = await context.newPage();
    const statisticUrl = 'https://creator.douyin.com/creator-micro/content/manage'
    try {
      await page.goto(statisticUrl);
      const statisticResponse = await page.waitForResponse(
        (response) => response.url().includes('/douyin/creator/pc/work_list')
      )
      const statisticData = await statisticResponse.json()
      const workList = statisticData?.aweme_list || [];
      for  (const work of workList) {
        const itemId = work.statistics.aweme_id;
        const task = videoPublishTaskService.findByItemId(itemId);
        if (task) {
          task.collectCount = work.statistics.collect_count;
          task.commentCount = work.statistics.comment_count;
          task.diggCount  = work.statistics.digg_count;
          task.forwardCount = work.statistics.forward_count;
          task.liveWatchCount = work.statistics.live_watch_count;
          task.playCount = work.statistics.play_count;
          task.shareCount = work.statistics.share_count;
          videoPublishTaskService.save(task);
        }
      }
    } catch (error: any) {
      throw error;
    } finally {
      await page?.close().catch(() => {});
      await context?.close().catch(() => {});
      await browser?.close().catch(() => {});
    }
  }

  async syncAccountComment(data: any) {
    const {accountId, itemId } = data;
    console.log('开始同步账号评论信息：' + accountId)
    const browser = await getBrowser();
    // 读取保存的状态
    const stateStr = platformAccountService.getStateData(accountId)
    const context = await browser.newContext({
      storageState: JSON.parse(stateStr)
    });
    const page = await context.newPage();
    const commentUrl = 'https://creator.douyin.com/creator-micro/interactive/comment'
    try {
      const itemListResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/aweme/v1/creator/item/list') && response.status() === 200
      )
      await page.goto(commentUrl, {
        waitUtil: 'domcontentloaded',
        timeout: 30000
      });
      const itemListResponse = await itemListResponsePromise;
      const itemListResData = await itemListResponse.json()
      const itemListData = itemListResData.item_info_list
      const selectIndex = itemListData.findIndex(item => item.item_id_plain === itemId)
      const selectWorkButton = await page.waitForSelector('button span.douyin-creator-interactive-button-content:has-text("选择作品")');
      await selectWorkButton.click();
      const selectWorkItem = await page.waitForSelector(`.douyin-creator-interactive-list-items > div:nth-child(${selectIndex + 1}) > img`)
      await selectWorkItem.click();
      const commentTypeSelectElement = await page.waitForSelector('div.douyin-creator-interactive-select[role=combobox]:nth-child(1)');
      await commentTypeSelectElement.click();
      const commentTypeSelectedItemElement = await page.waitForSelector(`div.douyin-creator-interactive-select-option-list-chosen[role=listbox] .douyin-creator-interactive-select-option:has-text("未回复")`);
      const commentListResponsePromise = page.waitForResponse(
        response => response.url().includes('/api/comment/read/aweme/v1/web/comment/list/select/') 
          && response.status() === 200 
          && response.url().includes('comment_select_options=0%2Cnot_replied')
      );
      await commentTypeSelectedItemElement.click();
      const commentListResponse = await commentListResponsePromise;
      const commentListResponseData = await commentListResponse.json();
      return commentListResponseData.comments || [];
    } catch (error: any) {
      throw error;
    } finally {
      await page?.close().catch(() => {});
      await context?.close().catch(() => {});
      await browser?.close().catch(() => {});
    }
  }

  async publishCommentReply(data: any) {
    const {accountId, itemId, replyList } = data;
    console.log('开始发布账号评论回复：' + accountId)
    const browser = await getBrowser();
    // 读取保存的状态
    const stateStr = platformAccountService.getStateData(accountId)
    const context = await browser.newContext({
      storageState: JSON.parse(stateStr)
    });
    const page = await context.newPage();
    const commentUrl = 'https://creator.douyin.com/creator-micro/interactive/comment'
    try {
      const itemListResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/aweme/v1/creator/item/list') && response.status() === 200
      )
      await page.goto(commentUrl, {
        waitUtil: 'domcontentloaded',
        timeout: 30000
      });
      const itemListResponse = await itemListResponsePromise;
      const itemListResData = await itemListResponse.json()
      const itemListData = itemListResData.item_info_list
      const selectIndex = itemListData.findIndex(item => item.item_id_plain === itemId)
      const selectWorkButton = await page.waitForSelector('button span.douyin-creator-interactive-button-content:has-text("选择作品")');
      await selectWorkButton.click();
      const selectWorkItem = await page.waitForSelector(`.douyin-creator-interactive-list-items > div:nth-child(${selectIndex + 1}) > img`)
      await selectWorkItem.click();
      const commentTypeSelectElement = await page.waitForSelector('div.douyin-creator-interactive-select[role=combobox]:nth-child(1)');
      await commentTypeSelectElement.click();
      const commentTypeSelectedItemElement = await page.waitForSelector(`div.douyin-creator-interactive-select-option-list-chosen[role=listbox] .douyin-creator-interactive-select-option:has-text("未回复")`);
      const commentListResponsePromise = page.waitForResponse(
        response => response.url().includes('/api/comment/read/aweme/v1/web/comment/list/select/') 
          && response.status() === 200 
          && response.url().includes('comment_select_options=0%2Cnot_replied')
      );
      await commentTypeSelectedItemElement.click();
      const commentListResponse = await commentListResponsePromise;
      const commentListResponseData = await commentListResponse.json();
      const commentList = commentListResponseData.comments;
      for (const reply of replyList) {
        if (!reply.replyText) {
          continue;
        }
        const commentId = reply.commentId;
        const commendIndex = commentList.findIndex(v => v.cid === commentId);
        const replyButtonElement = await page.waitForSelector(
          `div.douyin-creator-interactive-tabs-pane-motion-overlay 
          div[class^="container-"]:nth-child(${commendIndex + 1})
          div[class^="content-"] 
          div[class^="operations-"] 
          div[class^="item-"]:nth-child(3)`, { timeout: 5000 });
        replyButtonElement.click();
        const replyInputElement = await page.waitForSelector(
          `div.douyin-creator-interactive-tabs-pane-motion-overlay 
          div[class^="container-"]:nth-child(${commendIndex + 1})
          div[class^="content-"] 
          div[class^="reply-content-"] 
          div[class^="input-"]`
        );
        await replyInputElement.fill(reply.replyText);
        const replySendButtonElement = await page.waitForSelector(
          `div.douyin-creator-interactive-tabs-pane-motion-overlay 
          div[class^="container-"]:nth-child(${commendIndex + 1})
          div[class^="content-"] 
          div[class^="reply-content-"] 
          button:has-text("发送")`
        );
        await replySendButtonElement.click();
      }
    } catch (error: any) {
      throw error;
    } finally {
      await page?.close().catch(() => {});
      await context?.close().catch(() => {});
      await browser?.close().catch(() => {});
    }
  }
}

export default new DouyinService();
