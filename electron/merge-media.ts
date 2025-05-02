import { app, ipcMain } from "electron";
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import log from 'electron-log';
import { validateFile } from './utils';
import fs from 'fs';


// 动态设置FFmpeg路径
export function setupFFmpeg() {
  try {
    // 设置ffmpeg路径
    let ffmpegPath: string;
    let ffprobePath: string;

    if (app.isPackaged) {
      // 生产环境路径
      const basePath = path.join(process.resourcesPath, 'bin'); // 修改为直接使用resources/bin
      
      // 检查路径是否存在
      if (!fs.existsSync(basePath)) {
        throw new Error(`FFmpeg目录不存在: ${basePath}`);
      }

      const exeExt = process.platform === 'win32' ? '.exe' : '';
      ffmpegPath = path.join(basePath, `ffmpeg${exeExt}`);
      ffprobePath = path.join(basePath, `ffprobe${exeExt}`);

      // 验证文件是否存在
      if (!fs.existsSync(ffmpegPath)) {
        throw new Error(`FFmpeg可执行文件不存在: ${ffmpegPath}`);
      }
      if (!fs.existsSync(ffprobePath)) {
        throw new Error(`FFprobe可执行文件不存在: ${ffprobePath}`);
      }
    } else {
      // 开发环境路径
      // const ffmpegStatic = require('ffmpeg-static');
      // const ffprobeStatic = require('ffprobe-static');
      
      // ffmpegPath = ffmpegStatic;
      // ffprobePath = ffprobeStatic.path;
      // 开发环境路径
      const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
      const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
      
      ffmpegPath = ffmpegInstaller.path;
      ffprobePath = ffprobeInstaller.path;
    }

    console.log('FFmpeg路径:', ffmpegPath);
    console.log('FFprobe路径:', ffprobePath);
    
    // 设置路径
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);
    
    return { ffmpegPath, ffprobePath };
  } catch (error) {
    console.error('FFmpeg初始化失败:', error);
    throw new Error(`视频处理引擎初始化失败: ${error.message}`);
  }
}

export function initMergeMedia() {

  // 媒体合成处理器
  ipcMain.handle('merge-media', async (event: Electron.IpcMainInvokeEvent, params: {
    videoPaths: string[];
    audioPaths: string[];
    outputPath: string;
    audioVolumes?: number[];
  }) => {
    const { videoPaths, audioPaths, outputPath, audioVolumes = [] } = params;

    const files = [
      ...await Promise.all(videoPaths.map(validateFile)),
      ...await Promise.all(audioPaths.map(validateFile))
    ];

    return new Promise<string>((resolve, reject) => {
      const command = ffmpeg();
      files.forEach(file => command.input(file));

      const complexFilter = [];
      // 视频处理
      const videoFilters = videoPaths.map((_, i) => `[${i}:v]scale=1280:720,setsar=1[v${i}]`);
      complexFilter.push(videoFilters.join(';'));
      const videoConcat = videoPaths.map((_, i) => `[v${i}]`).join('');
      complexFilter.push(`${videoConcat}concat=n=${videoPaths.length}:v=1:a=0[vout]`);
      // 音频处理
      const audioFilters = audioPaths.map((_, i) => `[${i + videoPaths.length}:a]aformat=sample_fmts=fltp[a${i}]`);
      complexFilter.push(audioFilters.join(';'));
      // 音频混合
      const audioMix = audioPaths.map((_, i) => `[a${i}]`).join('');
      complexFilter.push(`${audioMix}amix=inputs=${audioPaths.length}:duration=longest[aout]`);
      // 添加字幕
      // if (subtitleFilePath) {
      //   filterComplex.push(`[vout]subtitles=${subtitleFilePath}:force_style='Fontsize=${options.subtitles?.[0]?.style?.size || 24},Fontname=${options.subtitles?.[0]?.style?.font || 'Arial'},PrimaryColour=${options.subtitles?.[0]?.style?.color || 'FFFFFF'},BackColour=${options.subtitles?.[0]?.style?.backgroundColor || '00000000'},Alignment=2'[vsubtitled]`);
      // }
      
      log.log(complexFilter.join(';'));
      command.complexFilter(complexFilter.join(';'))
      .outputOptions([
        '-map [vout]',
        '-map [aout]',
        '-c:v libx264',
        '-preset fast',
        '-crf 22',
        '-c:a aac',
        '-b:a 192k',
        '-shortest'
      ])
      .save(outputPath)
      .on('progress', (progress) => {
        const percent = progress.percent ? Math.min(100, progress.percent) : 0;
        event.sender.send('merge-progress', percent);
      })
      .on('end', () => resolve(outputPath))
      .on('error', (err, stdout, stderr) => {
        console.error('FFmpeg Error:', err.message);
        console.error('FFmpeg Stderr:', stderr); // 关键错误信息在这
        reject(err);
      });
    });
  });

}