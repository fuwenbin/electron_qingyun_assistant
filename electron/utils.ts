import app from 'electron';
const iconv = require('iconv-lite'); 
import path from 'path';
import fs from 'fs';

// 工具函数
export function convertUrlToPath(url: string): string {
  const path = require('path');
  const fs = require('fs');
  
  // 处理blob URL
  if (url.startsWith('blob:')) {
    return url.replace('blob:', '');
  }
  
  // 处理base64数据
  if (url.startsWith('data:')) {
    const matches = url.match(/^data:(.+?);base64,(.+)$/);
    if (!matches || matches.length < 3) {
      throw new Error('无效的base64数据');
    }
    
    const [_, mimeType, base64Data] = matches;
    const ext = mimeType.split('/')[1] || 'bin';
    const tempPath = path.join(
      app.getPath('temp'), 
      `temp-${Date.now()}.${ext}`
    );
    
    fs.writeFileSync(tempPath, Buffer.from(base64Data, 'base64'));
    return tempPath;
  }
  
  // 普通文件路径
  return path.normalize(url);
}

export function timeToSeconds(time: string): number {
  const parts = time.split(':');
  return parseFloat(parts[0]) * 3600 + 
         parseFloat(parts[1]) * 60 + 
         parseFloat(parts[2]);
}

// 修正路径编码（如果乱码）
export function correctPath(rawPath: string) {
  try {
    // 尝试用GBK解码常见乱码
    const gbkDecoded = iconv.decode(Buffer.from(rawPath, 'binary'), 'gbk');
    
    // 处理特殊乱码情况（如"瀣э拷"）
    if (/[^\u0000-\uFFFF]/.test(gbkDecoded)) {
      return rawPath.split(path.sep)
        .map(segment => {
          try {
            return iconv.decode(Buffer.from(segment, 'binary'), 'gbk');
          } catch {
            return segment;
          }
        })
        .join(path.sep);
    }
    return gbkDecoded;
  } catch {
    return rawPath; // 解码失败返回原路径
  }
};

/**
 * 验证文件是否存在（自动处理编码问题）
 */
export async function validateFile(filePath: string) {
  const correctedPath = correctPath(filePath);
  const normalizedPath = path.normalize(correctedPath);
  console.log(normalizedPath);

  if (!fs.existsSync(normalizedPath)) {
    // 尝试原始路径（某些情况下可能需要）
    if (filePath !== normalizedPath && fs.existsSync(filePath)) {
      return filePath;
    }
    throw new Error(`文件不存在: ${normalizedPath}\n原始路径: ${filePath}`);
  }
  return normalizedPath;
}

export const sleep = (waitTimeInMs: number) => new Promise(resolve => setTimeout(resolve, waitTimeInMs))

export function encodeArg(args: string) {
  return Buffer.from(args).toString('base64');
}

export function decodeArg(args: string) {
  return Buffer.from(args, 'base64').toString('utf-8');
}