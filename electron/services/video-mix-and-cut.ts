import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import path from 'path'
import { getDurationWithFfmpeg } from '../utils/ffmpeg-utils'
import { ensureAppDataSaveDir } from './default-save-path'
import { randomUUID } from 'crypto'
import { ipcMain } from 'electron'
import { decodeArg } from '../utils'
import log from 'electron-log';

// 设置ffmpeg路径
// ffmpeg.setFfmpegPath(ffmpegInstaller.path)


// 处理单个视频分段
async function processSegment(
  videoPath: string,
  audioPath: string,
  isOpenVideoOriginAudio: boolean = true,
  startTime: number,
  segmentDuration: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    if (isOpenVideoOriginAudio) {
      command
      .input(videoPath)
      .input(audioPath)
      .inputOptions([
        `-ss ${startTime}`,
        `-t ${segmentDuration}`
      ])
      .outputOptions([
        '-map 0:v',      // 使用第一个输入的视频流
        '-map 1:a',      // 使用第二个输入的音频流
        '-c:v libx264',  // 视频编码
        '-c:a aac',      // 音频编码
        '-shortest'      // 以最短的输入流结束
      ])
    } else {
      command
      .input(videoPath)
      .inputOptions([
        `-ss ${startTime}`,
        `-t ${segmentDuration}`
      ])
      // 关闭视频原声 - 不映射原始音频流
      .outputOptions([
        '-map 0:v',      // 只映射视频流
        '-map 1:a',      // 映射新音频
        '-c:v libx264',  // 视频编码
        '-c:a aac',      // 音频编码
        '-shortest'      // 以最短的输入流结束
      ])
      .input(audioPath)  // 添加新音频
    }
    command
      .on('start', (commandLine) => {
        console.log('执行命令: ' + commandLine)
      })
      .on('progress', (progress) => {
        console.log(`处理中: ${Math.round(progress.percent)}%`)
      })
      .on('end', () => {
        console.log(`分段处理完成: ${outputPath}`)
        resolve()
      })
      .on('error', (err) => {
        console.error(`处理错误: ${err.message}`)
        reject(err)
      })
      .save(outputPath)
  })
}

async function splitClipToSegments(clip: any, outputDir: string, outputFileName: string) {
  const audio = clip.zimuConfig.datas[0]
  const audioPath = audio.path;
  const audioDuration = audio.duration ?? await getDurationWithFfmpeg(audioPath);
  const videoList = clip.videoList;
  const isOpenOriginAudio = clip.isOpenOriginAudio ?? true;
  const clipSegments: any[] = [];
  const tempBaseName = `${outputFileName}_t${Date.now()}_`;
  for (const video of videoList) {
    const videoPath = video.path;
    const videoDuration = video.duration ?? await getDurationWithFfmpeg(videoPath);
    const segmentDuration = audioDuration;
    const segmentCount = Math.ceil(videoDuration / segmentDuration)
    const baseName = tempBaseName +path.basename(videoPath, path.extname(videoPath))
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

    // 构建filter_complex参数
    let filter = ''
    const inputs = videos.map((_, i) => `[${i}:v] [${i}:a]`).join(' ')
    filter += `${inputs} concat=n=${videos.length}:v=1:a=1 [v] [a]`

    command
      .complexFilter([filter])
      .outputOptions([
        '-map [v]', // 映射视频流
        '-map [a]', // 映射音频流
        '-c:v libx264', // 重新编码视频
        '-c:a aac'     // 重新编码音频
      ])
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
  const batchNo = randomUUID().replace(/-/g, '');
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
  let segmentMinCount = 0;
  for (const clip of clipList) {
    if (clip.segments.length !== 1 && clip.segments.length < segmentMinCount) {
      segmentMinCount = clip.segments.length;
    }
  }
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
      outputPath: path.join(outputDir, `${outputFileName}_${i}.mp4`),
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

