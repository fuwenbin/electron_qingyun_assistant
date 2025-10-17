import { waitForRandomTimeout } from "../utils/playwright-utils";
import platformAccountService from "./platform-account-service";
import platformService from "./platform-service";
import { getBrowser } from "./playwright";
import videoPublishTaskService from "./video-publish-task-service";
import dayjs from "dayjs";
import log from "electron-log";
import appSettingsService from './app-settings-service';

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
      await page.waitForURL("**/creator-micro/home", {timeout: 120000 });
      const state = await context.storageState();
      const avatarElement = await page.waitForSelector('div[class^="avatar-"] img');
      const logoUrl = await avatarElement.evaluate((img) => img.src);
      console.log('账号logo：' + logoUrl);
      const nameElement = await page.waitForSelector('div[class^="name-"]');
      const name = await nameElement.textContent();
      log.log('账号昵称：' + name);
      const idElement = await page.waitForSelector('div[class^="unique_id-"]');
      const platformAccountIdContent = await idElement.textContent();
      const platformAccountId = platformAccountIdContent.replace("抖音号：", "").trim();
      log.log('账号id:' + platformAccountId);
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
  // 自动获取账号信息
  async getAccountInfo(page: any, platformId: number) { 
    // 打开首页：https://creator.douyin.com/creator-micro/home
    const platformAccountId = "抖音号"
    try {
      console.log('Opening Douyin creator home page...');
      await page.goto('https://creator.douyin.com/creator-micro/home', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      
      // 等待页面加载完成
      await page.waitForLoadState('networkidle');
      
      // 搜索抖音号关键字，将包裹抖音号的元素获取并打印
      console.log('Searching for account ID:', platformAccountId);
      
      // 查找包含抖音号的元素
      const accountElements = await page.locator(`text=${platformAccountId}`).all();
      
      if (accountElements.length > 0) {
        console.log(`Found ${accountElements.length} elements containing account ID`);
        
        for (let i = 0; i < accountElements.length; i++) {
          const element = accountElements[i];
          const elementText = await element.textContent();
          const elementHTML = await element.innerHTML();
          
          console.log(`Element ${i + 1}:`);
          console.log('Text content:', elementText);
          console.log('HTML content:', elementHTML);
          
          // 获取父元素信息
          const parentElement = element.locator('..');
          const parentText = await parentElement.textContent();
          const parentHTML = await parentElement.innerHTML();
          
          console.log('Parent text:', parentText);
          console.log('Parent HTML:', parentHTML);
          console.log('---');
        }
      } else {
        console.log('No elements found containing the account ID');
        
        // 尝试查找可能包含账号信息的常见选择器
        const commonSelectors = [
          'div[class*="unique_id"]',
          'div[class*="account"]',
          'span[class*="id"]',
          '.user-info',
          '.account-info'
        ];
        
        for (const selector of commonSelectors) {
          const elements = await page.locator(selector).all();
          if (elements.length > 0) {
            console.log(`Found ${elements.length} elements with selector: ${selector}`);
            for (let i = 0; i < elements.length; i++) {
              const text = await elements[i].textContent();
              console.log(`${selector}[${i}]:`, text);
            }
          }
        }
      }
      
      return {
        success: accountElements.length > 0,
        elementsFound: accountElements.length,
        platformId,
        platformAccountId
      };
      
    } catch (error) {
      console.error('Error in getAccountInfo:', error);
      throw error;
    } 
  }
  async publishVideo(payload: any) {
    const taskId = payload.id;
    const task = videoPublishTaskService.findById(taskId);
    task.status = 1;
    task.startTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    videoPublishTaskService.updateTask(task);
    
    // 从设置中获取是否显示浏览器的配置
    const settings = appSettingsService.getSettings();
    const shouldShowBrowser = settings.showBrowser;
    
    // 发布视频时根据设置决定是否显示浏览器
    const browser = await getBrowser(!shouldShowBrowser);
    
    const platformId = payload.platformId;
    const platform = platformService.findById(platformId);
    // 读取保存的账号状态
    const stateStr = platformAccountService.getStateData(payload.accountId)
    const context = await browser.newContext({
      storageState: JSON.parse(stateStr)
    });
    const page = await context.newPage();
    // 打印下账号信息
    // await this.getAccountInfo(page,platformId)

    const publishVideoUrl = platform.publishVideoUrl;

    try {
      await page.goto(publishVideoUrl);
      // 检查是否仍处于登录状态
      try {
        await page.waitForSelector('#header-avatar', { timeout: 15000 });
        log.info('登录状态恢复成功');
      } catch {
        throw new Error('登录状态已过期，需要重新登录');
      }
      
      // 开始操作
      // 等待上传区域加载完成
      log.info('等待上传按钮图标加载完成')
      await page.waitForSelector('.container-drag-icon', {
        state: 'visible',
        timeout: 30000 
      });
      await waitForRandomTimeout(page, 2000);
      // 触发上传
      log.info('等待上传文件：' + payload.filePath)
      log.info('等待触发文件上传事件')
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.click('.container-drag-icon', { force: true, delay: 300 }) // 抖音的上传拖拽区域
      ]);
      log.info('触发文件上传事件')

      // 设置视频文件
      log.info('Setting video file:', payload.filePath);
      await fileChooser.setFiles(payload.filePath);
      
      // 验证文件是否成功设置
      if (fileChooser.files && fileChooser.files.length > 0) {
        log.info('File successfully set via fileChooser:', fileChooser.files[0].name);
      } else {
        log.info('Fallback: Setting file via input element');
        const fileInputElement = await page.locator('input[type="file"]').first();
        await fileInputElement.setInputFiles(payload.filePath);
        log.info('File set via input element');
      }
      
      // 检查是否处于描述页 
      log.info('上传文件后，等待页面跳转到视频发布页面')
      await page.waitForURL('https://creator.douyin.com/creator-micro/content/post/video**', {
        timeout: 5000
      })
      // 稍微等待3秒钟，等待文件上传完成
      log.info('Waiting for 3 seconds for file upload to complete...');
      await waitForRandomTimeout(page, 3000);
     
      await page.waitForSelector('.editor-comp-publish', { timeout: 15000 })
      
      // 填写作品标题
      log.info('Filling title:', payload.title);
      const titleInputElement = await page.waitForSelector('input[placeholder="填写作品标题，为作品获得更多流量"]')
      // Clear existing content and fill new title
      await titleInputElement.click({ clickCount: 3 }); // Select all text
      await titleInputElement.fill(payload.title);
      await waitForRandomTimeout(page, 1000);
      
      // 填写作品描述
      log.info('Filling description:', payload.description, payload.cityName, payload.tagName);
      const descriptionLineElement = await page.locator('.zone-container .ace-line');
      await descriptionLineElement.click();
      await page.keyboard.type(payload.description);
      await waitForRandomTimeout(page, 1000);
      await page.mouse.wheel(0, 600);
      // 添加地址标签，如果有
      if(payload.tagName){
        log.info('Adding location tag:', payload.cityName, payload.tagName);
         // 点击douyin_creator_pc_anchor_jump 下的 input 元素
        const douyinCreatorPcAnchorJumpElement = await page.waitForSelector('#douyin_creator_pc_anchor_jump')
        log.info("douyinCreatorPcAnchorJumpElement:",);
        await douyinCreatorPcAnchorJumpElement.click();
        await waitForRandomTimeout(page, 1000);
        // 选择城市 点击 #scrollContainer 下包含text=payload.cityName的元素
        const locationItemElement = await page.waitForSelector(`#\\00003${payload.cityName}00`)
        log.info("locationItemElement:",);
        await locationItemElement.click();
        // 输入标签值
        const locationInputElement = await page.waitForSelector('#douyin_creator_pc_anchor_jump input')
        log.info("locationInputElement:", );
        await locationInputElement.fill(payload.tagName);
        await waitForRandomTimeout(page, 5000);

        // 选择下拉列表的第一项
        const semiPortalInnerElement = page.locator('#douyin_creator_pc_anchor_jump .semi-select-option-list .semi-select-option')
        const count = await semiPortalInnerElement.count()
        log.info("semiPortalInnerElement count:", count);
        if (count > 0) {
          await semiPortalInnerElement.nth(0).click();
        }
        await waitForRandomTimeout(page, 1000);

       
      }

      // 1. 先检查进度条，如果有进度条，则打印进度条值的文本，2.如果没有进度条就检查是否上传失败文本，如果有上传失败则重新上传，3.如果上传成功则继续下一步
      // https://creator.douyin.com/web/api/media/upload/auth/v5
      const processSelector = '[class^="upload-progress-inner-"] [class^="text-"]'
      let resetCount = 0
      while (true) {
        const processElement =  page.locator(processSelector)
        const failElement =  page.locator('text="上传失败，重新上传"')
        const preViewElement =  page.locator('div[class^="preview-like-"]')
        const viewCount = await preViewElement.count()
        const processCount = await processElement.count()
        const failCount = await failElement.count()
        if(viewCount){
          log.info('File upload success：',processCount);
          const text = await preViewElement.textContent()
          log.info('File upload success text：', text)
          break;
        }else if(failCount){
          log.warn('File upload failed, reset file input');
          const uploadInput = '[class^="phone-launch-"] input[type="file"]'
          const fileInputElement = await page.locator(uploadInput).first();
          await fileInputElement.setInputFiles(payload.filePath);
          await waitForRandomTimeout(page, 1000);
          resetCount++
          if(resetCount > 3){
            log.error('File upload failed, reset file input count > 3, abort');
            return 
          }
        } else if(processCount){
          const text = await processElement.textContent()
          log.info('File upload progress:', text)
          await waitForRandomTimeout(page, 500);
        }  else{
          await waitForRandomTimeout(page, 3000);
          log.warn('出现非预期的情况，可能要退出检查情况！！！！');
        }
      }

      // 是否定时发布的任务
      if (payload.publishType === 1) {
        log.info('Setting up timing publish for:', payload.scheduledStartTime);
        try {
          const timingPublishCheckboxTextElement = await page.waitForSelector('label:has-text("定时发布") input[type="checkbox"]', {
            timeout: 10000
          });
          log.info('Found timing publish checkbox');
          await timingPublishCheckboxTextElement.click();
          await waitForRandomTimeout(page, 1000);
          
          const timingPublishTimeInputElement = await page.waitForSelector('input[placeholder="日期和时间"]', {
            timeout: 10000
          });
          log.info('Setting timing publish time:', payload.scheduledStartTime);
          await timingPublishTimeInputElement.fill(payload.scheduledStartTime);
          await waitForRandomTimeout(page, 1000);
        } catch (timingError) {
          log.error('Failed to set timing publish:', timingError);
          log.info('Continuing with immediate publish instead...');
        }
      }
      // 点击发布按钮，并获取返回的item_id
      // const item_id = await this._clickPublishButton(page);
      // if (item_id) {
      //   task.itemId = item_id;
      // }
      // 等待发布后的页面跳转检查
      log.info('Waiting for navigation to management page...');
      try {
        await page.waitForURL('https://creator.douyin.com/creator-micro/content/manage**', {
          timeout: 60000
        });
        log.info('Successfully navigated to management page');
      } catch (navigationError) {
        log.warn('Navigation timeout, but checking if we\'re already on a success page');
        const currentUrl = page.url();
        log.info('Current URL:', currentUrl);    
      }
      task.status = 2;
      task.endTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
      videoPublishTaskService.updateTask(task);
    } catch (error) {
      log.error('Error during video publishing:', error);
      task.status = 3;
      task.endTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
      videoPublishTaskService.updateTask(task);
      // throw error;
    } finally {
      await page?.close().catch(() => {});
      await context?.close().catch(() => {});
      await browser?.close().catch(() => {});
    }
  }
  async _clickPublishButton(page: any) {
    const publishButtonElement = await page.waitForSelector('button:text("发布")');
    log.info('Clicking publish button...');
    await publishButtonElement.click();
    
    // Wait for publish response with more flexible conditions
    log.info('Waiting for publish API response...');
    const publishResponse = await page.waitForResponse((response) => {
      const url = response.url();
      const status = response.status();
      log.debug(`Response received: ${url} - Status: ${status}`);
      return url.includes('/api/media/aweme/create_v2') && (status === 200 || status === 201);
    }, { timeout: 60000 });
    
    let publishResponseJson;
    try {
      const responseText = await publishResponse.text();
      log.info('Publish response text:', responseText);
      
      if (!responseText || responseText.trim() === '') {
        log.warn('Empty response received from publish API');
        publishResponseJson = null;
      } else {
        publishResponseJson = JSON.parse(responseText);
      }
    } catch (jsonError) {
      log.error('Failed to parse JSON response:', jsonError);
      log.info('Raw response status:', publishResponse.status());
      log.info('Raw response headers:', await publishResponse.allHeaders());
      publishResponseJson = null;
    }

    if (publishResponseJson?.status_code === 0) {
      const item_id = publishResponseJson?.item_id;
      log.info('发布成功，平台id：' + item_id)
      return item_id;
    } else {
      log.warn('Publish response did not indicate success:', publishResponseJson);
      return null;
    }
    
  }
  async syncAccount(accountId: string) {
    log.info('开始同步账号信息：' + accountId)
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
      
      let statisticData;
      try {
        const responseText = await statisticResponse.text();
        log.info('Statistic response text:', responseText);
        
        if (!responseText || responseText.trim() === '') {
          log.warn('Empty response received from statistic API');
          statisticData = {};
        } else {
          statisticData = JSON.parse(responseText);
        }
      } catch (jsonError) {
        log.error('Failed to parse statistic JSON response:', jsonError);
        statisticData = {};
      }
      
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
          videoPublishTaskService.updateTask(task);
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
      
      let itemListResData;
      try {
        const responseText = await itemListResponse.text();
        console.log('Item list response text (syncAccountComment):', responseText);
        
        if (!responseText || responseText.trim() === '') {
          console.warn('Empty response received from item list API (syncAccountComment)');
          itemListResData = { item_info_list: [] };
        } else {
          itemListResData = JSON.parse(responseText);
        }
      } catch (jsonError) {
        console.error('Failed to parse item list JSON response (syncAccountComment):', jsonError);
        itemListResData = { item_info_list: [] };
      }
      
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
      
      let commentListResponseData;
      try {
        const responseText = await commentListResponse.text();
        console.log('Comment list response text:', responseText);
        
        if (!responseText || responseText.trim() === '') {
          console.warn('Empty response received from comment list API');
          commentListResponseData = { comments: [] };
        } else {
          commentListResponseData = JSON.parse(responseText);
        }
      } catch (jsonError) {
        console.error('Failed to parse comment list JSON response:', jsonError);
        commentListResponseData = { comments: [] };
      }
      
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
      
      let itemListResData;
      try {
        const responseText = await itemListResponse.text();
        console.log('Item list response text (publishCommentReply):', responseText);
        
        if (!responseText || responseText.trim() === '') {
          console.warn('Empty response received from item list API (publishCommentReply)');
          itemListResData = { item_info_list: [] };
        } else {
          itemListResData = JSON.parse(responseText);
        }
      } catch (jsonError) {
        console.error('Failed to parse item list JSON response (publishCommentReply):', jsonError);
        itemListResData = { item_info_list: [] };
      }
      
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
      
      let commentListResponseData;
      try {
        const responseText = await commentListResponse.text();
        console.log('Comment list response text (publishCommentReply):', responseText);
        
        if (!responseText || responseText.trim() === '') {
          console.warn('Empty response received from comment list API (publishCommentReply)');
          commentListResponseData = { comments: [] };
        } else {
          commentListResponseData = JSON.parse(responseText);
        }
      } catch (jsonError) {
        console.error('Failed to parse comment list JSON response (publishCommentReply):', jsonError);
        commentListResponseData = { comments: [] };
      }
      
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
