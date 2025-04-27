// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { VideoCompositionOptions } from './common/types';
import { TTSRequestParams } from './services/aliyun-tts';
import { encodeArg } from './utils';
import crypto from 'crypto';

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type] as string)
  }
}) 

contextBridge.exposeInMainWorld('electronCrypto', {
  getRandomValues: (buffer: ArrayBufferView) => {
    return crypto.getRandomValues(buffer)
  },
  randomUUID: () => crypto.randomUUID()
})

contextBridge.exposeInMainWorld('electronAPI', {
  saveVideo: (arrayBuffer: ArrayBuffer) => 
    ipcRenderer.invoke('save-video-blob', arrayBuffer),
  
  removeAllListeners: (channel: string): void => {
    ipcRenderer.removeAllListeners(channel)
  },
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  openFile: (path: string) => ipcRenderer.invoke('open-file', path),
  
  onProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on('merge-progress', (_, progress) => callback(progress));
    return () => ipcRenderer.removeAllListeners('merge-progress');
  },

  mergeMedia: (params: {
    videoPaths: string[];
    audioPaths: string[];
    outputPath: string;
    audioVolumes?: number[];
  }) => ipcRenderer.invoke('merge-media', params),

  composeVideo: (options: VideoCompositionOptions) => ipcRenderer.invoke('compose-video', options),

  text2voice: (options: TTSRequestParams, outputDir: string) => ipcRenderer.invoke('text2voice', encodeArg(JSON.stringify({
    options,
    outputDir
  }))),
});