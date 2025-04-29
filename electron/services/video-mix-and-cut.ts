import ffmpeg from 'fluent-ffmpeg'
// import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import path from 'path'
import { getDurationWithFfmpeg, hasAudio } from '../utils/ffmpeg-utils'
import { ensureAppDataSaveDir } from './default-save-path'
import { ipcMain } from 'electron'
import { decodeArg } from '../utils'
import log from 'electron-log';
import { generateSrtFile } from '../utils/ffmpeg-utils'

// 设置ffmpeg路径
// ffmpeg.setFfmpegPath(ffmpegInstaller.path)




// 处理单个视频分段
async function processSegment(
  videoPath: string,
  audioPath: string,
  isOpenVideoOriginAudio: boolean = true,
  startTime: number,
  segmentDuration: number,
  outputPath: string,
  subtitles: any[]
): Promise<void> {
  return new Promise(async (resolve, reject) => {

    // 生成临时字幕文件
    const srtPath = path.join(path.dirname(outputPath), 'subtitles.srt');
    generateSrtFile(srtPath, subtitles);
    
    const command = ffmpeg()
      .input(videoPath)
      .input(audioPath);
    if (isOpenVideoOriginAudio && await hasAudio(videoPath)) {
      command
        .complexFilter([
          `[0:v]trim=start=${startTime}:duration=${segmentDuration},setpts=PTS-STARTPTS[v]`,
          `[0:a]atrim=start=${startTime}:duration=${segmentDuration},setpts=PTS-STARTPTS,volume=1.0[original]`,
          `[1:a]start=0:duration=${segmentDuration},asetpts=PTS-STARTPTS,volume=1.0[newaudio]`,
          `[original][newaudio]amix=inputs=2:duration=longest[a]`
        ])
        .outputOptions([
          '-map [v]',
          '-map [a]',
          '-c:v libx264',
          '-c:a aac'
        ])
    } else {
      command
        .complexFilter([
          `[0:v]trim=start=${startTime}:duration=${segmentDuration},setpts=PTS-STARTPTS[v]`,
          `[1:a]atrim=start=0:duration=${segmentDuration},asetpts=PTS-STARTPTS,volume=1.0[newaudio]`
        ])
        .outputOptions([
          '-map [v]',
          '-map [newaudio]',
          '-c:v libx264',
          '-c:a aac'
        ])
    }
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

async function splitClipToSegments(clip: any, outputDir: string, outputFileName: string) {
  const audio = clip.zimuConfig.datas[0]
  const audioPath = audio.path;
  let audioDuration = audio.duration ?? await getDurationWithFfmpeg(audioPath);
  audioDuration = Math.ceil(audioDuration * 100) / 100;
  const videoList = clip.videoList;
  const isOpenOriginAudio = clip.isOpenOriginAudio ?? true;
  const clipSegments: any[] = [];
  const tempBaseName = `${outputFileName}_${clip.name}_`;
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
  for (const clip of clipList) {
    // 单镜头分片
    clip.segments = await splitClipToSegments(clip, outputDir, outputFileName);
  }
  log.log('split clip to segments done：')
  log.log(JSON.stringify(clipList));
  // 分片并发处理
  const segments = clipList.flatMap(clip => clip.segments);
  const segmentProcessPromiseList = segments.map(segment => {
    return processSegment(segment.videoPath, segment.audioPath, segment.isOpenOriginAudio, segment.startTime, segment.currentDuration, segment.outputPath);
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

