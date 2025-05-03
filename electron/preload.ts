// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
import { contextBridge, ipcRenderer } from 'electron'
import { encodeArg } from './utils';
import crypto from 'crypto';
import fs from 'fs';

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

  getDefaultSavePath: () => ipcRenderer.invoke('get-default-save-path'),

  text2voice: (params: any) => ipcRenderer.invoke('text2voice', encodeArg(JSON.stringify(params))),

  videoMixAndCut: (params: any) => ipcRenderer.invoke('video-mix-and-cut', encodeArg(JSON.stringify(params))),

  openFileDialog: (options: any) => ipcRenderer.invoke('open-file-dialog', options),

  getMediaDuration: (path: string) => ipcRenderer.invoke('get-media-duration', encodeArg(JSON.stringify({
    path
  }))),

  readFile: (filePath: string) => {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  },

  readFileBase64: (filePath: string) => {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) reject(err);
        resolve(Buffer.from(data).toString('base64'));
      });
    });
  },
});