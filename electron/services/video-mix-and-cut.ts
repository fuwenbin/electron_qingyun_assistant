import path from 'path'
import { getDurationWithFfmpeg, getFontsdir, hasAudio } from '../utils/ffmpeg-utils'
import { getPlatformAppDataPath, getVideoCachePath, clearVideoCache } from './default-save-path'
import { ipcMain } from 'electron'
import { decodeArg, escapedFilePath } from '../utils'
import log from 'electron-log';
import { generateAudio } from './ttsservice/tts-manager'
import { generateAssFileFromConfig } from './video-ass'
import dayjs from 'dayjs'
import pLimit from 'p-limit'
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg'

// 限制并发数为 CPU 核心数 -1（根据机器性能调整）
const limit = pLimit(Math.max(1, Math.floor(require('os').cpus().length * 0.8) - 1));

// 处理单个视频分段
async function processSegment(segment: any): Promise<void>  {
  const { videoPath, audioPath, isOpenOriginAudio, startTime, currentDuration, outputPath, 
    videoWidth, videoHeight, assFilePath } = segment;

  return new Promise(async (resolve, reject) => {
    
    const command = ffmpeg()
      .input(videoPath)
      .input(audioPath);

    // 基础视频滤镜链
    const videoFilters: any[] = [
      {
        filter: 'trim',
        options: {
          start: startTime,
          duration: currentDuration
        },
        inputs: '0:v',
        outputs: 'trimmed_video'
      },
      {
        filter: 'setpts',
        options: 'PTS-STARTPTS',
        inputs: 'trimmed_video',
        outputs: 'video_pts'
      },
      // 添加缩放滤镜
      {
        filter: 'scale',
        options: {
          w: videoWidth,
          h: videoHeight,
          // 保持宽高比，不足部分填充黑边
          force_original_aspect_ratio: 'decrease',
          eval: 'frame'
        },
        inputs: 'video_pts',
        outputs: 'scaled_video'
      },
      // 添加填充滤镜确保精确分辨率
      {
        filter: 'pad',
        options: {
          width: videoWidth,
          height: videoHeight,
          x: `(ow-iw)/2`,
          y: `(oh-ih)/2`,
          color: 'black'
        },
        inputs: 'scaled_video',
        outputs: 'padded_video'
      }
    ];
    
    const fontsdir = getFontsdir();
    videoFilters.push({
      filter: 'subtitles',
      options: {
        filename: `'${escapedFilePath(assFilePath)}'`,
        fontsdir: `'${escapedFilePath(fontsdir)}'`,
        original_size: `${videoWidth}x${videoHeight}`,
        stream_index: '0'
      },
      inputs: 'padded_video',
      outputs: 'video_with_subtitles'
    })
    // videoFilters.push(`[padded_video]ass=filename='${escapedFilePath(assFilePath)}':original_size=${videoWidth}:${videoHeight}[video_with_subtitles]`);
    
    // 音频滤镜链
    const audioFilters: any[] = [];
    let audioOutput = '';

    if (isOpenOriginAudio && await hasAudio(videoPath)) {
      audioFilters.push(
        {
          filter: 'atrim',
          options: {
            start: startTime,
            duration: currentDuration
          },
          inputs: '0:a',
          outputs: 'trimmed_original'
        },
        {
          filter: 'asetpts',
          options: 'PTS-STARTPTS',
          inputs: 'trimmed_original',
          outputs: 'original_pts'
        },
        {
          filter: 'volume',
          options: '1.0',
          inputs: 'original_pts',
          outputs: 'original_audio'
        },
        {
          filter: 'atrim',
          options: {
            start: 0,
            duration: currentDuration
          },
          inputs: '1:a',
          outputs: 'trimmed_new'
        },
        {
          filter: 'asetpts',
          options: 'PTS-STARTPTS',
          inputs: 'trimmed_new',
          outputs: 'new_pts'
        },
        {
          filter: 'volume',
          options: '1.0',
          inputs: 'new_pts',
          outputs: 'new_audio'
        },
        {
          filter: 'amix',
          options: {
            inputs: 2,
            duration: 'longest'
          },
          inputs: ['original_audio', 'new_audio'],
          outputs: 'mixed_audio'
        }
      );
      audioOutput = 'mixed_audio';
    } else {
      audioFilters.push(
        {
          filter: 'atrim',
          options: {
            start: 0,
            duration: currentDuration
          },
          inputs: '1:a',
          outputs: 'trimmed_new'
        },
        {
          filter: 'asetpts',
          options: 'PTS-STARTPTS',
          inputs: 'trimmed_new',
          outputs: 'new_pts'
        },
        {
          filter: 'volume',
          options: '1.0',
          inputs: 'new_pts',
          outputs: 'new_audio'
        }
      );
      audioOutput = 'new_audio';
    }
    
    command
      .complexFilter([...videoFilters, ...audioFilters])
      .outputOptions([
        '-map [video_with_subtitles]',
        `-map [${audioOutput}]`,
        '-c:v libx264',
        '-c:a aac',
        '-preset fast',
      ]);
    
    command
      .on('start', (commandLine) => {
        console.log('start to execute command: ' + commandLine)
      })
      .on('progress', (progress) => {
        console.log(`processing: ${Math.round(progress.percent)}%`)
      })
      .on('end', () => {
        console.log(`segment process done: ${outputPath}`)
        resolve()
      })
      .on('error', (err) => {
        console.error(`segment process error: ${err.message}`)
        reject(err)
      })
      .save(outputPath)
  })
}

async function splitClipToSegments(clip: any, cacheDir: string, outputFileName: string, globalConfig: any) {
  // 获取视频宽高
  const videoRatio = globalConfig.videoRatio;
  const videoResolution = globalConfig.videoResolution;
  const videoResolutonPart = videoResolution.split('x').map(v => parseInt(v));
  const videoWidth = videoRatio === '9:16' ? videoResolutonPart[0] : videoResolutonPart[1];
  const videoHeight = videoRatio === '9:16' ? videoResolutonPart[1] : videoResolutonPart[0];
  // 获取音频
  const audio = clip.zimuConfig.datas[0]
  if (!audio.path) {
    // 如果还没有合成配音，则需要合成配音（使用缓存路径）
    const audioConfig = clip.zimuConfig.audioConfig;
    // 使用纯英文文件名避免 FFmpeg 路径问题
    const audioOutputFileName = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const generateAudioRes: any = await generateAudio({
      text: audio.text,
      voice: audioConfig.voice,
      speech_rate: audioConfig.speech_rate,
      volume: audioConfig.volume,
      pitch_rate: audioConfig.pitch_rate,
      outputFileName: audioOutputFileName,
      outputDir: cacheDir  // 配音文件保存到缓存目录
    })
    audio.path = generateAudioRes.outputFile;
    audio.duration = generateAudioRes.duration;
  }
  const audioPath = audio.path;
  let audioDuration = audio.duration ?? await getDurationWithFfmpeg(audioPath);
  audioDuration = Math.ceil(audioDuration * 100) / 100;
  // 获取视频列表
  const videoList = clip.videoList;
  // 获取是否开启原声
  const isOpenOriginAudio = clip.isOpenOriginAudio ?? true;
  // 获取分段列表
  const clipSegments: any[] = [];
  // 使用纯英文文件名避免 FFmpeg 路径问题
  const tempBaseName = `segment_${Date.now()}_`;
  // 获取字幕文件路径
  const assFilePath = clip.assFilePath;
  for (const video of videoList) {
    const videoPath = video.path;
    const videoDuration = video.duration ?? await getDurationWithFfmpeg(videoPath);
    const segmentDuration = audioDuration;
    const segmentCount = Math.ceil(videoDuration / segmentDuration)
    // 使用简单的命名避免特殊字符
    const baseName = tempBaseName + Math.random().toString(36).substr(2, 9)
    for (let i = 0; i < segmentCount; i++) {
      const startTime = i * segmentDuration
      const remainingDuration = video.duration - startTime
      const currentDuration = Math.min(segmentDuration, remainingDuration)
      
      const outputPath = path.join(
        cacheDir,  // 分段视频保存到缓存目录
        `${baseName}_part${i + 1}_${startTime}-${startTime + currentDuration}.mp4`
      )
      clipSegments.push({
        videoPath: videoPath,
        audioPath: audioPath,
        outputPath: outputPath,
        startTime: startTime,
        currentDuration: currentDuration,
        isOpenOriginAudio: isOpenOriginAudio,
        videoWidth: videoWidth,
        videoHeight: videoHeight,
        assFilePath: assFilePath
      })
    }
  }
  return clipSegments;
}

/**
 * 为单个镜头生成字幕文件
 */
async function generateClipAssFile(clip: any, cacheDir: string, globalConfig: any) {
  
  const videoRatio = globalConfig.videoRatio;
  const videoResolution = globalConfig.videoResolution;
  const videoResolutionParts = videoResolution.split('x');
  const isVerticalVideo = videoRatio === '9:16';
  const videoWidth = isVerticalVideo ? videoResolutionParts[0] : videoResolutionParts[1];
  const videoHeight = isVerticalVideo ? videoResolutionParts[1] : videoResolutionParts[0];
  
  // 使用纯英文文件名
  const outputPath = `subtitle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.ass`;
  
  // 计算字幕位置
  if (clip.zimuConfig?.textConfig) {
    let zimuPosX = videoWidth / 2;
    let zimuPosY = clip.zimuConfig.textConfig.posYPercent * videoHeight;
    const zimuTextAlign = clip.zimuConfig?.textConfig.textAlign;
    if (zimuTextAlign === 'left') {
      zimuPosX = 30;
    } else if (zimuTextAlign === 'right') {
      zimuPosX = videoWidth - 30;
    }
    clip.zimuConfig.posX = zimuPosX;
    clip.zimuConfig.posY = zimuPosY;
  }
  
  // 计算标题位置
  if (clip.videoTitleConfig?.datas) {
    const selectedDataIndex = clip.videoTitleConfig.selectedIndex;
    let titlePosX = videoWidth / 2;
    const currentTextConfig = clip.videoTitleConfig.datas[selectedDataIndex].textConfig;
    let titlePosY = currentTextConfig.posYPercent * videoHeight;
    const titleTextAlign = clip.videoTitleConfig.datas[0].textConfig.textAlign;
    if (titleTextAlign === 'left') {
      titlePosX = 30;
    } else if (titleTextAlign === 'right') {
      titlePosX = videoWidth - 30;
    }
    clip.videoTitleConfig.datas[0].posX = titlePosX;
    clip.videoTitleConfig.datas[0].posY = titlePosY;
  }
  
  const assFilePath = generateAssFileFromConfig(
    clip.videoTitleConfig, 
    clip.zimuConfig, 
    { ...globalConfig, outputDir: cacheDir },
    outputPath
  );
  
  clip.assFilePath = assFilePath;
  log.log(`字幕文件已生成: ${assFilePath}`);
}

async function concatVideos(videos: string[], outputPath: string, onVideoMerged?: () => Promise<void>): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const outputExtName = path.extname(outputPath);
    const tempFilePath = outputPath.slice(0, outputPath.length - outputExtName.length) + "_temp.txt";
    log.log('生成临时文件：' + tempFilePath);
    fs.writeFileSync(tempFilePath, videos.map(v => `file '${v}'`).join('\n'));
    ffmpeg()
      .input(tempFilePath)
      .inputFormat('concat')
      .inputOptions(['-safe 0'])
      .outputOptions(['-c copy'])
      .on('start', (cmd) => console.log('执行命令:', cmd))
      .on('progress', (progress) => console.log(`处理进度: ${Math.round(progress.percent)}%`))
      .on('end', async () => {
        fs.unlinkSync(tempFilePath);
        
        // 如果提供了回调函数，在视频合并成功后调用
        if (onVideoMerged) {
          try {
            await onVideoMerged();
            log.log('视频合并成功，已扣除剪辑点数');
          } catch (error) {
            log.error('扣除剪辑点数失败:', error);
            // 不阻止视频合成完成，只记录错误
          }
        }
        
        resolve();
      })
      .on('error', (err) => {
        fs.unlinkSync(tempFilePath);
        reject(err);
      })
      .save(outputPath)
  })
}

async function processVideoClipList(params, event?: any) {
  log.log('accept params：')
  log.log(JSON.stringify(params));
  const clipList = params.clips;
  const outputFileName = params.outputFileName;
  const globalConfig = params.globalConfig;
  
  // 成品保存路径（用户可配置）
  const outputDir = globalConfig.outputDir || getPlatformAppDataPath();
  
  // 缓存路径（存放临时文件）
  const cacheDir = getVideoCachePath();
  
  // 清空缓存目录
  try {
    log.log('清空缓存目录...');
    clearVideoCache();
    log.log('缓存目录已清空');
  } catch (error) {
    log.error('清空缓存目录失败:', error);
  }
  
  // 生成字幕文件（在缓存清空之后）
  for (const clip of clipList) {
    await generateClipAssFile(clip, cacheDir, globalConfig);
  }
  
  for (const clip of clipList) {
    // 临时文件使用缓存路径
    clip.segments = await splitClipToSegments(clip, cacheDir, outputFileName, globalConfig);
  }
  log.log('split clip to segments done：')
  log.log(JSON.stringify(clipList));
  // 分片并发处理
  const segments: any[] = [];
  for (const clip of clipList) {
    segments.push(...clip.segments);
  }
  log.info('segments:')
  log.info(JSON.stringify(segments));
  const processPromiseList = segments.map(segment => limit(() =>processSegment(segment)));
  await Promise.all(processPromiseList);
  log.log('segment process done：')
  log.log(JSON.stringify(segments));
  // 镜头合成 - 取所有镜头中分段数的最小值
  let segmentMinCount = Infinity;
  for (const clip of clipList) {
    if (clip.segments && clip.segments.length > 0) {
      segmentMinCount = Math.min(segmentMinCount, clip.segments.length);
    }
  }
  // 如果没有有效的分段，设置为0
  if (segmentMinCount === Infinity) {
    segmentMinCount = 0;
  }
  log.log(`we can generate ${segmentMinCount} videos`)
  const outputSegmentList: any[] = [];
  for (let i = 0; i < segmentMinCount; i++) {
    const segmentsForOutput: any[] = [];
    let segmentsDurationSum = 0;
    for (const clip of clipList) {
      const segments = clip.segments;
      let currentSegment;
      if (segments.length === 1) {
        currentSegment = segments[0];
      } else {
        currentSegment = segments[i];
      }
      segmentsForOutput.push(currentSegment.outputPath);
      segmentsDurationSum += currentSegment.currentDuration;
    }
    outputSegmentList.push({
      videos: segmentsForOutput,
      outputPath: path.join(outputDir, `${outputFileName}_${i + 1}.mp4`),
      duration: segmentsDurationSum
    });
  }
  log.log('合成视频开始:')
  for (let i = 0; i < outputSegmentList.length; i++) {
    const segments = outputSegmentList[i];
    log.log(`开始合成视频: ${i + 1}/${outputSegmentList.length}, 视频路径：${outputSegmentList[i].outputPath}`);
    log.log(JSON.stringify(segments))
    try  {
      // 设置5分钟超时（300000毫秒）
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('视频合成操作超时（5分钟）'));
        }, 300000); // 5分钟 = 300000毫秒
      });
      // 创建扣除剪辑点数的回调函数
      const onVideoMerged = async () => {
        if (event) {
          // 通过 IPC 发送事件到前端，每个合并的视频扣除1个剪辑点数
          event.sender.send('deduct-edite-count', 1);
        }
      };
      
      const concatPromise = concatVideos(segments.videos, segments.outputPath, onVideoMerged);
      await Promise.race([concatPromise, timeoutPromise]);
      log.log(`成功合成视频:${i + 1}/${outputSegmentList.length}`)
      const backgroundAudioPath = globalConfig.backgroundAudioConfig?.audio.path;
      if (backgroundAudioPath && fs.existsSync(backgroundAudioPath)) {
        // 如果配置有背景音乐，则添加背景音乐
        const outputWithBgPath = path.join(outputDir, `${outputFileName}_${i + 1}_bg.mp4`)
        log.log(`开始为视频添加背景音乐:${segments.outputPath}`);
        await addBackgroundAudio(segments.outputPath, globalConfig.backgroundAudioConfig, outputWithBgPath);
        outputSegmentList[i].outputPath = outputWithBgPath;
      }
    } catch (error) {
      log.error(error);
      log.error(`合成视频失败:${i + 1}/${outputSegmentList.length}`);
    }
  }
  log.log('合成视频结束')
  return outputSegmentList.map(v => {
    return {
      outputPath: v.outputPath,
      duration: v.duration
    }
  });
}

function addBackgroundAudio(videoPath: string, audioConfig: any, outputPath: string) {
  return new Promise((resolve, reject) => {
    const audioPath = audioConfig.audio.path;
    const audioVolume = audioConfig.volume / 100;
    const command = ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .inputOptions(['-stream_loop -1']);
    const filters = [
      {
        filter: 'volume',
        options: audioVolume,
        inputs: '1:a',
        outputs: 'scaled_audio'
      },
      {
        filter: 'amix',
        options: {
          inputs: 2,
          duration: 'first'
        },
        inputs: ['0:a', 'scaled_audio'],
        outputs: ['mixed']
      }
    ];
    command.complexFilter(filters)
      .outputOptions([
        '-map 0:v', 
        '-map [mixed]',
        '-c:v copy',
        '-shortest'
      ])
      .on('start', (cmd) => console.log('开始添加背景音乐，执行命令:', cmd))
      .on('progress', (progress) => console.log(`处理进度: ${Math.round(progress.percent)}%`))
      .on('end', () => {
        console.log('背景音乐添加成功');
        fs.unlinkSync(videoPath);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('背景音乐添加失败:', err)
        reject(err);
      })
      .save(outputPath)
  })
}

export function initVideoMixAndCut() {
  ipcMain.handle('video-mix-and-cut', async (event, paramsStr: string) => {
    const params = JSON.parse(decodeArg(paramsStr));
    // 注册判断
    // const expireDay = dayjs('2025-08-14', 'YYYY-MM-DD');
    // if(dayjs().isAfter(expireDay)) {
    //   throw new Error('日期已失效');
    // }
    return processVideoClipList(params, event);
  })

  ipcMain.handle('get-media-duration', async (event, paramsStr: string) => {
    const params = JSON.parse(decodeArg(paramsStr));
    return getDurationWithFfmpeg(params.path);
  })
}


