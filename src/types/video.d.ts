export interface VideoClipConfig {
  name: string;
  isNameEditing: boolean;
  fileList: File[];
  useOriginVoice: boolean;
  zimuConfig?: ZimuConfig;
  videoTitleConfig?: VideoTitleConfig;
  videoDurationConfig?: VideoDurationConfig;
  transitionFromLastClipConfig?: VideoClipTransitionConfig;
}

export interface VideoZimuConfig extends TextConfig {}

export interface VideoTitleConfig extends TextConfig {
  startAtMinutes: number;
  startAtSeconds: number;
  durationSeconds: number;
}

export interface VideoDurationConfig {
  type: 'origin' | 'fixed';
  duration?: number;
}

export interface VideoClipTransitionConfig {
  type: 'random' | 'custom';
  transitionList: string[];
}

export interface VideoBackgroundSoundConfig extends BackgroundSoundConfig {}
