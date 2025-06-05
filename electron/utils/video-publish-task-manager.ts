import VideoPublishTask from "../entities/video-publish-task";
import VideoPublishTaskService from "../services/video-publish-task-service";
import DouyinService from "../services/douyin-service";

export class VideoPublishTaskManger {
  static instance: VideoPublishTaskManger;
  tasks : VideoPublishTask[] = [];
  timeoutInMilliseconds: number = 1000;
  interval: any;
  isRunning: boolean = false;
  isStarted: boolean = false;
  videoPublishTaskService: VideoPublishTaskService;
  douyinService: DouyinService;
  constructor() {
    this.videoPublishTaskService = new VideoPublishTaskService();
    this.douyinService = new DouyinService();
  }

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

  async publish() {
    const latestTask = this.videoPublishTaskService.getLatestTaskToPublish();
    if (!latestTask) {
      console.log("开始执行视频发布任务：没有需要执行的任务");
      return await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      console.log("开始执行视频发布任务：" + JSON.stringify(latestTask));
      return await this.douyinService.publishVideo(latestTask);
    }
  }
}

export const videoPublishTaskManager = VideoPublishTaskManger.getInstance();