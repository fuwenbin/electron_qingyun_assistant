import { ipcMain, app } from 'electron';
import log from 'electron-log';
import * as fs from 'fs';
import path from 'path';
import { decodeArg } from '../../utils';
import { getDurationWithFfmpeg } from '../../utils/ffmpeg-utils';
import { getPlatformAppDataPath } from '../default-save-path';
import { spawn } from 'child_process';

// Edge TTS 语音合成参数
export interface EdgeTTSRequestParams {
  text: string;           // 合成文本
  voice?: string;         // 发音人，默认：zh-CN-XiaoxiaoNeural
  rate?: string;          // 语速，默认：+0%
  pitch?: string;         // 语调，默认：+0Hz
  volume?: string;        // 音量，默认：+0%
  format?: string;        // 格式，默认：mp3
}

// 可用的中文语音列表
export const CHINESE_VOICES = [
  { label: '晓晓 (女声)', value: 'zh-CN-XiaoxiaoNeural' },
  { label: '云希 (女声)', value: 'zh-CN-YunxiNeural' },
  { label: '云健 (男声)', value: 'zh-CN-YunjianNeural' },
  { label: '晓辰 (女声)', value: 'zh-CN-XiaochenNeural' },
  { label: '晓涵 (女声)', value: 'zh-CN-XiaohanNeural' },
  { label: '晓墨 (女声)', value: 'zh-CN-XiaomengNeural' },
  { label: '晓悠 (女声)', value: 'zh-CN-XiaoyouNeural' },
  { label: '云扬 (男声)', value: 'zh-CN-YunyangNeural' },
  { label: '晓伊 (女声)', value: 'zh-CN-XiaoyiNeural' },
  { label: '云枫 (男声)', value: 'zh-CN-YunfengNeural' },
];

/**
 * 获取 Python 可执行文件路径
 */
function getPythonPath(): string {
  const isDev = !app.isPackaged;
  
  if (isDev) {
    // 开发环境：使用虚拟环境中的 Python
    const projectRoot = path.join(__dirname, '../../../..');
    const venvPython = path.join(projectRoot, 'venv', 'bin', 'python');
    const venvPythonWin = path.join(projectRoot, 'venv', 'Scripts', 'python.exe');
    
    // 检查虚拟环境中的 Python 是否存在
    if (fs.existsSync(venvPython)) {
      log.log(`开发环境使用虚拟环境 Python: ${venvPython}`);
      return venvPython;
    } else if (fs.existsSync(venvPythonWin)) {
      log.log(`开发环境使用虚拟环境 Python: ${venvPythonWin}`);
      return venvPythonWin;
    } else {
      log.warn('虚拟环境 Python 不存在，使用系统 Python');
      return process.platform === 'win32' ? 'python' : 'python3';
    }
  } else {
    // 打包环境：使用打包的 Python
    const resourcesPath = process.resourcesPath;
    const pythonPath = path.join(resourcesPath, 'python', 'python.exe');
    const pythonPathUnix = path.join(resourcesPath, 'python', 'bin', 'python');
    
    if (process.platform === 'win32' && fs.existsSync(pythonPath)) {
      log.log(`打包环境使用 Python: ${pythonPath}`);
      return pythonPath;
    } else if (fs.existsSync(pythonPathUnix)) {
      log.log(`打包环境使用 Python: ${pythonPathUnix}`);
      return pythonPathUnix;
    } else {
      log.warn('打包的 Python 不存在，使用系统 Python');
      return process.platform === 'win32' ? 'python' : 'python3';
    }
  }
}

/**
 * 获取 Edge TTS 可执行文件路径
 */
function getEdgeTTSPath(): string {
  const isDev = !app.isPackaged;
  
  if (isDev) {
    // 开发环境：使用虚拟环境中的 edge-tts
    const projectRoot = path.join(__dirname, '../../../..');
    const venvEdgeTts = path.join(projectRoot, 'venv', 'bin', 'edge-tts');
    const venvEdgeTtsWin = path.join(projectRoot, 'venv', 'Scripts', 'edge-tts.exe');
    
    if (fs.existsSync(venvEdgeTts)) {
      return venvEdgeTts;
    } else if (fs.existsSync(venvEdgeTtsWin)) {
      return venvEdgeTtsWin;
    } else {
      return 'edge-tts';
    }
  } else {
    // 打包环境：使用打包的 edge-tts
    const resourcesPath = process.resourcesPath;
    const edgeTtsPath = path.join(resourcesPath, 'python', 'Scripts', 'edge-tts.exe');
    const edgeTtsPathUnix = path.join(resourcesPath, 'python', 'bin', 'edge-tts');
    
    // 检查多个可能的路径
    const possiblePaths = [
      edgeTtsPath,
      edgeTtsPathUnix,
      path.join(resourcesPath, 'python-portable', 'bin', 'edge-tts'),
      path.join(resourcesPath, 'python-portable', 'Scripts', 'edge-tts.exe'),
      path.join(__dirname, '../../../python-portable/bin/edge-tts'),
      path.join(__dirname, '../../../python-portable/Scripts/edge-tts.exe'),
      // 添加更多可能的路径
      path.join(resourcesPath, 'python-portable', 'bin', 'edge-tts.exe'),
      path.join(resourcesPath, 'python-portable', 'Scripts', 'edge-tts'),
      // 直接使用相对路径
      path.join(process.cwd(), 'python-portable', 'bin', 'edge-tts'),
      path.join(process.cwd(), 'python-portable', 'Scripts', 'edge-tts.exe')
    ];
    
    log.log(`检查 Edge TTS 路径，resourcesPath: ${resourcesPath}`);
    for (const possiblePath of possiblePaths) {
      log.log(`检查路径: ${possiblePath}, 存在: ${fs.existsSync(possiblePath)}`);
      if (fs.existsSync(possiblePath)) {
        log.log(`找到 Edge TTS: ${possiblePath}`);
        return possiblePath;
      }
    }
    
    // 如果找不到 edge-tts 可执行文件，尝试使用 python-portable 中的 Python 来运行
    const pythonPortablePath = path.join(resourcesPath, 'python-portable');
    const pythonExe = process.platform === 'win32' 
      ? path.join(pythonPortablePath, 'Scripts', 'python.exe')
      : path.join(pythonPortablePath, 'bin', 'python');
    
    if (fs.existsSync(pythonExe)) {
      log.log(`使用 Python 运行 edge-tts: ${pythonExe} -m edge_tts`);
      return pythonExe; // 返回 Python 路径，稍后在参数中指定 -m edge_tts
    }
    
    log.warn('未找到打包的 Edge TTS，尝试使用系统 edge-tts');
    return 'edge-tts';
  }
}

export async function generateAudioWithEdgeTTS(params: any) {
  try {
    const options = {
      text: params.text,
      voice: params.voice || 'zh-CN-XiaoxiaoNeural',
      rate: params.rate || '+0%',
      pitch: params.pitch || '+0Hz',
      volume: params.volume || '+0%',
      format: params.format || 'mp3'
    };

    const outputDir = params.outputDir || getPlatformAppDataPath();
    const outputFileName = params.outputFileName || `tts_${Date.now()}`;
    
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, `${outputFileName}.${options.format}`);
    
    log.log(`开始使用 Edge TTS 合成语音: ${outputFile}`);
    log.log(`参数: ${JSON.stringify(options)}`);

    return new Promise((resolve, reject) => {
      const edgeTtsPath = getEdgeTTSPath();
      
      // 构建 edge-tts 命令
      let args = [
        '--text', options.text,
        '--voice', options.voice,
        '--rate', options.rate,
        '--pitch', options.pitch,
        '--volume', options.volume,
        '--write-media', outputFile
      ];
      
      // 如果使用 Python 运行，添加 -m edge_tts 参数
      if (edgeTtsPath.includes('python') && !edgeTtsPath.includes('edge-tts')) {
        args = ['-m', 'edge_tts', ...args];
        log.log(`使用 Python 模块运行: ${edgeTtsPath} -m edge_tts`);
      }
      
      log.log(`执行命令: ${edgeTtsPath} ${args.join(' ')}`);

      // 检查 edge-tts 是否存在
      if (!fs.existsSync(edgeTtsPath) && !edgeTtsPath.includes('edge-tts')) {
        throw new Error(`Edge TTS 可执行文件不存在: ${edgeTtsPath}`);
      }

      // 执行 edge-tts 命令
      const edgeTtsProcess = spawn(edgeTtsPath, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let errorOutput = '';

      edgeTtsProcess.stdout.on('data', (data) => {
        log.log(`Edge TTS stdout: ${data}`);
      });

      edgeTtsProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        log.log(`Edge TTS stderr: ${data}`);
      });

      edgeTtsProcess.on('close', async (code) => {
        if (code === 0) {
          try {
            // 等待一小段时间，确保文件写入完成
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 检查文件是否生成成功
            if (fs.existsSync(outputFile)) {
              const duration = await getDurationWithFfmpeg(outputFile);
              log.log(`Edge TTS 语音合成完成: ${outputFile}, 时长: ${duration}秒`);
              resolve({ 
                success: true, 
                outputFile, 
                duration: Math.floor(duration * 1000) / 1000 
              });
            } else {
              log.error(`语音文件不存在: ${outputFile}`);
              log.error(`输出目录内容: ${fs.existsSync(path.dirname(outputFile)) ? fs.readdirSync(path.dirname(outputFile)).join(', ') : '目录不存在'}`);
              reject(new Error(`语音文件生成失败：文件不存在 - ${outputFile}`));
            }
          } catch (error) {
            log.error('获取音频时长失败:', error);
            reject(error);
          }
        } else {
          log.error(`Edge TTS 进程退出，代码: ${code}`);
          log.error(`错误输出: ${errorOutput}`);
          reject(new Error(`Edge TTS 执行失败，退出代码: ${code}, 错误: ${errorOutput}`));
        }
      });

      edgeTtsProcess.on('error', (error: any) => {
        log.error('Edge TTS 进程启动失败:', error);
        
        // 特殊处理 ENOENT 错误（找不到命令）
        if (error.code === 'ENOENT') {
          const errorMsg = `Edge TTS 命令未找到: ${edgeTtsPath}\n\n解决方案：\n1. 确保已安装 Edge TTS\n2. 检查 Python 环境是否正确配置\n3. 重新运行 npm run setup:python`;
          log.error(errorMsg);
          reject(new Error(errorMsg));
        } else {
          reject(new Error(`Edge TTS 进程启动失败: ${error.message}`));
        }
      });

      // 设置超时
      setTimeout(() => {
        if (!edgeTtsProcess.killed) {
          edgeTtsProcess.kill();
          reject(new Error('Edge TTS 执行超时'));
        }
      }, 60000); // 60秒超时
    });

  } catch (error: any) {
    log.error('Edge TTS 语音合成失败:', error);
    throw error;
  }
}

// 获取可用的语音列表
export async function getAvailableVoices() {
  return new Promise((resolve, reject) => {
    const edgeTtsPath = getEdgeTTSPath();
    
    // 构建参数
    let args = ['--list-voices'];
    
    // 如果使用 Python 运行，添加 -m edge_tts 参数
    if (edgeTtsPath.includes('python') && !edgeTtsPath.includes('edge-tts')) {
      args = ['-m', 'edge_tts', ...args];
    }
    
    const edgeTtsProcess = spawn(edgeTtsPath, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    edgeTtsProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    edgeTtsProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    edgeTtsProcess.on('close', (code) => {
      if (code === 0) {
        try {
          // 解析语音列表
          const voices = output.split('\n')
            .filter(line => line.trim())
            .map(line => {
              // Edge TTS 输出格式: "zh-CN-XiaoxiaoNeural    Microsoft Server Speech Text to Speech Voice (zh-CN, XiaoxiaoNeural)"
              const match = line.match(/^(\S+)\s+(.+)$/);
              if (match) {
                const value = match[1];
                const description = match[2];
                
                // 提取更友好的标签
                let label = description;
                if (description.includes('XiaoxiaoNeural')) {
                  label = '晓晓 (女声)';
                } else if (description.includes('YunxiNeural')) {
                  label = '云希 (女声)';
                } else if (description.includes('YunjianNeural')) {
                  label = '云健 (男声)';
                } else if (description.includes('XiaochenNeural')) {
                  label = '晓辰 (女声)';
                } else if (description.includes('XiaohanNeural')) {
                  label = '晓涵 (女声)';
                } else if (description.includes('XiaomengNeural')) {
                  label = '晓墨 (女声)';
                } else if (description.includes('XiaoyouNeural')) {
                  label = '晓悠 (女声)';
                } else if (description.includes('YunyangNeural')) {
                  label = '云扬 (男声)';
                } else if (description.includes('XiaoyiNeural')) {
                  label = '晓伊 (女声)';
                } else if (description.includes('YunfengNeural')) {
                  label = '云枫 (男声)';
                }
                
                return {
                  value: value,
                  label: label
                };
              }
              return null;
            })
            .filter(voice => voice !== null);

          // 如果解析失败，返回默认的中文语音列表
          if (voices.length === 0) {
            resolve(CHINESE_VOICES);
          } else {
            resolve(voices);
          }
        } catch (error) {
          reject(new Error('解析语音列表失败'));
        }
      } else {
        reject(new Error(`获取语音列表失败: ${errorOutput}`));
      }
    });

    edgeTtsProcess.on('error', (error) => {
      reject(new Error(`获取语音列表失败: ${error.message}`));
    });
  });
}

export function initEdgeTTS() {
  ipcMain.handle('text2voice', async (event, paramsStr: string) => {
    const params = JSON.parse(decodeArg(paramsStr));
    log.log('Edge TTS 接收参数:');
    log.log(JSON.stringify(params));
    return generateAudioWithEdgeTTS(params);
  });

  ipcMain.handle('get-available-voices', async () => {
    try {
      return await getAvailableVoices();
    } catch (error) {
      log.error('获取语音列表失败:', error);
      // 返回默认的中文语音列表
      return CHINESE_VOICES;
    }
  });
}
