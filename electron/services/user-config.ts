import path from "path";
import { getPlatformAppDataPath } from "./default-save-path";
import fs from 'fs';

const configPath = path.join(getPlatformAppDataPath(), 'config.json');
const DEFAULT_CONFIG = { 
  lastOpenedDirectory: getPlatformAppDataPath() 
};

export function getAllConfig() {
  // 尝试读取上次存储的目录
  try {
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
    }
    const data = fs.readFileSync(configPath, 'utf-8');
    const parsedData = JSON.parse(data);
    return parsedData;
  } catch (err) {
    return undefined;
  }
}
export function getConfig(key: string) {
  const allConfig = getAllConfig();
  return getValueByPath(allConfig, key);
}

export function setConfig(key, value) {
  const allConfig = getAllConfig();
  setValueByPath(allConfig, key, value);
  fs.writeFileSync(configPath, JSON.stringify(allConfig, null, 2));
}

export function getLastOpenedDirectory() {
  let lastOpenedDirectory;
  try {
    lastOpenedDirectory = getConfig('lastOpenedDirectory');
    if (!lastOpenedDirectory && fs.existsSync(lastOpenedDirectory)) {
      return lastOpenedDirectory;
    }
  } catch (err) {
    return getPlatformAppDataPath();
  }
}

export function setLastOpenedDirectory(directory: string) {
  setConfig('lastOpenedDirectory', directory);
}

function getValueByPath(obj, path) {
  return path.split('.').reduce((o, key) => (o && o[key] !== undefined ? o[key] : undefined), obj);
}

function setValueByPath(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  // 遍历到倒数第二个 key，确保路径存在
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) {
      current[key] = {}; // 如果中间路径不存在，则创建空对象
    }
    current = current[key];
  }
  
  // 给最后一个 key 赋值
  current[keys[keys.length - 1]] = value;
}