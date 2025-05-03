import * as ffmpeg from 'fluent-ffmpeg';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

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

export function getDurationWithFfmpeg(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}

export async function hasAudio(filePath: string): Promise<boolean> {
  try {
    const execAsync = promisify(exec);
    const { stdout } = await execAsync(`ffprobe -v error -show_streams -select_streams a "${filePath}"`);
    return stdout.includes('codec_type=audio');
  } catch (e) {
    console.error(`hasAudio error: ${e}`);
    return false;
  }
}

export function generateSrtFile(filePath: string, subtitles: any[]) {
  let srtContent = '';
  subtitles.forEach((sub, index) => {
    const startTime = formatTime(sub.start);
    const endTime = formatTime(sub.start + sub.duration);
    srtContent += `${index + 1}\n${startTime} --> ${endTime}\n${sub.text}\n\n`;
  });
  fs.writeFileSync(filePath, srtContent);
}

export function formatTime(seconds: number): string {
  const date = new Date(0);
  date.setSeconds(seconds);
  return date.toISOString().slice(11, 23).replace('.', ',');
}

// 辅助函数：获取字体路径
export async function getFontPath(fontName: string): Promise<string> {
  const fontNamePathMap = {
    'Microsoft YaHei': 'msyh.ttc',
    '微软雅黑': 'msyh.ttc',
    'SimHei': 'simhei.ttf',
    '黑体': 'simhei.ttf',
    'SimSun': 'simsun.ttc',
    '宋体': 'simsun.ttc',
    'SimKai': 'simkai.ttf',
    '楷体': 'simkai.ttf',
    '仿宋': 'simfang.ttf',
    'FangSong': 'simfang.ttf',
    'Arial': 'arial.ttf',
  }
  const fontPathName = fontNamePathMap[fontName] || 'arial.ttf';
 
  
  // 打包后使用应用内字体
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'fonts', fontPathName);
  } else {
    // 开发环境：使用项目内字体或系统字体
    const localFont = path.join(__dirname, '../../fonts', fontPathName);
    if (fs.existsSync(localFont)) {
      return localFont;
    } else {
      const systemFonts = {
        win32: 'C:/Windows/Fonts/',
        darwin: '/System/Library/Fonts/',
        linux: '/usr/share/fonts/'
      };
      const platform = process.platform;
      return path.join(systemFonts[platform] || '', fontPathName);
    }
  }
}
