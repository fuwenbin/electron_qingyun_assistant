interface Window {
  electronAPI: {
    saveVideo: (arrayBuffer: ArrayBuffer) => Promise<{
      success: boolean;
      path?: string;
      error?: string;
    }>;
  };
}