import { EdgeTTSRequestParams } from '../electron/services/ttsservice';

declare global {
  interface Window {
    electronAPI: {
      saveVideo: (arrayBuffer: ArrayBuffer) => Promise<{
        success: boolean;
        path?: string;
        error?: string;
      }>;
      invoke<T = any>(channel: string, ...args: any[]): Promise<T>;
      send(channel: string, ...args: any[]): void;
      on(channel: string, listener: (...args: any[]) => void): () => void;
      removeAllListeners(channel: string): void;
      
      showSaveDialog(options: {
        title?: string;
        defaultPath?: string;
        filters?: {
          name: string;
          extensions: string[];
        }[];
      }): Promise<{
        canceled: boolean;
        filePath?: string;
      }>;

      selectDirectory(options?: any): Promise<string | null>;
      
      openFile(path: string): Promise<void>;
      text2voice(params: any): Promise<any>;
      
      // TTS 管理接口
      getAvailableVoices(): Promise<Array<{label: string, value: string}>>;
      setTTSConfig(config: {service: 'edge'}): Promise<{success: boolean, config: any}>;
      getTTSConfig(): Promise<{service: 'edge'}>;
      
      videoMixAndCut(params: any): Promise<any>;
      getMediaDuration(path: string): Promise<number>;
      openFileDialog(options: any): Promise<any>;
      readFile(filePath: string): Promise<ArrayBuffer>;
      readFileBase64(filePath: string): Promise<string>;
      getDefaultSavePath(): Promise<string>;
      generateAssFile(params: any): Promise<any>;
      playwrightAction(params: any): Promise<any>;
      onPlatformLoginFinished(callback: Function): void;
      apiRequest(params: any): Promise<any>;
      getAppSettings(): Promise<any>;
      saveAppSettings(settings: any): Promise<void>;
      
      // 剪辑点数扣除相关接口
      onDeductEditeCount(callback: (cutCount: number) => void): void;
      removeDeductEditeCountListener(callback: (cutCount: number) => void): void;
      
      // 缓存路径相关接口
      getVideoCachePath(): Promise<string>;
      clearVideoCache(): Promise<void>;
    };
  }
}

export {};