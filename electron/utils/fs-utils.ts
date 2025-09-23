import { readdir, stat } from 'fs/promises';
import path from 'path';

// 常见的视频文件扩展名
export const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp', '.ogv'];

export async function getAllFilesInDirectory(dirPath: string, recursive = false): Promise<string[]> {
  try {
    const files = await readdir(dirPath);
    const result: string[] = [];
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const fileStat = await stat(fullPath);

      if (!fileStat.isDirectory()) {
        result.push(fullPath);
      } else if (recursive) {
        // 如果当前路径是目录，且需要递归获取子目录文件 ，则递归调用本函数
        const subFiles = await getAllFilesInDirectory(fullPath, recursive);
        result.push(...subFiles);
      }
    }
    return result;
  } catch (err) {
    console.error('Error reading directory:', err);
    return [];
  }
}

/**
 * 获取目录下的所有视频文件
 * @param directoryPath 目录路径
 * @param recursive 是否递归查找子目录，默认为 false
 * @param extensions 自定义视频文件扩展名，默认使用 VIDEO_EXTENSIONS
 * @returns 视频文件路径数组
 */
export async function getVideoFilesInDirectory(
  directoryPath: string, 
  recursive = false, 
  extensions = VIDEO_EXTENSIONS
): Promise<string[]> {
  try {
    const allFiles = await getAllFilesInDirectory(directoryPath, recursive);
    const videoFiles = allFiles.filter(filePath => {
      const ext = path.extname(filePath).toLowerCase();
      return extensions.includes(ext);
    });
    return videoFiles;
  } catch (err) {
    console.error('Error getting video files:', err);
    return [];
  }
}