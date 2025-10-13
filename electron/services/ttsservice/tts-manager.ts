import { ipcMain } from 'electron';
import log from 'electron-log';
import { decodeArg } from '../../utils';
import { generateAudioWithEdgeTTS, CHINESE_VOICES } from './edge-tts';

// TTS 服务类型 - 只支持 Edge TTS
export type TTSServiceType = 'edge';

// TTS 配置
export interface TTSConfig {
  service: TTSServiceType;
}

// 默认配置 - 强制使用 Edge TTS
const DEFAULT_CONFIG: TTSConfig = {
  service: 'edge'
};

// 当前配置 - 强制使用 Edge TTS
let currentConfig: TTSConfig = { ...DEFAULT_CONFIG };

/**
 * 设置 TTS 服务配置 - 强制使用 Edge TTS
 */
export function setTTSConfig(config: Partial<TTSConfig>) {
  // 强制使用 Edge TTS，忽略任何其他配置
  currentConfig = { service: 'edge' };
  log.log(`TTS 配置已强制设置为 Edge TTS: ${JSON.stringify(currentConfig)}`);
}

/**
 * 获取当前 TTS 配置
 */
export function getTTSConfig(): TTSConfig {
  return { ...currentConfig };
}

/**
 * 统一的语音合成函数 - 强制使用 Edge TTS
 */
export async function generateAudio(params: any) {
  log.log(`强制使用 Edge TTS 服务`);
  log.log(`原始参数: ${JSON.stringify(params)}`);
  
  // 转换参数格式：阿里云格式 -> Edge TTS 格式
  const edgeParams = convertToEdgeTTSParams(params);
  log.log(`转换后的 Edge TTS 参数: ${JSON.stringify(edgeParams)}`);
  return await generateAudioWithEdgeTTS(edgeParams);
}

/**
 * 将阿里云 TTS 参数转换为 Edge TTS 参数
 */
function convertToEdgeTTSParams(params: any) {
  const edgeParams: any = {
    text: params.text,
    voice: params.voice || 'zh-CN-YunxiNeural', // 默认使用云希
    format: params.format || 'mp3',
    outputFileName: params.outputFileName,
    outputDir: params.outputDir
  };
  
  // 转换语速参数
  if (params.speech_rate !== undefined) {
    // 阿里云: -500 到 500，Edge TTS: -50% 到 +200%
    const rate = Math.round((params.speech_rate / 500) * 200);
    edgeParams.rate = `${rate >= 0 ? '+' : ''}${rate}%`;
  } else {
    edgeParams.rate = '+0%';
  }
  
  // 转换语调参数
  if (params.pitch_rate !== undefined) {
    // 阿里云: -500 到 500，Edge TTS: -50Hz 到 +50Hz
    const pitch = Math.round((params.pitch_rate / 500) * 50);
    edgeParams.pitch = `${pitch >= 0 ? '+' : ''}${pitch}Hz`;
  } else {
    edgeParams.pitch = '+0Hz';
  }
  
  // 转换音量参数
  if (params.volume !== undefined) {
    // 阿里云: 0 到 100，Edge TTS: -50% 到 +100%
    const volume = Math.round((params.volume - 50) * 2);
    edgeParams.volume = `${volume >= 0 ? '+' : ''}${volume}%`;
  } else {
    edgeParams.volume = '+0%';
  }
  
  return edgeParams;
}

/**
 * 获取可用的语音列表 - 返回固定的中文语音列表
 */
export function getAvailableVoices() {
  return CHINESE_VOICES;
}

/**
 * 初始化 TTS 管理器
 */
export function initTTSManager() {
  // 注册主要的语音合成接口
  ipcMain.handle('text2voice', async (event, paramsStr: string) => {
    const params = JSON.parse(decodeArg(paramsStr));
    log.log('TTS 管理器接收参数:');
    log.log(JSON.stringify(params));
    return generateAudio(params);
  });

  // 注册获取语音列表接口
  ipcMain.handle('get-available-voices', () => {
    return getAvailableVoices();
  });

  // 注册 TTS 配置管理接口
  ipcMain.handle('set-tts-config', async (event, configStr: string) => {
    const config = JSON.parse(decodeArg(configStr));
    setTTSConfig(config);
    return { success: true, config: getTTSConfig() };
  });

  ipcMain.handle('get-tts-config', async () => {
    return getTTSConfig();
  });

  log.log('TTS 管理器初始化完成');
}
