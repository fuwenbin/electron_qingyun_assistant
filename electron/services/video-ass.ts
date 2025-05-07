import fs from 'fs';
import { getPlatformAppDataPath } from './default-save-path';
import path from 'path';

export function generateAssSubtitle(text: string, textConfig: any, start: number, duration: number, outputPath: string, 
  titleType: string, videoWidth: number, videoHeight: number) {
  const { fontFamily, fontSize, fontWeight, underline, italic, textAlign, customStyle } = textConfig;
  let fontColor = textConfig.fontColor.replace('#', '');
  let OutlineColour = '000000';
  let BackColour = '000000';
  let AlignmentMap = {
    'left': titleType === 'subtitles' ? 1 : 7,
    'center': titleType === 'subtitles' ? 2 : 8,
    'right': titleType === 'subtitles' ? 3 : 9
  }
  const isVertical = videoWidth < videoHeight;
  let MarginV = titleType === 'subtitles' ? 100 : 30
  if (!isVertical) {
    MarginV = titleType === 'subtitles' ? 10 : 0
  }
  const scrollSpeed = calculateOptimalSpeed(videoHeight, duration);
  const Effect = titleType === 'subtitles' ? 
      `Scroll up;${scrollSpeed}` : 
      '';
  let BorderStyle = 1;
  let Outline = 1;
  if (customStyle === 'custom-style-1') {
    Outline = 2;
    OutlineColour = '1A1A1A';
    fontColor = 'ffffff';
  } else if (customStyle === 'custom-style-2') {
    Outline = 2;
    OutlineColour = '1A1A1A';
    fontColor = '627EE9';
  } else if (customStyle === 'custom-style-3') {
    Outline = 2;
    OutlineColour = '1A1A1A';
    fontColor = '1A1A1A';
  } else if (customStyle === 'custom-style-4') {
    Outline = 2;
    OutlineColour = 'B463FE';
    fontColor = 'B463FE';
  } else if (customStyle === 'custom-style-5') {
    Outline = 2;
    OutlineColour = 'FF9C20';
    fontColor = 'FF9C20';
  } else if (customStyle === 'custom-style-6') {
    Outline = 2;
    OutlineColour = '2278FF';
    fontColor = '2278FF';
  } else if (customStyle === 'custom-style-7') {
    BorderStyle = 3;
    Outline = 2;
    OutlineColour = '1A1A1A';
    fontColor = '1A1A1A';
    BackColour = 'FFE306'
  } else if (customStyle === 'custom-style-8') {
    Outline = 2;
    OutlineColour = '1A1A1A';
    fontColor = 'FAF5B0';
  } else if (customStyle === 'custom-style-9') {
    Outline = 2;
    OutlineColour = '1A1A1A';
    fontColor = 'FF9C20';
  } else if (customStyle === 'custom-style-10') {
    Outline = 2;
    OutlineColour = 'F09CAF';
    fontColor = 'FFFFFF';
  } else if (customStyle === 'custom-style-11') {
    Outline = 2;
    OutlineColour = 'F86F32';
    fontColor = 'FDDC63';
  }
   // 确保PlayRes与视频分辨率比例一致
  const playResX = 384;
  const playResY = Math.round(playResX * (videoHeight / videoWidth));
  const assContent = `
[Script Info]
Title: Dynamic Subtitles
ScriptType: v4.00+
PlayResX: ${playResX}
PlayResY: ${playResY}
ScaledBorderAndShadow: yes
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,${fontSize},${rgbToAssColor(fontColor)},&H000000FF&,${rgbToAssColor(OutlineColour)},${rgbToAssColor(BackColour)},${fontWeight === 'bold' ? 1 : 0},${italic ? 1 : 0},${underline ? 1 : 0},0,100,100,0,0,${BorderStyle},${Outline},0,${AlignmentMap[textAlign]},30,30,${MarginV},0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,${formatTime(start)},${formatTime(start + duration)},Default,,0,0,0,${Effect},${text}
  `;
  const fullFilePath = path.join(getPlatformAppDataPath(), outputPath);
  fs.writeFileSync(fullFilePath, assContent.trim());
  return fullFilePath;
}

export function generateAssFileContent(text: string, textConfig: any, start: number, duration: number, 
  titleType: string, videoWidth: number, videoHeight: number, name: string) {
  const { fontFamily, fontSize, fontWeight, underline, italic, textAlign, customStyle } = textConfig;
  let fontColor = textConfig.fontColor.replace('#', '');
  let OutlineColour = '000000';
  let BackColour = '000000';
  let AlignmentMap = {
    'left': titleType === 'subtitles' ? 1 : 7,
    'center': titleType === 'subtitles' ? 2 : 8,
    'right': titleType === 'subtitles' ? 3 : 9
  }
  const isVertical = videoWidth < videoHeight;
  let MarginV = titleType === 'subtitles' ? 100 : 30
  if (!isVertical) {
    MarginV = titleType === 'subtitles' ? 10 : 0
  }
  const scrollSpeed = calculateOptimalSpeed(videoHeight, duration);
  const Effect = titleType === 'subtitles' ? 
      `Scroll up;${scrollSpeed}` : 
      '';
  let BorderStyle = 1;
  let Outline = 1;
  if (customStyle === 'custom-style-1') {
    Outline = 2;
    OutlineColour = '1A1A1A';
    fontColor = 'ffffff';
  } else if (customStyle === 'custom-style-2') {
    Outline = 2;
    OutlineColour = '1A1A1A';
    fontColor = '627EE9';
  } else if (customStyle === 'custom-style-3') {
    Outline = 2;
    OutlineColour = '1A1A1A';
    fontColor = '1A1A1A';
  } else if (customStyle === 'custom-style-4') {
    Outline = 2;
    OutlineColour = 'B463FE';
    fontColor = 'B463FE';
  } else if (customStyle === 'custom-style-5') {
    Outline = 2;
    OutlineColour = 'FF9C20';
    fontColor = 'FF9C20';
  } else if (customStyle === 'custom-style-6') {
    Outline = 2;
    OutlineColour = '2278FF';
    fontColor = '2278FF';
  } else if (customStyle === 'custom-style-7') {
    BorderStyle = 3;
    Outline = 2;
    OutlineColour = '1A1A1A';
    fontColor = '1A1A1A';
    BackColour = 'FFE306'
  } else if (customStyle === 'custom-style-8') {
    Outline = 2;
    OutlineColour = '1A1A1A';
    fontColor = 'FAF5B0';
  } else if (customStyle === 'custom-style-9') {
    Outline = 2;
    OutlineColour = '1A1A1A';
    fontColor = 'FF9C20';
  } else if (customStyle === 'custom-style-10') {
    Outline = 2;
    OutlineColour = 'F09CAF';
    fontColor = 'FFFFFF';
  } else if (customStyle === 'custom-style-11') {
    Outline = 2;
    OutlineColour = 'F86F32';
    fontColor = 'FDDC63';
  }
  // 确保PlayRes与视频分辨率比例一致
  const playResX = 384;
  const playResY = Math.round(playResX * (videoHeight / videoWidth));
  const assStyle = `Style: ${name || titleType},${'Arial'},${fontSize},${rgbToAssColor(fontColor)},&H000000FF&,${rgbToAssColor(OutlineColour)},${rgbToAssColor(BackColour)},${fontWeight === 'bold' ? 1 : 0},${italic ? 1 : 0},${underline ? 1 : 0},0,100,100,0,0,${BorderStyle},${Outline},0,${AlignmentMap[textAlign]},30,30,${MarginV},0`;
  const assDialogue = `Dialogue: 0,${formatTime(start)},${formatTime(start + duration)},${name || titleType},,0,0,0,${Effect},${text}`;
  return {
    style: assStyle,
    dialogue: assDialogue
  };
}

export function generateAssFile(outputPath: string, styleList: string[], dialogueList: string[], 
  videoWidth: number, videoHeight: number) {
  // 确保PlayRes与视频分辨率比例一致
  const playResX = 384;
  const playResY = Math.round(playResX * (videoHeight / videoWidth));
  const styleListContent = styleList.join('\n');
  const dialogueListContent = dialogueList.join('\n')
    const assContent = `
[Script Info]
Title: Dynamic Subtitles
ScriptType: v4.00+
PlayResX: ${playResX}
PlayResY: ${playResY}
ScaledBorderAndShadow: yes
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${styleListContent}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${dialogueListContent}
  `;
  fs.writeFileSync(outputPath, assContent.trim());
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds - Math.floor(seconds)) * 100);
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

function rgbToAssColor(rgb, alpha = '00') {
  const bbggrr = `${rgb.slice(4,6)}${rgb.slice(2,4)}${rgb.slice(0,2)}`;
  return `&H${alpha}${bbggrr}&`; // ASS 格式要求
}

function calculateOptimalSpeed(videoWidth: number, duration: number): number {
  // 假设我们希望字幕在持续时间结束时完全滚出屏幕
  return (videoWidth * 1.2) / duration;
}

export function generateAssFromText(text: string, duration: number, textConfig: any, videoWidth: number, videoHeight: number) {
  const sentences = splitTextToSentences(text);
  const segments = calculateSegments(sentences, duration);
  const result: any[] = [];
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const name = `subtitles-${i}`;
    const segmentDuration = segment.end - segment.start;
    const segmentContent = generateAssFileContent(segment.text, textConfig, segment.start, segmentDuration, 
      "subtitles", videoWidth, videoHeight, name);
    result.push({
      style: segmentContent.style,
      dialogue: segmentContent.dialogue
    })
  }
  return result;
}

/**
   * 将文本拆分为适合字幕显示的句子
   */
function splitTextToSentences(text: string): string[] {
  // 按标点符号拆分，但确保句子不会太长
  const sentences: string[] = [];
  const maxCharsPerLine = 30;
  const maxLines = 2;
  
  // 首先按标点符号拆分
  const roughSentences = text.split(/([。！？；\n])/).filter(s => s.trim());
  
  // 进一步拆分过长的句子
  for (let i = 0; i < roughSentences.length; i++) {
    let sentence = roughSentences[i];
    
    // 如果句子太长，按逗号或空格拆分
    if (sentence.length > maxCharsPerLine * maxLines) {
      const parts = sentence.split(/([,，])/).filter(s => s.trim());
      for (const part of parts) {
        if (part.length > maxCharsPerLine * maxLines) {
          // 如果部分仍然太长，按单词拆分
          const words = part.split(/\s+/);
          let currentLine = '';
          for (const word of words) {
            if (currentLine.length + word.length > maxCharsPerLine) {
              if (currentLine) sentences.push(currentLine);
              currentLine = word;
            } else {
              currentLine += (currentLine ? ' ' : '') + word;
            }
          }
          if (currentLine) sentences.push(currentLine);
        } else {
          sentences.push(part);
        }
      }
    } else {
      sentences.push(sentence);
    }
  }
  
  return sentences;
}

/**
   * 计算每个句子的开始和结束时间
   */
function calculateSegments(sentences: string[], totalDuration: number): any[] {
  const segments: any[] = [];
  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
  const charPerSecond = totalChars / totalDuration;
  
  let currentTime = 0;
  for (const sentence of sentences) {
    const duration = sentence.length / charPerSecond;
    const endTime = Math.min(currentTime + duration, totalDuration);
    
    segments.push({
      text: sentence,
      start: currentTime,
      end: endTime
    });
    
    currentTime = endTime;
    
    // 添加最小间隔
    if (currentTime < totalDuration) {
      currentTime += 0.2; // 200ms 间隔
    }
  }
  
  return segments;
}

