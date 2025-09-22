import VideoPublishTaskDao from "../daos/video-publish-task-dao";
import VideoPublishTask from "../entities/video-publish-task";
import platformAccountService from "./platform-account-service";
import platformService from './platform-service'
import dayjs from "dayjs";
import path from "path";

export class VideoPublishTaskService {
  dao: VideoPublishTaskDao;
  constructor() {
    this.dao = new VideoPublishTaskDao();
  }

  list() {
    return this.dao.list();
  }

  findById(id: string) {
    return this.dao.findById(id);
  }

  save(entity: VideoPublishTask) {
    return this.dao.save(entity);
  }

  publish(params: any) {
    // Add null/undefined checks and handle both string and array formats
    console.info("publish params: ",params)
    const videoList = Array.isArray(params.filePath) ? params.filePath : (params.filePath || '').split('_,_').filter(Boolean);
    const titleList = Array.isArray(params.title) ? params.title : (params.title || '').split('_,_').filter(Boolean);
    const descriptionList = Array.isArray(params.description) ? params.description : (params.description || '').split('_,_').filter(Boolean);
    const topicGroup1List = Array.isArray(params.topicGroup1) ? params.topicGroup1 : (params.topicGroup1 || '').split(',').filter(Boolean);
    const topicGroup2List = Array.isArray(params.topicGroup2) ? params.topicGroup2 : (params.topicGroup2 || '').split(',').filter(Boolean);
    
    // Validate required data
    if (videoList.length === 0) {
      throw new Error('没有选择视频文件');
    }
    if (titleList.length === 0) {
      throw new Error('没有设置视频标题');
    }
    if (descriptionList.length === 0) {
      throw new Error('没有设置视频描述');
    }
    console.info("platformData 1 : ",params.platformData)
    const platformData = JSON.parse(params.platformData || '{}');
    console.info("platformData 2")
    const platformAccountList = params.platformAccountList || [];
    const publishType = params.publishType || 0;
    const publishTime = params.publishTime || '';
    
    // Validate platform account list
    if (platformAccountList.length === 0) {
      throw new Error('没有选择发布账号');
    }
    videoList.forEach(filePath => {
      // Validate file path
      if (!filePath || filePath.trim() === '') {
        console.warn('跳过空文件路径');
        return;
      }
      
      const titleIndex = this._getRandomIndex(titleList.length);
      const title = titleList[titleIndex];
      const descriptionIndex = this._getRandomIndex(descriptionList.length);
      let description = descriptionList[descriptionIndex];
      const topic1List = this._getRandomTopic(topicGroup1List, 4);
      const topic2List = this._getRandomTopic(topicGroup2List, 1);
      const topicList = [...topic1List, ...topic2List]
      
      // Add hashtags to description if topics exist
      if (topicList.length > 0) {
        description += ' ' + topicList.map(v => `#${v}`).join(' ');
      }
      platformAccountList.forEach(accountId => {
        try {
          const account = platformAccountService.findById(accountId);
          if (!account) {
            console.warn(`找不到账号: ${accountId}`);
            return;
          }
          
          const platformId = account.platformId;
          const task = new VideoPublishTask();
          task.filePath = filePath;
          task.fileName = path.basename(filePath);
          task.title = title;
          task.description = description;
          task.topic = topicList.join(' ');
          task.platformData = platformData[`${platformId}`] || '';
          task.accountId = accountId;
          task.platformId = platformId;
          task.publishType = publishType;
          task.publishTime = publishTime;
          
          if (publishType === 0 || publishType === 1) {
            task.scheduledStartTime = publishTime ? publishTime : dayjs().format('YYYY-MM-DD HH:mm');
          } else {
            task.scheduledStartTime = publishTime;
          }
          
          task.startTime = '';
          task.endTime = '';
          task.status = 0;
          task.itemId = '';
          task.collectCount = 0;
          task.commentCount = 0;
          task.diggCount = 0;
          task.forwardCount = 0;
          task.liveWatchCount = 0;
          task.playCount = 0;
          task.shareCount = 0;
          
          this.save(task);
        } catch (error: any) {
          console.error(`创建发布任务失败 - 账号ID: ${accountId}, 文件: ${filePath}`);
          console.error(error.message);
          // Continue with next account instead of stopping entirely
        }
      });
      
    })
  }

  getLatestTaskToPublish() {
    return this.dao.getLatestTaskToPublish();
  }

  private _getRandomIndex(size: number) {
    return Math.floor(Math.random() * size) % size;
  }

  private _getRandomTopic(topics: string[], size: number) {
    if (topics.length <= size) {
      return topics;
    } else {
      const result: string[] = [];
      let selectData = [...topics];
      for (let i = 0; i < size; i++) {
        const selectedIndex = this._getRandomIndex(selectData.length);
        result.push(selectData[selectedIndex])
        selectData = selectData.filter((_, index) => index !== selectedIndex)
      }
      return result;
    }
  }

  statisticVideoPublishPlatform(filenameList: string[]) {
    const records = this.dao.statisticVideoPublishPlatform(filenameList);
    const platformIdList: any[] = Array.from(new Set(records.map(v => v.platformId)));
    const platformList = platformService.listByIds(platformIdList);
    const result: any = {}
    filenameList.forEach(filename => {
      const fileRecords = records.filter(v => v.fileName === filename);
      let fileStatistic = result[filename];
      if (!fileStatistic) {
        result[filename] = {}
      }
      fileRecords.forEach(record => {
        const platformId = record.platformId;
        const platform = platformList.find(v => v.id === platformId);
        const status = record.status;
        let filePlatformStatistic = result[filename][platformId];
        if (!filePlatformStatistic) {
          result[filename][platformId]  = {
            platformId: platformId,
            platformName: platform.name,
            notPublishCount: 0,
            publishingCount: 0,
            publishSuccessCount: 0,
            publishFailCount: 0
          }
        }
        if (status === 0) {
          result[filename][platformId].notPublishCount += 1;
        } else if (status === 1) {
          result[filename][platformId].publishingCount += 1;
        } else if (status === 2) {
          result[filename][platformId].publishSuccessCount += 1;
        } else if (status === 3) {
          result[filename][platformId].publishFailCount += 1;
        }
      })
    })
    return result;
  }

  public findByItemId(itemId: string) {
    return this.dao.findByItemId(itemId);
  }

}

export default new VideoPublishTaskService();