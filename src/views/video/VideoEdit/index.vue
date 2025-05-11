<template>
  <div class="video-edit">
    <!-- 顶部操作栏 -->
    <div class="edit-header">
      <div class="left-actions">
        <button class="btn-back" @click="goBack">
          <i class="fas fa-arrow-left"></i>
        </button>
      </div>
      <div class="center-action">
        <q-input v-model="videoTitle" borderless style="width: 200px;" placeholder="视频标题" />
      </div>
      <div class="right-actions">
        <div class="video-create-tip">
          <span>预计生成</span>
          <span>{{ estimateGenerateVideoNum || '--' }}</span>
          <span>条</span>
          <span style="margin-left: 10px;">预计时长</span>
          <span>{{ estimateGenerateVideoDurationForShow || '--' }}</span>
          <span>秒</span>
        </div>
        <a-button type="primary" @click="generateVideo" :loading="isGeneratingVideo">合成视频</a-button>
      </div>
    </div>

    <!-- 编辑区域 -->
    <div class="edit-area">
      <!-- 左侧面板 -->
      <div class="left-panel">
        <div class="panel-section">
          <div class="panel-header">
            <div class="left-actions">
              <h3 class="section-title">镜头配置</h3>
              <div class="title-description">配置每个镜头的素材、字母、文字等信息</div>
            </div>
            <div class="right-actions">
              <a-button type="primary" @click="addClip">
                <template #icon>
                  <PlusOutlined />
                </template>
                添加镜头
              </a-button>
            </div>
          </div>
          <div ref="clipListRef" class="clip-list custom-scroll">
            <div v-for="(clip, index) in state.clips" :key="index" class="clip-item" ref="clipListItemRefs">
              <div class="clip-header">
                <div v-if="clip.isNameEditing" class="clip-header-editing">
                  <q-input autofocus v-model="clip.name" class="clip-name-input" 
                    style="width: 100%;" 
                    @blur="() => clip.isNameEditing = false"/>
                </div>
                <div v-else class="clip-header-static">
                  <div class="clip-header-left">
                    <span class="clip-title">{{ clip.name }}</span>
                    <q-icon name="edit" class="clip-edit-icon" 
                      @click="editClipName(index)" />
                    <span style="margin-left: 10px;">素材数量：{{ clip.videoList.length }}</span>
                  </div>
                  <div class="clip-header-right-actions">
                    <q-icon v-if="clip.isOpenOriginAudio" name="mic" class="action-item mic-active"
                      @click="clip.isOpenOriginAudio = false" />
                    <q-icon v-else name="mic_off" class="action-item" 
                      @click="clip.isOpenOriginAudio = true" />
                    <q-icon v-show="state.clips.length > 1" name="delete" class="action-item" 
                      @click="deleteClip(index)" />
                  </div>
                </div>
                
              </div>
              <div class="clip-content">
                <div class="clip-file-list">
                  <VideoChooser v-model="clip.videoList" />
                </div>
                <div class="clip-settings">
                  <div style="width: 70px;font-size:16px;">镜头配置</div>
                  <a-button @click="openZimuConfig(index)">字幕与配音</a-button>
                  <a-button @click="openTitleConfig(index)">文字标题</a-button>
                  <a-button>素材原始时长</a-button>
                </div>
              </div>
            </div>
            <div class="clip-list-footer">
              <a-button size="large" class="btn-add-clip" @click="addClip">
                <template #icon>
                  <PlusOutlined />
                </template>
                添加镜头
              </a-button>
            </div>
          </div>
        </div>
      </div>
      <div class="center-panel">
        <VideoEditPreview :clips="state.clips" :global-config="state.globalConfig" 
          :selected-config-index="selectedRightConfigIndex"
          @change-zimu-position="changePreviewZimuPosition"
          @change-title-position="changePreviewTitlePosition"/>
      </div>

      <!-- 右侧面板 -->
      <div class="right-panel custom-scroll">
        <GlobalConfig v-if="selectedRightConfigIndex === ''" 
          v-model="state.globalConfig" :closeable="false"
          @changeConfigIndex="(value) => selectedRightConfigIndex = value"/>
        <ZimuConfig v-if="selectedRightConfigIndex === `globalZimuConfig`" 
          :rootName="videoTitle" title="全局配置" v-model="state.globalConfig.zimuConfig" 
          @close="closeConfigPanel" />
        <VideoTitleConfig v-if="selectedRightConfigIndex === `globalTitleConfig`" 
          :rootName="videoTitle" title="全局配置" v-model="state.globalConfig.titleConfig" 
          @close="closeConfigPanel" />
        <BackgroundAudioConfig v-if="selectedRightConfigIndex === `globalBackgroundAudioConfig`" 
          v-model="state.globalConfig.backgroundAudioConfig" 
          @close="closeConfigPanel"/>
        <template v-for="(clip, index) in state.clips" :key="clip.name">
          <ZimuConfig v-if="selectedRightConfigIndex === `zimu-${index}`" 
            :rootName="videoTitle" :title="clip.name" v-model="clip.zimuConfig" 
            @close="closeConfigPanel" />
          <VideoTitleConfig v-if="selectedRightConfigIndex === `title-${index}`" 
            :rootName="videoTitle" :title="clip.name" v-model="clip.videoTitleConfig" 
            @close="closeConfigPanel" />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import VideoChooser from '@/components/VideoChooser.vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import ZimuConfig from '@/components/video/ZimuConfig.vue'
import GlobalConfig from '@/components/video/GlobalConfig.vue'
import VideoTitleConfig from '@/components/video/VideoTitleConfig.vue'
import BackgroundAudioConfig from '@/components/video/BackgroundAudioConfig.vue'
import { formatDuration } from '@/utils/common-utils'
import VideoEditPreview from '@/components/video/VideoEditPreview.vue'

const router = useRouter()

// 状态
const videoTitle = ref('批量混剪_' + dayjs().format('YYYYMMDDHHmm'))
const state = reactive<any>({
  clips: [],
  globalConfig: {
    zimuConfig: undefined,
    titleConfig: undefined,
    backgroundAudioConfig: undefined,
    videoRatio: '9:16',
    videoResolution: '1080x1920',
    outputDir: undefined
  }
})
const clipListRef = ref();
const clipListItemRefs = ref<HTMLElement[]>([]);
const selectedRightConfigIndex = ref('')
let clipNo = 0;
const isGeneratingVideo = ref(false);
const estimateGenerateVideoNum = ref(0);
const estimateGenerateVideoDuration = ref(0);

const estimateGenerateVideoDurationForShow = computed(() => {
  if (estimateGenerateVideoDuration.value > 0) {
    return formatDuration(estimateGenerateVideoDuration.value, 0)
  } else {
    return ''
  }
})


const editClipName = (index: number) => {
  state.clips[index].isNameEditing = true
}

// 方法
const goBack = () => {
  router.back()
}

const checkVideoList = (clips: any) => {
  let isVideoListOk = true;
  for(const clip of clips) {
    if (clip.videoList.length === 0) {
      isVideoListOk = false;
      message.error('请先为镜头【' + clip.name + '】添加素材')
      break;
    }
  }
  return isVideoListOk;
}


const generateAudios = async () => {
  const outputDir = state.globalConfig.outputDir;
  for (let i = 0; i < state.clips.length; i++) {
    const clip = state.clips[i];
    const audio = clip.zimuConfig.datas[0];
    const audioConfig = clip.zimuConfig.audioConfig;
    const outputFileName = `${videoTitle.value}_${clip.name}_${audio.title}`
      const params = JSON.parse(JSON.stringify({
        text: audio.text,
        voice: audioConfig.voice,
        speech_rate: audioConfig.speech_rate,
        volume: audioConfig.volume,
        pitch_rate: audioConfig.pitch_rate,
        outputFileName: outputFileName,
        outputDir
      }))
      console.log('合成配音开始：');
      console.log(params);
      const generateRes = await window.electronAPI.text2voice(params);
      console.log('合成配音成功：');
      console.log(generateRes);
      state.clips[i].zimuConfig.datas[0].path = generateRes.outputFile;
      state.clips[i].zimuConfig.datas[0].duration = generateRes.duration;
  }
}

const generateAssFiles = async () => {
  const videoRatio = state.globalConfig.videoRatio;
  const videoResolution = state.globalConfig.videoResolution;
  const videoResolutionParts = videoResolution.split('x');
  const isVertical = videoRatio === '9:16';
  const videoWidth = isVertical ? videoResolutionParts[0] : videoResolutionParts[1];
  const videoHeight = isVertical ? videoResolutionParts[1] : videoResolutionParts[0];
  
  for (let i = 0; i < state.clips.length; i++) {
    const clip = state.clips[i];
    const outputPath = `${videoTitle.value}_${i + 1}.ass`;
    // 标题位置
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
      state.clips[i].videoTitleConfig.datas[0].posX = titlePosX;
      state.clips[i].videoTitleConfig.datas[0].posY = titlePosY;
    }
    // 字幕位置
    if (clip.zimuConfig?.textConfig) {
      let zimuPosX = videoWidth / 2;
      let zimuPosY =  clip.zimuConfig.textConfig.posYPercent * videoHeight;
      const zimuTextAlign = clip.zimuConfig?.textConfig.textAlign
      if (zimuTextAlign === 'left') {
        zimuPosX = 30;
      } else if (zimuTextAlign === 'right') {
        zimuPosX = videoWidth - 30;
      }
      state.clips[i].zimuConfig.posX = zimuPosX;
      state.clips[i].zimuConfig.posY = zimuPosY;
    }
    const params = JSON.parse(JSON.stringify({
      zimuConfig: clip.zimuConfig,
      videoTitleConfig: clip.videoTitleConfig,
      globalConfig: state.globalConfig,
      outputPath
    }))
    console.log('合成字幕文件开始');
    console.log(params);
    const res = await window.electronAPI.generateAssFile(params)
    console.log('合成字幕文件结束');
    state.clips[i].assFilePath = res;
  }
}

const checkZimuList = (clips: any[]) => {
  let isZimuListOk = true;
  for(const clip of clips) {
    if (!clip.zimuConfig?.datas[0].text) {
      isZimuListOk = false;
      message.error('请先为镜头【' + clip.name + '】添加字幕与配音')
      break;
    }
  }
  return isZimuListOk;
}

const checkGlobalConfig = (globalConfig: any) => {
  let isGlobalConfigOk = true;
  if (!globalConfig.outputDir) {
    message.error('请先选择文件存放路径')
    return false;
  }
  return isGlobalConfigOk;
}
const generateVideo = async () => {
  if (state.clips.length === 0) {
    message.error('请至少添加一个镜头')
    return
  }
  if (!checkVideoList(state.clips)) {
    return;
  }
  if (!checkZimuList(state.clips)) {
    return;
  }
  if (!checkGlobalConfig(state.globalConfig)) {
    return;
  }
  try {
    isGeneratingVideo.value = true;
    // 为没有合成配音的字幕合成配音
    await generateAudios();
    // 预估视频生成个数与时长
    estimateVideoResult();
    // 生成字幕与标题的ass文件
    await generateAssFiles();
    const params = JSON.parse(JSON.stringify({
      globalConfig: state.globalConfig,
      clips: state.clips,
      outputFileName: videoTitle.value,
    }))
    console.log('开始合成视频，参数：' + JSON.stringify(params));
    const result = await window.electronAPI.videoMixAndCut(params);
    message.success('合成视频成功')
    console.log('合成视频成功，结果：' + JSON.stringify(result));
  } catch (error: any) {
    console.log(error)
    message.error('合成视频失败：' + error.message)
  } finally {
    console.log('合成视频结束')
    isGeneratingVideo.value = false;
  }
}

const estimateVideoResult = () => {
  let totalDuration = 0;
  let totalNum = 0;
  for (let i = 0; i < state.clips.length; i++) {
    const clip = state.clips[i];
    const videoList = clip.videoList;
    const audioDuration = clip.zimuConfig.datas[0].duration;
    let segmentsNum = 0;
    for (let j = 0;j < videoList.length; j++) {
      const itemVideo = videoList[j];
      const itemVideoDuration = itemVideo.duration;
      segmentsNum += Math.ceil(itemVideoDuration / audioDuration);
    }
    if (totalNum === 0 || (segmentsNum > 1 && segmentsNum < totalNum)) {
      totalNum = segmentsNum;
    }
    totalDuration += audioDuration;
  }
  estimateGenerateVideoNum.value = totalNum;
  estimateGenerateVideoDuration.value = totalDuration;
}

const addClip = () => {
  state.clips.push({
    name: '镜头' + (++clipNo),
    isNameEditing: false,
    isOpenOriginAudio: true,
    videoList: [],
    zimuConfig: undefined,
    videoTitleConfig: undefined,
    videoDurationConfig: {
      type: 'origin',
      duration: undefined
    },
    transitionFromLastClipConfig: undefined
  })
  nextTick(() => {
    if (clipListItemRefs.value.length > 0) {
      const lastItemRef = clipListItemRefs.value[clipListItemRefs.value.length - 1];
      lastItemRef.scrollIntoView({
        behavior: 'smooth'
      });
    }
  })
}

const deleteClip = (index: number) => {
  state.clips.splice(index, 1)
}

const openZimuConfig = (index: number) => {
  selectedRightConfigIndex.value = `zimu-${index}`
  console.log(selectedRightConfigIndex.value)
}

const openTitleConfig = (index: number) => {  
  selectedRightConfigIndex.value = `title-${index}`
  console.log(selectedRightConfigIndex.value)
}

const closeConfigPanel = () => {
  selectedRightConfigIndex.value = ''
}

const getDefaultSavePath = async () => {
  const res = await window.electronAPI.getDefaultSavePath();
  state.globalConfig.outputDir = res;
}

const changePreviewZimuPosition = (value: number) => {
  const selectedClipIndex = Number(selectedRightConfigIndex.value.substring('zimu-'.length));
  state.clips[selectedClipIndex].zimuConfig.textConfig.posYPercent = value;
}

const changePreviewTitlePosition = (value: number) => {
  const selectedClipIndex = Number(selectedRightConfigIndex.value.substring('title-'.length));
  const selectedDataIndex = state.clips[selectedClipIndex].videoTitleConfig.selectedIndex;
  state.clips[selectedClipIndex].videoTitleConfig.datas[selectedDataIndex].textConfig.posYPercent = value;
}

addClip();
addClip();
getDefaultSavePath();
onMounted(async () => {
  
});
</script>

<style lang="scss" scoped>
@use './index.scss' as *;
</style> 