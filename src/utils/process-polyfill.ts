// Process polyfill for browser environment
export const processPolyfill = {
  env: {
    ...import.meta.env
  },
  browser: true,
  nextTick: (callback: () => void) => {
    setTimeout(callback, 0);
  },
  versions: {
    node: '18.0.0'
  },
  platform: 'browser'
};

// Make it available globally if needed
if (typeof window !== 'undefined' && !window.process) {
  (window as any).process = processPolyfill;
}

export default processPolyfill;
