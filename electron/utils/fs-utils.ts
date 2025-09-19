import { readdir, stat } from 'fs/promises';
import path from 'path';

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