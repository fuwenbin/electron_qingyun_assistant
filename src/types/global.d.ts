declare global {
  interface Crypto {
    getRandomValues: <T extends ArrayBufferView | null>(buffer: T) => T;
    randomUUID: () => string;
    subtle: SubtleCrypto;
  }
  
  interface Window {
    crypto: Crypto;
  }
  
  namespace NodeJS {
    interface Global {
      crypto: Crypto;
    }
  }
}