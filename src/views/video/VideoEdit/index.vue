<template>
  <div class="video-edit">
    <!-- 顶部操作栏 -->
    <div class="edit-header">
      <div class="left-actions">
        <button class="btn-back" @click="goBack">
          <i class="fas fa-arrow-left"></i>
        </button>
        <a-button @click="saveVideo">保存到草稿</a-button>
      </div>
      <div class="center-action">
        <q-input v-model="videoTitle" borderless style="width: 200px;" placeholder="视频标题" />
      </div>
      <div class="right-actions">
        <div class="video-create-tip">
          <span>预计生成</span>
          <span>{{ estimateGenerateNum || '--' }}</span>
          <span>条</span>
          <span style="margin-left: 10px;">预计时长</span>
          <span>{{ estimateGenerateTime || '--' }}</span>
          <span>秒</span>
        </div>
        <a-button type="primary" @click="generateVideo">合成视频</a-button>
      </div>
    </div>

    <!-- 编辑区域 -->
    <div class="edit-area">
      <!-- 左侧面板 -->
      <div class="left-panel custom-scroll">
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
          <div class="clip-list">
            <div v-for="(clip, index) in state.clips" :key="index" class="clip-item">
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
                <div class="audio-chooser">
                  <input type="file" @change="handleAudioChange" />
                </div>
                <div class="clip-settings">
                  <div style="width: 70px;font-size:16px;">镜头配置</div>
                  <a-button @click="openZimuConfig(index)">字幕与配音</a-button>
                  <a-button @click="openTitleConfig(index)">文字标题</a-button>
                  <a-button>素材原始时长</a-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧面板 -->
      <div class="right-panel custom-scroll">
        <GlobalConfig v-if="selectedRightConfigIndex === ''" 
          v-model="globalConfig" :closeable="false"
          @changeConfigIndex="(value) => selectedRightConfigIndex = value"/>
        <ZimuConfig v-if="selectedRightConfigIndex === `globalZimuConfig`" 
          :rootName="videoTitle" title="全局字幕与配音" v-model="globalConfig.zimuConfig" 
          @close="closeConfigPanel" />
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
import { onMounted, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import VideoChooser from '@/components/VideoChooser.vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import ZimuConfig from '@/components/video/ZimuConfig.vue'
import GlobalConfig from '@/components/video/GlobalConfig.vue'
import VideoTitleConfig from '@/components/video/VideoTitleConfig.vue'

const router = useRouter()

// 状态
const videoTitle = ref('批量混剪_' + dayjs().format('YYYYMMDDHHmm'))
const estimateGenerateNum = ref(0)
const estimateGenerateTime = ref(0)
const state = reactive<any>({
  clips: []
})
const globalConfig = reactive<any>({
  ZimuConfig: undefined,
  titleConfig: undefined,
  backgroundMusic: undefined,
  videoRatio: '9:16',
  videoResolution: '1080x1920'
})
const selectedRightConfigIndex = ref('')
const audioFile = ref<File>();
const handleAudioChange = (e: any) => {
  audioFile.value = e.target.files[0]
}
let clipNo = 0;

const editClipName = (index: number) => {
  state.clips.value[index].isNameEditing = true
}

// 方法
const goBack = () => {
  router.back()
}

const saveVideo = () => {
  console.log('保存视频')
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

const checkZimuConfig = (clips: any) => {
  let isZimuConfigOk = true;
  for(const clip of clips) {
    if (!(clip.zimuConfig && clip.zimuConfig.datas[0].path)) {
      isZimuConfigOk = false;
      message.error('请先为镜头【' + clip.name + '】合成配音')
      break;
    }
  }
  return isZimuConfigOk;
}

const generateVideo = async () => {
  if (state.clips.length === 0) {
    message.error('请至少添加一个镜头')
    return
  }
  if (!checkVideoList(state.clips)) {
    return;
  }
  if (!checkZimuConfig(state.clips)) {
    return;
  }
  try {
    console.log('开始合成视频')
    const params = JSON.parse(JSON.stringify({
      globalConfig: globalConfig,
      clips: state.clips,
      outputFileName: videoTitle.value,
    }))
    console.log(params)
    const result = await window.electronAPI.videoMixAndCut(params);
    console.log(result);
    message.success('合成视频成功')
  } catch (error: any) {
    console.log(error)
    message.error('合成视频失败：' + error.message)
  } finally {
    console.log('合成视频结束')
  }
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

addClip();
onMounted(async () => {
  // do nothing
});
</script>

<style lang="scss" scoped>
@use './index.scss' as *;
</style> 