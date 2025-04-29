
import { ipcMain } from 'electron';
import log from 'electron-log';
import { SpeechSynthesizer } from "alibabacloud-nls"
import { COMMON_CONFIG } from './aliyun-config';
import * as fs from 'fs';
import path from 'path';
import { decodeArg, sleep } from '../utils';
import { getToken } from './aliyun-token';
import { getDurationWithFfmpeg } from '../utils/ffmpeg-utils';
import { getPlatformAppDataPath } from './default-save-path';

// 语音合成参数
export interface TTSRequestParams {
  text: string;           // 合成文本，支持SSML语法，例如'<speak>这段内容<break time="500ms"/>会有停顿</speak>'
  voice?: string;         // 发音人，默认：xiaoyun
  format?: 'pcm' | 'wav' | 'mp3';        // 格式，默认：pcm
  sampleRate?: 16000 | 8000;    // 采样率，默认：16000
  volume?: number;        // 音量，默认：50
  speechRate?: number;    // 语速，默认：0
  pitchRate?: number;     // 语调，默认：0
}


export function initAliyunTTS() {
  ipcMain.handle('text2voice', async (event, paramsStr: string) => {
    try {
      const params = JSON.parse(decodeArg(paramsStr));
      const options = params;
      const outputDir = params.outputDir || getPlatformAppDataPath();
      const outputFileName = params.outputFileName || `tts_${Date.now()}`;
      const token = await getToken();
      // 确保输出目录存在
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const tts = new SpeechSynthesizer({
        url: COMMON_CONFIG.ttsUrl,
        appkey: COMMON_CONFIG.appkey,
        token: token
      });
      const outputFile = path.join(outputDir, `${outputFileName}.${options.format || 'mp3'}`);
      const fileStream = fs.createWriteStream(outputFile);
      log.log(outputFile);
      return new Promise((resolve, reject) => {
        
          tts.on("meta", (msg)=>{
            log.info("接收到元信息:", msg);
          })
        
          tts.on("data", (msg)=>{
            try {
              fileStream.write(msg);
              log.debug(`接收到数据块，大小: ${msg.length} bytes`);
            } catch (error) {
              log.error('写入文件失败:', error);
              reject(error);
            }
          })
        
          tts.on("completed", async ()=>{
            fileStream.end();
            log.info('语音合成完成');
            const duration = await getDurationWithFfmpeg(outputFile);
            log.info(`语音合成完成，时长: ${duration}秒`);
            resolve({ success: true, outputFile, duration });
          })
        
          tts.on("closed", () => {
            log.info('连接已关闭');
          })
        
          tts.on("failed", (error: any)=>{
            fileStream.end();
            log.error('语音合成失败:', error);
            reject(error);
          })
          tts.start(options, true, 6000);
        
      });
    } catch (error: any) {
      log.error('语音合成初始化失败:', error);
      throw error;
    }
  });
}