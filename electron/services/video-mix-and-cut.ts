import ffmpeg from 'fluent-ffmpeg'
// import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import path from 'path'
import { getDurationWithFfmpeg, getFontsdir, hasAudio } from '../utils/ffmpeg-utils'
import { getPlatformAppDataPath } from './default-save-path'
import { ipcMain } from 'electron'
import { decodeArg, escapedFilePath } from '../utils'
import log from 'electron-log';
import { generateAudio } from './aliyun-tts'
import dayjs from 'dayjs'
import { generateAssFile, generateAssFileContent, generateAssFromText } from './video-ass'
import pLimit from 'p-limit'
import fs from 'fs';

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
        original_size: `${videoWidth}x${videoHeight}`
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

async function splitClipToSegments(clip: any, outputDir: string, outputFileName: string, globalConfig: any) {
  // 获取视频宽高
  const videoRatio = globalConfig.videoRatio;
  const videoResolution = globalConfig.videoResolution;
  const videoResolutonPart = videoResolution.split('x').map(v => parseInt(v));
  const videoWidth = videoRatio === '9:16' ? videoResolutonPart[0] : videoResolutonPart[1];
  const videoHeight = videoRatio === '9:16' ? videoResolutonPart[1] : videoResolutonPart[0];
  // 获取音频
  const audio = clip.zimuConfig.datas[0]
  if (!audio.path) {
    // 如果还没有合成配音，则需要合成配音
    const audioConfig = clip.zimuConfig.audioConfig;
    const audioOutputFileName = `${outputFileName}_${clip.name}_${audio.title}_${dayjs().format('YYYYMMDDHHmmss')}`
    const generateAudioRes: any = await generateAudio({
      text: audio.text,
      voice: audioConfig.voice,
      speech_rate: audioConfig.speech_rate,
      volume: audioConfig.volume,
      pitch_rate: audioConfig.pitch_rate,
      outputFileName: audioOutputFileName
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
  const tempBaseName = `${outputFileName}_${clip.name}_`;
  // 获取字幕文件路径
  const assFilePath = path.join(outputDir, `${outputFileName}_${clip.name}.ass`);
  const assStyleList: string[] = [];
  const assDialogueList: string[] = [];
  // 生成字幕文件内容
  const selectedSubtitle = clip.zimuConfig.datas[0];
  const subtitlesContentList = generateAssFromText(selectedSubtitle.text, audioDuration, clip.zimuConfig.textConfig,
    videoWidth, videoHeight);
  assStyleList.push(...subtitlesContentList.map(v => v.style));
  assDialogueList.push(...subtitlesContentList.map(v => v.dialogue));

  if (clip.videoTitleConfig) {
    // 获取标题配置
    const titleConfig = clip.videoTitleConfig?.datas[0];
    // 生成标题文件内容
    const titleDuration = titleConfig.duration || audioDuration;
    const titleContent = generateAssFileContent(titleConfig.text, titleConfig.textConfig, titleConfig.start, 
      titleDuration, 'title', videoWidth, videoHeight, 'title');
    assStyleList.push(titleContent.style);
    assDialogueList.push(titleContent.dialogue);
  }
  
  generateAssFile(assFilePath, assStyleList, assDialogueList, videoWidth, videoHeight);
  for (const video of videoList) {
    const videoPath = video.path;
    const videoDuration = video.duration ?? await getDurationWithFfmpeg(videoPath);
    const segmentDuration = audioDuration;
    const segmentCount = Math.ceil(videoDuration / segmentDuration)
    const baseName = tempBaseName + path.basename(videoPath, path.extname(videoPath))
    for (let i = 0; i < segmentCount; i++) {
      const startTime = i * segmentDuration
      const remainingDuration = video.duration - startTime
      const currentDuration = Math.min(segmentDuration, remainingDuration)
      
      const outputPath = path.join(
        outputDir,
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

async function concatVideos(videos: string[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tempFilePath = path.basename(outputPath, path.extname(outputPath)) + "_temp.txt";
    fs.writeFileSync(tempFilePath, videos.map(v => `file '${v}'`).join('\n'));
    ffmpeg()
      .input(tempFilePath)
      .inputFormat('concat')
      .inputOptions(['-safe 0'])
      .outputOptions(['-c copy'])
      .on('start', (cmd) => console.log('执行命令:', cmd))
      .on('progress', (progress) => console.log(`处理进度: ${Math.round(progress.percent)}%`))
      .on('end', () => {
        fs.unlinkSync(tempFilePath);
        resolve();
      })
      .on('error', (err) => {
        fs.unlinkSync(tempFilePath);
        reject(err);
      })
      .save(outputPath)
  })
}

async function processVideoClipList(params) {
  log.log('accept params：')
  log.log(JSON.stringify(params));
  const clipList = params.clips;
  const outputFileName = params.outputFileName;
  const outputDir = params.outputDir ?? getPlatformAppDataPath();
  const globalConfig = params.globalConfig;
  for (const clip of clipList) {
    clip.segments = await splitClipToSegments(clip, outputDir, outputFileName, globalConfig);
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
  // 镜头合成
  let segmentMinCount = 1;
  for (const clip of clipList) {
    if (segmentMinCount === 1) {
      segmentMinCount = clip.segments.length;
    } else if (clip.segments.length > 1 && clip.segments.length < segmentMinCount) {
      segmentMinCount = clip.segments.length;
    }
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
      const concatPromise = concatVideos(segments.videos, segments.outputPath);
      await Promise.race([concatPromise, timeoutPromise]);
      log.log(`成功合成视频:${i + 1}/${outputSegmentList.length}`)
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

export function initVideoMixAndCut() {
  ipcMain.handle('video-mix-and-cut', async (event, paramsStr: string) => {
    const params = JSON.parse(decodeArg(paramsStr));
    return processVideoClipList(params);
  })

  ipcMain.handle('get-media-duration', async (event, paramsStr: string) => {
    const params = JSON.parse(decodeArg(paramsStr));
    return getDurationWithFfmpeg(params.path);
  })
}


