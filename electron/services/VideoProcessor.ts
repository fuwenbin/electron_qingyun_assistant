import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { VideoCompositionOptions } from '../common/types';
import { ipcMain } from 'electron';

export class VideoProcessor {
  async composeVideo(options: VideoCompositionOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      // 创建临时字幕文件
      const subtitleFilePath = this.createSubtitlesFile(options);
      
      let command = ffmpeg();
      
      // 添加视频输入
      options.videoClips.forEach(clip => {
        command.input(clip.path);
        if (clip.startTime) {
          command.inputOption([`-ss ${clip.startTime}`]);
        }
        if (clip.duration) {
          command.inputOption([`-t ${clip.duration}`]);
        }
      });
      
      // 添加音频输入
      options.audioClips.forEach(clip => {
        command.input(clip.path);
        if (clip.startTime) {
          command.inputOption([`-ss ${clip.startTime}`]);
        }
        if (clip.duration) {
          command.inputOption([`-t ${clip.duration}`]);
        }
      });
      
      // 复杂滤镜处理
      let filterComplex = [];
      
      // 视频处理
      const videoFilters = options.videoClips.map((clip, i) => {
        return `[${i}:v]scale=${options.width}:${options.height},setsar=1[v${i}]`;
      });
      filterComplex.push(videoFilters.join(';'));
      
      // 视频拼接
      const videoConcat = options.videoClips.map((_, i) => `[v${i}]`).join('');
      filterComplex.push(`${videoConcat}concat=n=${options.videoClips.length}:v=1:a=0[vout]`);
      
      // 音频处理
      const audioFilters = options.audioClips.map((clip, i) => {
        const volume = clip.volume !== undefined ? `volume=${clip.volume}` : '';
        const offset = `adelay=${clip.startTime * 1000}|${clip.startTime * 1000}`;
        return `[${options.videoClips.length + i}:a]${volume}${volume ? ',' : ''}${offset}[a${i}]`;
      });
      filterComplex.push(audioFilters.join(';'));
      
      // 音频混合
      const audioMix = options.audioClips.map((_, i) => `[a${i}]`).join('');
      filterComplex.push(`${audioMix}amix=inputs=${options.audioClips.length}[aout]`);
      
      // 添加字幕
      if (subtitleFilePath) {
        filterComplex.push(`[vout]subtitles=${subtitleFilePath}:force_style='Fontsize=${options.subtitles?.[0]?.style?.size || 24},Fontname=${options.subtitles?.[0]?.style?.font || 'Arial'},PrimaryColour=${options.subtitles?.[0]?.style?.color || 'FFFFFF'},BackColour=${options.subtitles?.[0]?.style?.backgroundColor || '00000000'},Alignment=2'[vsubtitled]`);
      }
      
      command
        .complexFilter(filterComplex)
        .outputOptions([
          '-map [vout]',
          '-map [aout]',
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          '-c:a aac',
          '-b:a 192k',
          '-r 30',
          '-pix_fmt yuv420p'
        ])
        .on('start', (commandLine) => {
          console.log('Spawned FFmpeg with command: ' + commandLine);
        })
        .on('progress', (progress) => {
          console.log(`Processing: ${progress.percent}% done`);
        })
        .on('end', () => {
          if (subtitleFilePath) {
            fs.unlinkSync(subtitleFilePath);
          }
          resolve(options.outputPath);
        })
        .on('error', (err) => {
          if (subtitleFilePath) {
            fs.unlinkSync(subtitleFilePath);
          }
          reject(err);
        })
        .save(options.outputPath);
    });
  }
  
  private createSubtitlesFile(options: VideoCompositionOptions): string | null {
    if (!options.subtitles || options.subtitles.length === 0) {
      return null;
    }
    
    const subtitleFilePath = path.join(__dirname, 'temp_subtitles.srt');
    let srtContent = '';
    
    options.subtitles.forEach((subtitle, index) => {
      srtContent += `${index + 1}\n`;
      srtContent += `${this.formatTime(subtitle.startTime)} --> ${this.formatTime(subtitle.startTime + subtitle.duration)}\n`;
      srtContent += `${subtitle.text}\n\n`;
    });
    
    fs.writeFileSync(subtitleFilePath, srtContent);
    return subtitleFilePath;
  }
  
  private formatTime(seconds: number): string {
    const date = new Date(0);
    date.setSeconds(seconds);
    return date.toISOString().substr(11, 12).replace('.', ',');
  }
}

export function initVideoProcessor() {
  ipcMain.handle('compose-video', async (event, options: VideoCompositionOptions) => {
    const videoProcessor = new VideoProcessor();
    try {
      const outputPath = await videoProcessor.composeVideo(options);
      return { success: true, outputPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
