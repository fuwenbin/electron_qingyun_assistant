// TTS 服务统一导出 - 仅支持 Edge TTS
export { initTTSManager, setTTSConfig, getTTSConfig, generateAudio, getAvailableVoices } from './tts-manager';
export type { TTSServiceType, TTSConfig } from './tts-manager';

// Edge TTS 服务
export { generateAudioWithEdgeTTS, getAvailableVoices as getEdgeVoices, CHINESE_VOICES } from './edge-tts';
export type { EdgeTTSRequestParams } from './edge-tts';
