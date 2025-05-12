import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import log from 'electron-log'

export function setupFFmpeg() {
  let ffmpegPath;
  let ffprobePath;
  let basePath;
  const platform = process.platform;
  const ffmpegExecutableName = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const ffprobeExecutableName = platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';
  
  if (!app.isPackaged) {
    // 开发环境
    basePath = path.join(app.getAppPath(), 'bin');
  } else {
    // 生产环境
    basePath = process.resourcesPath;
  }
  ffmpegPath = path.join(basePath, ffmpegExecutableName);
  ffprobePath = path.join(basePath, ffprobeExecutableName);
  ffmpeg.setFfmpegPath(ffmpegPath);
  ffmpeg.setFfprobePath(ffprobePath);
  checkFFmpeg();
}

function checkFFmpeg(): Promise<string> {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    command.on('stderr', (line) => console.log('FFmpeg:', line));
    
    command
      .output('-') // 输出到stdout
      .addOption('-version')
      .on('error', reject)
      .on('end', (stdout, stderr) => {
        const versionLine = stderr.split('\n').find(line => line.includes('ffmpeg version'));
        resolve(versionLine || 'FFmpeg version unknown');
      })
      .run();
  });
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
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        log.error('FFprobe检测音频流失败:', {
          filePath,
          error: err.message
        });
        return resolve(false);
      }
      
      const hasAudio = metadata.streams.some(
        stream => stream.codec_type === 'audio'
      );
      
      log.verbose(`音频流检测结果: ${filePath} -> ${hasAudio ? '有' : '无'}音频`);
      resolve(hasAudio);
    });
  });
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
export function getFontPath(fontName: string): string {
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

export function getFontsdir(): string {
  // 打包后使用应用内字体
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'fonts');
  } else {
    // 开发环境：使用项目内字体或系统字体
    const localFont = path.join(__dirname, '../../fonts');
    if (fs.existsSync(localFont)) {
      return localFont;
    } else {
      const systemFonts = {
        win32: 'C:/Windows/Fonts/',
        darwin: '/System/Library/Fonts/',
        linux: '/usr/share/fonts/'
      };
      const platform = process.platform;
      return path.join(systemFonts[platform] || '');
    }
  }
}
