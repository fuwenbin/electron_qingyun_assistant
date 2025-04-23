// 判断是否运行在 Electron 环境中
export const isElectron = () => {
  return window && window.process && window.process.type === 'renderer';
};


export function getImgBase64(img: Blob, callback: (base64Url: string) => void) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result as string));
  reader.readAsDataURL(img);
}