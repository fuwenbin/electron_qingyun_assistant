export interface VideoClip {
  path: string;
  startTime?: number; // 开始时间(秒)
  duration?: number;   // 持续时间(秒)
  volume?: number;     // 音量(0-1)
}

export interface AudioClip {
  path: string;
  startTime: number;   // 开始时间(秒)
  duration?: number;   // 持续时间(秒)
  volume?: number;     // 音量(0-1)
  loop?: boolean;      // 是否循环
}

export interface Subtitle {
  text: string;
  startTime: number;   // 开始时间(秒)
  duration: number;    // 持续时间(秒)
  style?: {
    font?: string;
    size?: number;
    color?: string;
    backgroundColor?: string;
    position?: 'top' | 'bottom' | 'middle';
  };
}

export interface VideoCompositionOptions {
  outputPath: string;
  width: number;
  height: number;
  fps: number;
  videoClips: VideoClip[];
  audioClips: AudioClip[];
  subtitles?: Subtitle[];
  backgroundColor?: string;
}