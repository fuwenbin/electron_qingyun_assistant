import VideoPublishTask from "../entities/video-publish-task";
import videoPublishTaskService from "../services/video-publish-task-service";
import videoPublishSettingService from "../services/video-publish-setting-service";
import douyinService from "../services/douyin-service";

export class VideoPublishTaskManger {
  static instance: VideoPublishTaskManger;
  tasks : VideoPublishTask[] = [];
  timeoutInMilliseconds: number = 1000;
  interval: any;
  isRunning: boolean = false;
  isStarted: boolean = false;

  public static getInstance() {
    if (!VideoPublishTaskManger.instance) {
      VideoPublishTaskManger.instance = new VideoPublishTaskManger();
    }
    return VideoPublishTaskManger.instance;
  }

  async start() {
    if (this.isStarted) {
      return;
    }
    this.isRunning = true;
    while (this.isRunning) {
      await this.publish();
    }
  }

  stop() {
    this.isRunning = false;
    this.isStarted = false;
  }
  // 从配置列表获取一个定时任务来生成发布任务
  async toGenPublishTask() {
    try {
      // 1. 从 video_publish_settings 查询 status 为 0 的一条计划任务
      const pendingSetting = videoPublishSettingService.findOneByStatus(0);
      
      if (!pendingSetting) {
        console.log('没有找到待执行的计划任务');
        return null;
      }
      
      console.log('找到待执行的计划任务:', pendingSetting.id);
      
      // 更新状态为执行中（1）
      pendingSetting.status = 1;
      videoPublishSettingService.update(pendingSetting);
      
      // 2. 使用查询到的数据通过 VideoPublishTaskService 的 publish 方法生成 task
      const publishParams = {
        filePath: pendingSetting.filePath,
        title: pendingSetting.title,
        description: pendingSetting.description,
        topicGroup1: pendingSetting.topicGroup1,
        topicGroup2: pendingSetting.topicGroup2,
        platformData: pendingSetting.platformData,
        frequency: pendingSetting.frequency,
        frequencyValue: pendingSetting.frequencyValue,
        dailyTime: pendingSetting.dailyTime,
        publishType: 1, // 定时发布
        platformAccountList: pendingSetting.accountIds ? pendingSetting.accountIds.split(',').filter(id => id.trim()) : []
      };
      
      const generatedTaskIds = videoPublishTaskService.publish(publishParams);
      
      // 3. 生成完任务后，更新 video_publish_settings 中这条数据的状态和 task_ids
      pendingSetting.status = 2; // 完成
      pendingSetting.taskIds = generatedTaskIds.join(',');
      videoPublishSettingService.update(pendingSetting);
      
      console.log(`成功生成 ${generatedTaskIds.length} 个发布任务，任务IDs: ${generatedTaskIds.join(', ')}`);
      
      return {
        settingId: pendingSetting.id,
        taskIds: generatedTaskIds,
        taskCount: generatedTaskIds.length
      };
      
    } catch (error: any) {
      console.error('生成发布任务失败:', error.message);
      throw error;
    }
  }

  // 执行视频发布的任务
  async publish() {
    const latestTask = videoPublishTaskService.getLatestTaskToPublish();
    if (!latestTask) {
      // console.log("开始执行视频发布任务：没有需要执行的任务");
      return await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      console.log("开始执行视频发布任务：" + JSON.stringify(latestTask));
      if(latestTask.platformId == 1){
        //  抖音平台发布
        return await douyinService.publishVideo(latestTask);
      }
     
    }
  }
}

export const videoPublishTaskManager = VideoPublishTaskManger.getInstance();