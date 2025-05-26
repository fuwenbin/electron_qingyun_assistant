import { protocol } from 'electron';
import path from 'path'
import fs from 'fs'
import { getMimeType } from '../utils';
import { createWebReadableStream } from '../utils';
import { PassThrough } from 'stream';

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

export function initProtocolCustomBeforeAppReady() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'media',
      privileges: {
        standard: false,
        secure: true,
        supportFetchAPI: true,
        bypassCSP: true,
        corsEnabled: true,
        stream: true
      }
    }
  ])
}


export function initProtocolCustom() {
  // 在主进程中注册自定义协议
  protocol.handle('media', (request) => {
    try {
      // 解码URL并获取文件路径
      const filePath = decodeURIComponent(new URL(request.url).hostname);
      console.log('处理文件请求:', filePath);
      
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        console.error('文件不存在:', filePath);
        return new Response(null, { status: 404 });
      }

      // 获取文件大小
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      
      // 处理Range请求头
      const rangeHeader = request.headers.get('range');
      let start = 0;
      let end = fileSize - 1;
      
      if (rangeHeader) {
        const parts = rangeHeader.replace(/bytes=/, '').split('-');
        start = parseInt(parts[0], 10);
        end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      }

      // 创建可读流
      const fileStream = fs.createReadStream(filePath, { start, end });
      const responseStream: any = new PassThrough();
      fileStream.pipe(responseStream);
      
      // 设置响应头
      const responseHeaders = {
        'Content-Type': getMimeType(filePath),
        'Content-Length': (end - start + 1).toString(),
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Access-Control-Allow-Origin': '*', // 解决CORS问题
        'Cross-Origin-Resource-Policy': 'cross-origin',
        "Cache-Control": "no-cache"
      };

      // 返回响应
      return new Response(responseStream, {
        status: rangeHeader ? 206 : 200,
        headers: responseHeaders
      });
    } catch (error) {
      console.error('处理请求时出错:', error);
      return new Response(null, { status: 500 });
    }
  });
}
