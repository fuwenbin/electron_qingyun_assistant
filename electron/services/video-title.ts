export function generateTitleFilterOPtions(text, fontPath, textConfig: any, start, duration) {
  const positionMap = {
    top: '10',
    middle: '(h-text_h)/2',
    bottom: 'h-text_h-10'
  };
  const alignMap = {
    left: '10',
    center: '(w-text_w)/2',
    right: 'w-text_w-10'
  };
  const options: any ={
    text: text,
    fontfile: fontPath, // 确保字体文件存在或使用系统字体
    fontsize: textConfig.fontSize || 36,
    fontcolor: (textConfig.fontColor && `0x${textConfig.fontColor.replace('#', '')}`) || 'white',
    x: alignMap[textConfig.textAlign || 'center'],
    y: positionMap[textConfig.position || 'top'],
    shadowcolor: 'black',
    shadowx: 2,
    shadowy: 2,
  }
  if (textConfig.customStyle === 'custom-style-1') {
    options.bordercolor = '0x1A1A1A';
    options.borderw = 1;
    options.fontcolor = '0xffffff';
  } else if (textConfig.customStyle === 'custom-style-2') {
    options.bordercolor = '0x1A1A1A';
    options.borderw = 1;
    options.fontcolor = '0x627EE9';
  } else if (textConfig.customStyle === 'custom-style-3') {
    options.bordercolor = '0x1A1A1A';
    options.borderw = 1;
    options.fontcolor = '0x1A1A1A';
  } else if (textConfig.customStyle === 'custom-style-4') {
    options.bordercolor = '0xB463FE';
    options.borderw = 1;
    options.fontcolor = '0xB463FE';
  } else if (textConfig.customStyle === 'custom-style-5') {
    options.bordercolor = '0xFF9C20';
    options.borderw = 1;
    options.fontcolor = '0xFF9C20';
  } else if (textConfig.customStyle === 'custom-style-6') {
    options.bordercolor = '0x2278FF';
    options.borderw = 1;
    options.fontcolor = '0x2278FF';
  } else if (textConfig.customStyle === 'custom-style-7') {
    options.bordercolor = '0x1A1A1A';
    options.borderw = 1;
    options.fontcolor = '0x1A1A1A';
    options.box = 1;
    options.boxcolor = '0xFFE306';
  } else if (textConfig.customStyle === 'custom-style-8') {
    options.bordercolor = '0x1A1A1A';
    options.borderw = 1;
    options.fontcolor = '0xFAF5B0';
  } else if (textConfig.customStyle === 'custom-style-9') {
    options.bordercolor = '0x1A1A1A';
    options.borderw = 1;
    options.fontcolor = '0xFF9C20';
  } else if (textConfig.customStyle === 'custom-style-10') {
    options.bordercolor = '0xF09CAF';
    options.borderw = 1;
    options.fontcolor = '0xffffff';
  } else if (textConfig.customStyle === 'custom-style-11') {
    options.bordercolor = '0xF86F32';
    options.borderw = 1;
    options.fontcolor = '0xFDDC63';
  }
  // 设置生效时间
  options.enable = `between(t,${start},${start + duration})`;
  return options;
}

