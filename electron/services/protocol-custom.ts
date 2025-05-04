import { app, protocol } from 'electron';
import path from 'path'
import fs from 'fs'
import { getPlatformAppDataPath } from './default-save-path'
import { getMimeType } from '../utils';
import { Readable } from 'stream';
import { createWebReadableStream } from '../utils';

// 安全检查中间件
async function checkFileSafety(filePath: string): Promise<boolean> {
  // 1. 规范化路径
  const normalized = path.normalize(filePath);
  
  // 2. 防止目录遍历攻击
  if (normalized !== filePath || normalized.includes('..')) {
    return false;
  }
  
  // 4. 检查文件是否存在且可读
  try {
    await fs.promises.access(normalized, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}


export function initProtocolCustom() {
  // 在主进程中注册自定义协议
  protocol.handle('media', async (request) => {
    try {
      // 提取并安全解码路径
      const unsafePath = request.url.slice('media://'.length);
      const decodedPath = decodeURIComponent(unsafePath)
        .replace(/\//g, '\\') // 统一为Windows路径分隔符
        .replace(/^\\/, '');  // 移除开头的多余反斜杠

      // 标准化路径
      const safePath = path.normalize(decodedPath);

       // 安全检查
       if (!await checkFileSafety(safePath)) {
        return new Response('Access Denied', { status: 403 });
      }

      // 获取文件统计信息
      const stats = await fs.promises.stat(safePath);
      if (!stats.isFile()) {
        return new Response('Not a file', { status: 400 });
      }
      
      // 处理范围请求 (视频/音频流式传输)
      const range = request.headers.get('range');
      const fileSize = stats.size;
      const headers = {
        'Content-Type': getMimeType(safePath),
        'Cache-Control': 'public, max-age=31536000'
      }
      if (range) {
        // 解析范围请求
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = (end - start) + 1;

        // 创建部分读取流
        const fileStream = fs.createReadStream(safePath, { start, end });
        const webStream = createWebReadableStream(fileStream);

        return new Response(webStream, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize.toString(),
            'Content-Type': await getMimeType(safePath),
            'Cache-Control': 'public, max-age=31536000'
          }
        });
      } else {
        const fileStream = fs.createReadStream(safePath);
        const webStream = createWebReadableStream(fileStream);

        return new Response(webStream, {
          headers: {
            'Content-Length': fileSize.toString(),
            'Content-Type': await getMimeType(safePath),
            'Cache-Control': 'public, max-age=31536000'
          }
        });
      }
    } catch (error) {
      return new Response('Not Found', { status: 404 });
    }
  });
}
