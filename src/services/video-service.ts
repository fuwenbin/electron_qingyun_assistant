import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

interface MergeResult {
  success: boolean;
  output?: Blob;
  error?: string;
}

export class VideoMerger {
  private ffmpeg: FFmpeg;
  private isLoaded = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  async initialize(): Promise<void> {
    if (!this.isLoaded) {
      await this.ffmpeg.load({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js',
      });
      this.isLoaded = true;
    }
  }

  async mergeVideosWithAudio(
    videoFiles: File[],
    audioFile?: File,
    outputFilename = 'output.mp4'
  ): Promise<MergeResult> {
    try {
      console.log("开始初始化")
      await this.initialize();
      console.log("初始化完成")

      // 写入视频文件
      console.log("下入视频文件")
      for (let i = 0; i < videoFiles.length; i++) {
        const data = await fetchFile(videoFiles[i]);
        await this.ffmpeg.writeFile(`input${i}.mp4`, data);
      }

      // 写入音频文件
      console.log("写入音频文件")
      const audioData = await fetchFile(audioFile);
      await this.ffmpeg.writeFile('audio.mp3', audioData);

      // 执行FFmpeg命令
      await this.ffmpeg.exec([
        ...videoFiles.flatMap((_, i) => ['-i', `input${i}.mp4`]),
        '-i', 'audio.mp3',
        '-filter_complex', 
          `concat=n=${videoFiles.length}:v=1:a=0[v];` +
          `amix=inputs=${videoFiles.length + 1}[a]`,
        '-map', '[v]',
        '-map', '[a]',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        outputFilename
      ]);

      // 读取输出文件
      console.log("读取输出文件");
      const data = await this.ffmpeg.readFile(outputFilename);
      
      return {
        success: true,
        output: new Blob([data], { type: 'video/mp4' })
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async cleanup(): Promise<void> {
    if (this.isLoaded) {
      const files = await this.ffmpeg.listDir('/');
      for (const file of files) {
        if (file.isDir) continue;
        if (file.name.match(/\.(mp4|mp3)$/)) {
          await this.ffmpeg.deleteFile(file.name);
        }
      }
    }
  }
}