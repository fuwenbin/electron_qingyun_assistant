// src/utils/crypto-polyfill.ts
import { webcrypto } from 'crypto';

type WebCryptoArray = 
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array;

const subtlePolyfill: SubtleCrypto = {
  ...webcrypto.subtle,
  generateKey: async (algorithm: any, extractable: boolean, keyUsages: KeyUsage[]) => {
    return webcrypto.subtle.generateKey(algorithm, extractable, keyUsages) as any;
  },
} as SubtleCrypto;

export const electronCrypto: Crypto = {
  getRandomValues: <T extends ArrayBufferView | null>(buffer: T): T => {
    if (!buffer) return buffer;
    
    // 显式类型转换确保类型安全
    switch (true) {
      case buffer instanceof Int8Array:
        return webcrypto.getRandomValues(buffer as Int8Array) as unknown as T;
      case buffer instanceof Uint8Array:
        return webcrypto.getRandomValues(buffer as Uint8Array) as unknown as T;
      case buffer instanceof Uint8ClampedArray:
        return webcrypto.getRandomValues(buffer as Uint8ClampedArray) as unknown as T;
      case buffer instanceof Int16Array:
        return webcrypto.getRandomValues(buffer as Int16Array) as unknown as T;
      case buffer instanceof Uint16Array:
        return webcrypto.getRandomValues(buffer as Uint16Array) as unknown as T;
      case buffer instanceof Int32Array:
        return webcrypto.getRandomValues(buffer as Int32Array) as unknown as T;
      case buffer instanceof Uint32Array:
        return webcrypto.getRandomValues(buffer as Uint32Array) as unknown as T;
      default:
        throw new Error('Unsupported ArrayBufferView type');
    }
  },
  randomUUID: () => webcrypto.randomUUID(),
  subtle: subtlePolyfill
};