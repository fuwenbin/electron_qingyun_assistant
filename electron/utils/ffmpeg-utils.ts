import * as ffmpeg from 'fluent-ffmpeg';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

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
