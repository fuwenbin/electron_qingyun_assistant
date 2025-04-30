import * as ffmpeg from 'fluent-ffmpeg';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

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
  const systemFonts = {
    win32: 'C:/Windows/Fonts/',
    darwin: '/System/Library/Fonts/',
    linux: '/usr/share/fonts/'
  };
  
  const platform = process.platform;
  const fontPath = path.join(systemFonts[platform] || '', fontName);
  
  try {
    await fs.promises.access(fontPath);
    return fontPath;
  } catch {
    return fontName; // 回退到字体名称
  }
}


