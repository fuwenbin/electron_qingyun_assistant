import fs from 'fs';
import { ipcMain } from 'electron';
import { decodeArg } from '../utils';
import path from 'path';
import log from 'electron-log'
export function generateAssFileContent(text: string, textConfig: any, start: number, duration: number, 
  titleType: string, posX: number, posY: number, name: string, videoWidth: number, videoHeight: number) {
  const { fontFamily, fontSize, fontWeight, underline, italic, textAlign, customStyle } = textConfig;
  let fontColor = textConfig.fontColor.replace('#', '');
  let OutlineColour = '000000';
  let BackColour = '000000';
  let AlignmentMap = {
    'left': titleType === 'subtitles' ? 1 : 7,
    'center': titleType === 'subtitles' ? 2 : 8,
    'right': titleType === 'subtitles' ? 3 : 9
  }
  let BorderStyle = 1;
  let Outline = 2;
  let formattedFontSize = textConfig.fontSize;
  let formattedPosY = posY;
  const isVertical = videoWidth < videoHeight;
  if (isVertical) {
    formattedFontSize = textConfig.fontSize * (1 + 1080 / 1920 / 2);
  }
  formattedPosY = posY + formattedFontSize;
  if (customStyle === 'custom-style-1') {
    OutlineColour = '1A1A1A';
    fontColor = 'ffffff';
  } else if (customStyle === 'custom-style-2') {
    OutlineColour = '1A1A1A';
    fontColor = '627EE9';
  } else if (customStyle === 'custom-style-3') {
    OutlineColour = '1A1A1A';
    fontColor = '1A1A1A';
  } else if (customStyle === 'custom-style-4') {
    OutlineColour = 'B463FE';
    fontColor = 'B463FE';
  } else if (customStyle === 'custom-style-5') {
    OutlineColour = 'FF9C20';
    fontColor = 'FF9C20';
  } else if (customStyle === 'custom-style-6') {
    OutlineColour = '2278FF';
    fontColor = '2278FF';
  } else if (customStyle === 'custom-style-7') {
    BorderStyle = 3;
    fontColor = '1A1A1A';
    BackColour = 'FFE306';
    Outline = 4;
    OutlineColour = 'FFE306';
  } else if (customStyle === 'custom-style-8') {
    OutlineColour = '1A1A1A';
    fontColor = 'FAF5B0';
  } else if (customStyle === 'custom-style-9') {
    OutlineColour = '1A1A1A';
    fontColor = 'FF9C20';
  } else if (customStyle === 'custom-style-10') {
    OutlineColour = 'F09CAF';
    fontColor = 'FFFFFF';
  } else if (customStyle === 'custom-style-11') {
    OutlineColour = 'F86F32';
    fontColor = 'FDDC63';
  }
  const assStyle = `Style: ${name || titleType},${'Arial'},${formattedFontSize},${rgbToAssColor(fontColor)},&H000000FF&,${rgbToAssColor(OutlineColour)},${rgbToAssColor(BackColour, '80')},${fontWeight === 'bold' ? 1 : 0},${italic ? 1 : 0},${underline ? 1 : 0},0,100,100,0,0,${BorderStyle},${Outline},0,${AlignmentMap[textAlign]},0,0,0,0`;
  const assDialogue = `Dialogue: 0,${formatTime(start)},${formatTime(start + duration)},${name || titleType},,0,0,0,,{\\pos(${posX},${formattedPosY})}${text}`;
  return {
    style: assStyle,
    dialogue: assDialogue
  };
}

export function generateAssFile(outputPath: string, styleList: string[], dialogueList: string[], 
  videoWidth: number, videoHeight: number) {
  // 确保PlayRes与视频分辨率比例一致
  const playResX = videoWidth;
  const playResY = videoHeight;
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
  
  try {
    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`创建ASS文件目录: ${outputDir}`);
    }
    
    fs.writeFileSync(outputPath, assContent.trim());
    console.log(`ASS文件已生成: ${outputPath}`);
    
    // 验证文件是否真的存在
    if (!fs.existsSync(outputPath)) {
      throw new Error(`ASS文件生成后不存在: ${outputPath}`);
    }
  } catch (error) {
    console.error(`生成ASS文件失败: ${outputPath}`, error);
    throw error;
  }
  
  return outputPath;
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

export function generateAssFromText(text: string, duration: number, textConfig: any, posX: number, posY: number, videoWidth: number, videoHeight: number) {
  const sentences = splitTextToSentences(text, textConfig.fontSize);
  const segments = calculateSegments(sentences, duration);
  const result: any[] = [];
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const name = `subtitles-${i}`;
    const segmentDuration = segment.end - segment.start;
    const segmentContent = generateAssFileContent(segment.text, textConfig, segment.start, segmentDuration, 
      "subtitles", posX, posY, name, videoWidth, videoHeight);
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
function splitTextToSentences(text: string, fontSize: number): string[] {
  // 按标点符号拆分，但确保句子不会太长
  const sentences: string[] = [];
  const maxCharsPerLine = getMaxCharNumPerLine(fontSize);
  const maxLines = 1;
  const maxCharNum = maxCharsPerLine * maxLines;
  
  // 首先按标点符号拆分
  const roughSentences = text.split(/([。！？；\n])/).filter(s => s.trim());
  log.log('字幕分句结果：')
  log.log(JSON.stringify(roughSentences));
  
  // 进一步拆分过长的句子
  for (let i = 0; i < roughSentences.length; i++) {
    let sentence = roughSentences[i];
    
    // 如果句子太长，按逗号或空格拆分
    if (sentence.length > maxCharNum) {
      const parts = sentence.split(/([,，])/).filter(s => s.trim());
      for (const part of parts) {
        if (part.length > maxCharNum) {
          // 如果部分仍然太长，按单词拆分
          const words = part.split(/\s+/);
          log.log('句子分词结果：')
          log.log(JSON.stringify(words));
          let currentLine = '';
          for (const word of words) {
            if (currentLine.length + word.length > maxCharNum) {
              if (word.length === maxCharNum) {
                if (currentLine) {
                  sentences.push(currentLine);
                }
                sentences.push(word);
              } else {
                const needToSplitLine = currentLine + (currentLine ? ' ' : '') + word;
                for (let i = 0; i < needToSplitLine.length;) {
                  const endIndex = Math.min(i + maxCharNum, needToSplitLine.length);
                  if (endIndex < needToSplitLine.length) {
                    sentences.push(needToSplitLine.substring(i, endIndex));
                  } else {
                    currentLine = needToSplitLine.substring(i, endIndex);
                  }
                  i = endIndex;
                }
              }
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
  log.log('字幕分屏结果：')
  log.log(JSON.stringify(sentences))
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

function getMaxCharNumPerLine(fontSize: number) {
  const BASE_VIDEO_WIDTH = 1280;
  const maxCharNum = Math.floor(BASE_VIDEO_WIDTH / (fontSize * 0.6) / 2);
  return maxCharNum;
}

export function generateAssFileFromConfig(videoTitleConfig, zimuConfig, globalConfig, outputPath) {
  const videoRatio = globalConfig.videoRatio;
  const videoResolution = globalConfig.videoResolution;
  const videoResolutionParts = videoResolution.split('x');
  const isVerticalVideo = videoRatio === '9:16';
  const videoWidth = isVerticalVideo ? videoResolutionParts[0] : videoResolutionParts[1];
  const videoHeight = isVerticalVideo ? videoResolutionParts[1] : videoResolutionParts[0];
  const assFilePath = path.join(globalConfig.outputDir,  outputPath);
  console.log(assFilePath);
  console.log(outputPath);
  console.log(globalConfig.outputDir);
  // 获取字幕文件路径
  const assStyleList: string[] = [];
  const assDialogueList: string[] = [];
  // 生成字幕文件内容
  const selectedSubtitle = zimuConfig.datas[0];
  const audioDuration = zimuConfig.datas[0].duration;
  const subtitlesContentList = generateAssFromText(selectedSubtitle.text, audioDuration, zimuConfig.textConfig,
    zimuConfig.posX, zimuConfig.posY, videoWidth, videoHeight);
  assStyleList.push(...subtitlesContentList.map(v => v.style));
  assDialogueList.push(...subtitlesContentList.map(v => v.dialogue));
  if (videoTitleConfig) {
    // 获取标题配置
    const titleConfig = videoTitleConfig?.datas[0];
    // 生成标题文件内容
    const titleDuration = titleConfig.duration || audioDuration;
    // 标题分行
    const titleLines = splitTextToSentences(titleConfig.text, titleConfig.textConfig.fontSize);
    const formattedTitle = titleLines.join('\\n');
    const titleContent = generateAssFileContent(formattedTitle, titleConfig.textConfig, titleConfig.start, 
      titleDuration, 'title', titleConfig.posX, titleConfig.posY, 'title', videoWidth, videoHeight);
    assStyleList.push(titleContent.style);
    assDialogueList.push(titleContent.dialogue);
  }
  
  generateAssFile(assFilePath, assStyleList, assDialogueList, videoWidth, videoHeight);
  return assFilePath;
}

export function initVideoAss() {
  ipcMain.handle('generate-ass-file', async (_, paramsStr) => {
    const params = JSON.parse(decodeArg(paramsStr));
    return generateAssFileFromConfig(params.videoTitleConfig, params.zimuConfig, params.globalConfig, params.outputPath)
  });
}

