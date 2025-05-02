interface SubtitleStyle {
  Fontname?: string;
  Fontsize?: number;
  PrimaryColour?: string;
  SecondaryColour?: string;
  OutlineColour?: string;
  BackColour?: string;
  Bold?: number;
  Italic?: number;
  Underline?: number;
  StrikeOut?: number;
  ScaleX?: number;
  ScaleY?: number;
  Spacing?: number;
  Angle?: number;
  BorderStyle?: number;
  Outline?: number;
  Shadow?: number;
  Alignment?: number;
  MarginL?: number;
  MarginR?: number;
  MarginV?: number;
}

export function buildStyleString(style: SubtitleStyle): string {
  return Object.entries(style)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');
}

// 示例样式
export const defaultSubtitleStyle: SubtitleStyle = {
  Fontname: 'Microsoft YaHei',
  Fontsize: 36,
  PrimaryColour: '&H00FFFFFF&', // 白色不透明
  OutlineColour: '&H00000000&', // 黑色描边
  BackColour: '&H80000000&',    // 半透明黑色背景
  Bold: 0,
  Italic: 0,
  BorderStyle: 3,               // 背景框样式
  Outline: 1,                  // 描边宽度
  Shadow: 2,                   // 阴影深度
  Alignment: 2,                // 底部居中
  MarginL: 20,
  MarginR: 20,
  MarginV: 30
};

// 带背景框的字幕样式
export const boxStyle: SubtitleStyle = {
  Fontname: 'SimHei',
  Fontsize: 32,
  PrimaryColour: '&H00FFFFFF&',
  BackColour: '&H80000000&',
  BorderStyle: 3, // 背景框样式
  Outline: 0,
  Alignment: 2,
  MarginV: 40
};

// 描边字幕
export const outlineStyle: SubtitleStyle = {
  Fontname: 'Arial',
  Fontsize: 36,
  PrimaryColour: '&H00FFFFFF&',
  OutlineColour: '&H00000000&',
  BorderStyle: 1, // 描边样式
  Outline: 2,    // 描边宽度
  Shadow: 1,
  Alignment: 2
};

// 顶部对齐字幕
export const topStyle: SubtitleStyle = {
  Fontname: 'Microsoft YaHei',
  Fontsize: 28,
  PrimaryColour: '&H00FFFF00&', // 黄色
  OutlineColour: '&H00000000&',
  BorderStyle: 1,
  Outline: 1,
  Alignment: 8, // 顶部居中
  MarginV: 20
};