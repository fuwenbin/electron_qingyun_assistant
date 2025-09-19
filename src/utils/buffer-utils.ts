export function textToBase64(text: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(text).toString('base64');
  }
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch (e) {
    // 更兼容的方案
    const uint8Array = new TextEncoder().encode(text);
    let binary = '';
    uint8Array.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary);
  }
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64').buffer;
  }
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}