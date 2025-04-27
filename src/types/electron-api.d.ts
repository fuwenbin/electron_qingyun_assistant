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
      mergeMedia(params: {
        videoPaths: string[];
        audioPaths: string[];
        outputPath: string;
        audioVolumes?: number[];
      }): Promise<string>;
      
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

      selectDirectory(): Promise<string | null>;
      
      openFile(path: string): Promise<void>;
      
      onProgress(callback: (progress: number) => void): () => void;
      text2voice(options: TTSRequestParams, outputDir: string): Promise<any>;
    };
  }
}

export {};