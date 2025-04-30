import ffmpeg from 'fluent-ffmpeg'
// import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import path from 'path'
import { getDurationWithFfmpeg, getFontPath, hasAudio } from '../utils/ffmpeg-utils'
import { ensureAppDataSaveDir } from './default-save-path'
import { ipcMain } from 'electron'
import { decodeArg } from '../utils'
import log from 'electron-log';
import { generateSrtFile } from '../utils/ffmpeg-utils'

// 设置ffmpeg路径
// ffmpeg.setFfmpegPath(ffmpegInstaller.path)


// 处理单个视频分段
async function processSegment(segment: any): Promise<void>  {
  const { videoPath, audioPath, isOpenOriginAudio, startTime, currentDuration, outputPath, subtitles, 
    subtitlePath, titleConfig, videoWidth, videoHeight } = segment;

  return new Promise(async (resolve, reject) => {

    // 生成临时字幕文件
    const srtPath = subtitlePath;
    generateSrtFile(srtPath, subtitles);
    
    const command = ffmpeg()
      .input(videoPath)
      .input(audioPath);

    // 处理路径中的特殊字符
    const escapedVideoPath = videoPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    const escapedAudioPath = audioPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    const escapedSrtPath = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    const escapedOutputPath = outputPath.replace(/\\/g, '/').replace(/:/g, '\\:');

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
    
    // 添加标题滤镜
    if (titleConfig) {
      const titleDuration = titleConfig.duration || currentDuration;
      const positionMap = {
        top: '10',
        middle: '(h-text_h)/2',
        bottom: 'h-text_h-10'
      };
      // 处理字体路径
      const fontPath = await getFontPath('arial.ttf');
      
      videoFilters.push({
        filter: 'drawtext',
        options: {
          text: titleConfig.text,
          fontfile: fontPath, // 确保字体文件存在或使用系统字体
          fontsize: titleConfig.fontSize || 36,
          fontcolor: titleConfig.fontColor || 'white',
          x: '(w-text_w)/2', // 水平居中
          y: positionMap[titleConfig.position || 'top'],
          shadowcolor: 'black',
          shadowx: 2,
          shadowy: 2,
          enable: `between(t,0,${titleDuration})`
        },
        inputs: 'padded_video',
        outputs: 'video_with_title'
      });
    } else {
      videoFilters.push({
        filter: 'null',
        inputs: 'padded_video',
        outputs: 'video_with_title'
      });
    }
    
    // 添加字幕滤镜
    const subtitleFilter = titleConfig ? 
        `[video_with_title]subtitles='${escapedSrtPath}':force_style='Fontsize=36,PrimaryColour=&HFFFFFF&'[video_with_subtitles]` :
        `[padded_video]subtitles='${escapedSrtPath}':force_style='Fontsize=36,PrimaryColour=&HFFFFFF&'[video_with_subtitles]`;
      
      videoFilters.push(subtitleFilter);
    
    // 音频滤镜链
    const audioFilters = [];
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
        '-preset fast'
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
  // 获取字幕列表
  const subtitles = clip.zimuConfig.datas.map(v => ({
    text: v.text,
    start: 0,
    duration: audioDuration
  }));
  // 获取字幕文件路径
  const subtitlePath = path.join(outputDir, `${outputFileName}_${clip.name}_subtitles.srt`);
  // 获取标题配置
  const titleConfig = clip.videoTitleConfig.datas[0];
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
        subtitles: subtitles,
        subtitlePath: subtitlePath,
        titleConfig: titleConfig,
        videoWidth: videoWidth,
        videoHeight: videoHeight
      })
    }
  }
  return clipSegments;
}

async function concatVideos(videos: string[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = ffmpeg()
    
    // 添加所有输入视频
    videos.forEach(video => {
      command.input(video)
    })

    const filterComplex = [];

    for (let i = 0; i < videos.length; i++) {
      filterComplex.push(`[${i}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`);
      filterComplex.push(`[${i}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a${i}]`);
    }
    const concatInput = videos.map((_, i) => `[v${i}][a${i}]`).join('')
    filterComplex.push(`${concatInput} concat=n=${videos.length}:v=1:a=1[v][a]`);

    command
      .complexFilter(filterComplex)
      .outputOptions([
        '-map [v]', // 映射视频流
        '-map [a]', // 映射音频流
        '-c:v libx264', // 重新编码视频
        '-preset fast',
        '-crf 23',
        '-c:a aac',     // 重新编码音频
        '-b:a 128k',
        '-movflags +faststart' //便于网络播放
      ])
      .on('start', (cmd) => console.log('执行命令:', cmd))
      .on('progress', (progress) => console.log(`处理进度: ${Math.round(progress.percent)}%`))
      .on('end', resolve)
      .on('error', reject)
      .save(outputPath)
  })
}

async function processVideoClipList(params) {
  log.log('accept params：')
  log.log(JSON.stringify(params));
  const clipList = params.clips;
  const outputFileName = params.outputFileName;
  const outputDir = params.outputDir ?? ensureAppDataSaveDir();
  const globalConfig = params.globalConfig;
  for (const clip of clipList) {
    // 单镜头分片
    clip.segments = await splitClipToSegments(clip, outputDir, outputFileName, globalConfig);
  }
  log.log('split clip to segments done：')
  log.log(JSON.stringify(clipList));
  // 分片并发处理
  const segments = [];
  for (const clip of clipList) {
    segments.push(...clip.segments);
  }
  log.info('segments:')
  log.info(JSON.stringify(segments));
  const segmentProcessPromiseList = segments.map(segment => {
    return processSegment(segment);
  })
  await Promise.all(segmentProcessPromiseList);
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
  const outputSegmentList = [];
  for (let i = 0; i < segmentMinCount; i++) {
    const segmentsForOutput = [];
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
  log.log('concat videos start')
  log.log(JSON.stringify(outputSegmentList));
  const outputPromiseList = outputSegmentList.map(segments => {
    return concatVideos(segments.videos, segments.outputPath);
  })
  await Promise.all(outputPromiseList);
  
  log.log('concat videos done：')
  log.log(JSON.stringify(outputSegmentList));
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

