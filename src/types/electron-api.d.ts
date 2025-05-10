import { TTSRequestParams, TTSResponse } from '../electron/services/aliyun-tts';

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
      videoMixAndCut(params: any): Promise<any>;
      getMediaDuration(path: string): Promise<number>;
      openFileDialog(options: any): Promise<any>;
      readFile(filePath: string): Promise<ArrayBuffer>;
      readFileBase64(filePath: string): Promise<string>;
      getDefaultSavePath(): Promise<string>;
      genereateAssFile(params: any): Promise<any>;
    };
  }
}

export {};