import VideoPublishTaskDao from "../daos/video-publish-task-dao";
import VideoPublishTask from "../entities/video-publish-task";
import platformAccountService from "./platform-account-service";
import platformService from './platform-service'
import dayjs from "dayjs";
import { getVideoFilesInDirectory } from '../utils/fs-utils';

export class VideoPublishTaskService {
  dao: VideoPublishTaskDao;
  constructor() {
    this.dao = new VideoPublishTaskDao();
  }

  // Helper function to get filename from full path
  private getFileName(filePath: string): string {
    const parts = filePath.replace(/\\/g, '/').split('/')
    return parts[parts.length - 1]
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

  async generatePublishTasks(params: any) {
    // Add null/undefined checks and handle both string and array formats
    console.info("publish params: ",params)
    
    const generatedTaskIds: number[] = []; // Track generated task IDs
    
    // Get video files using the utility method
    let videoList: string[] = []
    if (params.filePath) {
      try {
        // Use getVideoFilesInDirectory to get video files from the directory
        videoList = await getVideoFilesInDirectory(params.filePath, false);
        console.info("Found video files:", videoList.length);
      } catch (error) {
        console.error("Error getting video files:", error);
        throw new Error('目录:'+ params.filePath + '，没有找到视频文件');
      }
    }
    
    const titleList = Array.isArray(params.title) ? params.title : (params.title || '').split('_,_').filter(Boolean);
    const descriptionList = Array.isArray(params.description) ? params.description : (params.description || '').split('_,_').filter(Boolean);
    const topicGroup1List = Array.isArray(params.topicGroup1) ? params.topicGroup1 : (params.topicGroup1 || '').split(',').filter(Boolean);
    const topicGroup2List = Array.isArray(params.topicGroup2) ? params.topicGroup2 : (params.topicGroup2 || '').split(',').filter(Boolean);
    
    // Validate required data
    if (videoList.length === 0) {
      throw new Error('目录:'+ params.filePath + '下没有视频文件');
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
    const publishType = params.publishType || 1; // Fixed to 1 for scheduled publishing  1代表定时发布任务 
    
    // New scheduling parameters
    const frequency = params.frequency || 'minutes'; // 'minutes' | 'hours' | 'time'
    const frequencyValue = params.frequencyValue || 5;
    const dailyTime = params.dailyTime; // For 'time' frequency (HH:mm format)
    
    // Validate platform account list
    if (platformAccountList.length === 0) {
      throw new Error('没有选择发布账号');
    }
    
    // Generate publish times based on frequency and video count
    const publishTimes = this._generatePublishTimes(frequency, frequencyValue, dailyTime, videoList.length);
    
    let taskIndex = 0;
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
          task.fileName = this.getFileName(filePath);
          task.title = title;
          task.description = description;
          task.topic = topicList.join(' ');
          task.platformData = platformData[`${platformId}`] || '';
          task.accountId = accountId;
          task.platformId = platformId;
          task.publishType = publishType;
          
          // Assign publish time based on frequency
          const publishTime = publishTimes[taskIndex % publishTimes.length];
          task.publishTime = publishTime;
          task.scheduledStartTime = publishTime;
          
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
          
          const savedTask = this.save(task);
          generatedTaskIds.push(savedTask.id); // Collect generated task ID
          taskIndex++;
        } catch (error: any) {
          console.error(`创建发布任务失败 - 账号ID: ${accountId}, 文件: ${filePath}`);
          console.error(error.message);
          // Continue with next account instead of stopping entirely
        }
      });
    })
    
    return generatedTaskIds; // Return array of generated task IDs
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

  private _generatePublishTimes(frequency: string, frequencyValue: number, dailyTime: string | undefined, videoCount: number): string[] {
    const publishTimes: string[] = [];
    const now = dayjs();
    const minPublishTime = now.add(3, 'hours'); // Minimum: 3 hours from now 抖音实际支持2小时后发布，我这里设置大点保证后面不会触发
    const maxPublishTime = now.add(14, 'days'); // Maximum: 14 days from now
    
    let currentTime = minPublishTime;
    
    for (let i = 0; i < videoCount; i++) {
      if (frequency === 'minutes') {
        // Every X minutes
        if (i > 0) {
          currentTime = currentTime.add(frequencyValue, 'minutes');
        }
      } else if (frequency === 'hours') {
        // Every X hours
        if (i > 0) {
          currentTime = currentTime.add(frequencyValue, 'hours');
        }
      } else if (frequency === 'time' && dailyTime) {
        // Daily at specific time
        const [hours, minutes] = dailyTime.split(':').map(Number);
        let nextPublishDate = currentTime.hour(hours).minute(minutes).second(0);
        
        // If the time has passed today, schedule for tomorrow
        if (nextPublishDate.isBefore(currentTime)) {
          nextPublishDate = nextPublishDate.add(1, 'day');
        }
        
        currentTime = nextPublishDate.add(i, 'days');
      }
      
      // Ensure we don't exceed the maximum publish time
      if (currentTime.isAfter(maxPublishTime)) {
        console.warn(`发布时间超过了最大限制，停止生成更多任务`);
        break;
      }
      
      publishTimes.push(currentTime.format('YYYY-MM-DD HH:mm'));
    }
    
    return publishTimes;
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