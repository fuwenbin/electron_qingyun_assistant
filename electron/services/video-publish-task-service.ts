import VideoPublishTaskDao from "../daos/video-publish-task-dao";
import VideoPublishTask from "../entities/video-publish-task";
import VideoPublishSettingService from "./video-publish-setting-service";
import PlatformAccountService from "./platform-account-service";
import PlatformService from './platform-service'
import dayjs from "dayjs";
import path from "path";

export default class VideoPublishTaskService {
  dao: VideoPublishTaskDao;
  videoPublishSettingService: VideoPublishSettingService;
  platformAccountService: PlatformAccountService;
  platformService: PlatformService;

  constructor() {
    this.dao = new VideoPublishTaskDao();
    this.videoPublishSettingService = new VideoPublishSettingService();
    this.platformAccountService = new PlatformAccountService();
    this.platformService = new PlatformService();
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
    const videoList = params.filePath.split('_,_');
    const titleList = params.title.split('_,_');
    const descriptionList = params.description.split('_,_');
    const topicGroup1List = params.topicGroup1.split(',');
    const topicGroup2List = params.topicGroup2.split(',');
    const platformData = JSON.parse(params.platformData);
    const platformAccountList = params.platformAccountList;
    const publishType = params.publishType;
    const publishTime = params.publishTime;
    videoList.forEach(filePath => {
      const titleIndex = this._getRandomIndex(titleList.length);
      const title = titleList[titleIndex];
      const descriptionIndex = this._getRandomIndex(descriptionList.length);
      let description = descriptionList[descriptionIndex];
      const topic1List = this._getRandomTopic(topicGroup1List, 4);
      const topic2List = this._getRandomTopic(topicGroup2List, 1);
      const topicList = [...topic1List, ...topic2List]
      description += topicList.map(v => `#${v}`).join(' ');
      platformAccountList.forEach(accountId => {
        const account = this.platformAccountService.findById(accountId);
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
        if (publishTime === 0 || publishTime === 1) {
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
        try {
          this.save(task);
        } catch (error) {
          console.error('创建发布任务失败：' + JSON.stringify(task));
          console.error(error.message);
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
    const platformList = this.platformService.listByIds(platformIdList);
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
    console.log(JSON.stringify(result))
    console.log('33333333333333333333333333333333')
    return result;
  }

  public findByItemId(itemId: string) {
    return this.dao.findByItemId(itemId);
  }

}