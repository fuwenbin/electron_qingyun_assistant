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

export function generateSubtitleStyleFromTextConfig(textConfig: any) {
  const alignmentMap = {
    'left': 1,
    'center': 2,
    'right': 3
  }
  const subtitleStyleObj = {
    ...defaultSubtitleStyle,
    ...{
      Fontname: textConfig.fontFamily || defaultSubtitleStyle.Fontname,
      Fontsize: textConfig.fontSize || defaultSubtitleStyle.Fontsize,
      PrimaryColour: (textConfig.fontColor && `&H${textConfig.fontColor.replace('#', '').toUpperCase()}&`) || defaultSubtitleStyle.PrimaryColour,
      Alignment: (textConfig.textAlign && alignmentMap[textConfig.textAlign]) || defaultSubtitleStyle.Alignment
    }
  }
  if (textConfig.customStyle === 'custom-style-1') {
    subtitleStyleObj.OutlineColour = '&H001A1A1A&';
    subtitleStyleObj.PrimaryColour = '&H00FFFFFF&';
    subtitleStyleObj.BorderStyle = 1;
    subtitleStyleObj.Outline = 1;
  } else if (textConfig.customStyle === 'custom-style-2') {
    subtitleStyleObj.OutlineColour = '&H001A1A1A&';
    subtitleStyleObj.PrimaryColour = '&H00627EE9&';
    subtitleStyleObj.BorderStyle = 1;
    subtitleStyleObj.Outline = 1;
  } else if (textConfig.customStyle === 'custom-style-3') {
    subtitleStyleObj.OutlineColour = '&H001A1A1A&';
    subtitleStyleObj.PrimaryColour = '&H001A1A1A&';
    subtitleStyleObj.BorderStyle = 1;
    subtitleStyleObj.Outline = 1;
  } else if (textConfig.customStyle === 'custom-style-4') {
    subtitleStyleObj.OutlineColour = '&H00B463FE&';
    subtitleStyleObj.PrimaryColour = '&H00B463FE&';
    subtitleStyleObj.BorderStyle = 1;
    subtitleStyleObj.Outline = 1;
  } else if (textConfig.customStyle === 'custom-style-5') {
    subtitleStyleObj.OutlineColour = '&H00FF9C20&';
    subtitleStyleObj.PrimaryColour = '&H00FF9C20&';
    subtitleStyleObj.BorderStyle = 1;
    subtitleStyleObj.Outline = 1;
  } else if (textConfig.customStyle === 'custom-style-6') {
    subtitleStyleObj.OutlineColour = '&H002278FF&';
    subtitleStyleObj.PrimaryColour = '&H002278FF&';
    subtitleStyleObj.BorderStyle = 1;
    subtitleStyleObj.Outline = 1;
  } else if (textConfig.customStyle === 'custom-style-7') {
    subtitleStyleObj.PrimaryColour = '&H001A1A1A&';
    subtitleStyleObj.BackColour = '&H00FFE306&';
    subtitleStyleObj.BorderStyle = 3;
    subtitleStyleObj.Outline = 1;
  } else if (textConfig.customStyle === 'custom-style-8') {
    subtitleStyleObj.OutlineColour = '&H001A1A1A&';
    subtitleStyleObj.PrimaryColour = '&H00FAF5B0&';
    subtitleStyleObj.BorderStyle = 1;
    subtitleStyleObj.Outline = 1;
  } else if (textConfig.customStyle === 'custom-style-9') {
    subtitleStyleObj.OutlineColour = '&H001A1A1A&';
    subtitleStyleObj.PrimaryColour = '&H00FF9C20&';
    subtitleStyleObj.BorderStyle = 1;
    subtitleStyleObj.Outline = 1;
  } else if (textConfig.customStyle === 'custom-style-10') {
    subtitleStyleObj.OutlineColour = '&H00F09CAF&';
    subtitleStyleObj.PrimaryColour = '&H00FFFFFF&';
    subtitleStyleObj.BorderStyle = 1;
    subtitleStyleObj.Outline = 1;
  } else if (textConfig.customStyle === 'custom-style-11') {
    subtitleStyleObj.OutlineColour = '&H00F86F32&';
    subtitleStyleObj.PrimaryColour = '&H00FDDC63&';
    subtitleStyleObj.BorderStyle = 1;
    subtitleStyleObj.Outline = 1;
  }
  
  return buildStyleString(subtitleStyleObj);
}