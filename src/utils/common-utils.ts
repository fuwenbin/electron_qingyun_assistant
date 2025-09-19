// 判断是否运行在 Electron 环境中
export const isElectron = () => {
  return window && window.process && window.process.type === 'renderer';
};


export function getImgBase64(img: Blob, callback: (base64Url: string) => void) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result as string));
  reader.readAsDataURL(img);
}

export function formatDuration(seconds: number, decimalPlaces = 2) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds - Math.floor(seconds)) * 10 * decimalPlaces);
  const tail = cs > 0 ? `.${cs.toString().padStart(decimalPlaces, '0')}` : '';
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}${tail}`;
}

export function formatShortDuration(seconds: number, decimalPlaces = 2) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds - Math.floor(seconds)) * 10 * decimalPlaces);
  const tail = cs > 0 ? `.${cs.toString().padStart(decimalPlaces, '0')}` : '';
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}${tail}`;
}