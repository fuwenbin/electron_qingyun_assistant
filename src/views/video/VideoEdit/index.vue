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

    <q-separator />

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
          <div class="clip-list">
            <div v-for="(clip, index) in clips" :key="index" class="clip-item">
              <div class="clip-header">
                <div v-if="clip.isNameEditing" class="clip-header-editing">
                  <q-input autofocus v-model="clip.name" class="clip-name-input" style="width: 100%;" 
                    @blur="() => clip.isNameEditing = false"/>
                </div>
                <div v-else class="clip-header-static">
                  <div class="clip-header-left">
                    <span class="clip-title">{{ clip.name }}</span>
                    <q-icon name="edit" class="clip-edit-icon" 
                      @click="editClipName(index)" />
                    <span style="margin-left: 10px;">素材数量：{{ clip.fileList.length }}</span>
                  </div>
                  <div class="clip-header-right-actions">
                    <q-icon v-if="clip.useOriginVoice" name="mic" class="action-item mic-active"
                      @click="clip.useOriginVoice = false" />
                    <q-icon v-else name="mic_off" class="action-item" 
                      @click="clip.useOriginVoice = true" />
                    <q-icon v-show="clips.length > 1" name="delete" class="action-item" @click="deleteClip(index)" />
                  </div>
                </div>
                
              </div>
              <div class="clip-content">
                <div class="clip-file-list">
                  <VideoChooser v-model="clip.fileList" />
                </div>
                <div class="audio-chooser">
                  <input type="file" @change="handleAudioChange" />
                </div>
                <div class="clip-settings">
                  <div style="width: 70px;font-size:16px;">镜头配置</div>
                  <a-button>字幕与配音</a-button>
                  <a-button>文字标题</a-button>
                  <a-button>素材原始时长</a-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧面板 -->
      <div class="right-panel">
        <div class="panel-section">
          <h3 class="section-title">全局设置</h3>
          <div class="settings-list">
            <div class="setting-item">
              <label>视频比例</label>
              <div class="ratio-options">
                <q-btn
                  v-for="ratio in ratioOptions"
                  :key="ratio.value"
                  :label="ratio.label"
                  :color="aspectRatio === ratio.value ? 'primary' : 'grey-7'"
                  :flat="aspectRatio !== ratio.value"
                  @click="aspectRatio = ratio.value"
                />
              </div>
            </div>
            <div class="setting-item">
              <label>分辨率</label>
              <q-select
                v-model="resolution"
                :options="resolutionOptions"
                dense
              />
            </div>
            <div class="setting-item">
              <label>背景音乐</label>
              <q-select
                v-model="backgroundMusic"
                :options="musicOptions"
                dense
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { VideoClipConfig } from '@/types/video'
import VideoChooser from '@/components/VideoChooser.vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { VideoMerger } from '@/services/video-service'
const router = useRouter()

// 状态
const aspectRatio = ref('16:9')
const resolution = ref('1080p')
const backgroundMusic = ref('none')
const videoTitle = ref('批量混剪_' + dayjs().format('YYYY_MM_DD_HH_mm'))
const estimateGenerateNum = ref(0)
const estimateGenerateTime = ref(0)
const clips = ref<VideoClipConfig[]>([
  {
    name: '镜头1',
    isNameEditing: false,
    useOriginVoice: true,
    fileList: [],
    zimuConfig: undefined,
    videoTitleConfig: undefined,
    videoDurationConfig: {
      type: 'origin',
      duration: undefined
    },
    transitionFromLastClipConfig: undefined
  }
])
const audioFile = ref<File>();
const handleAudioChange = (e: any) => {
  audioFile.value = e.target.files[0]
}

// 选项数据
const ratioOptions = [
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '1:1', value: '1:1' }
]

const resolutionOptions = [
  { label: '1080p', value: '1080p' },
  { label: '720p', value: '720p' },
  { label: '480p', value: '480p' }
]

const transitionOptions = [
  { label: '无', value: 'none' },
  { label: '淡入淡出', value: 'fade' },
  { label: '滑动', value: 'slide' }
]

const musicOptions = [
  { label: '无', value: 'none' },
  { label: '欢快', value: 'upbeat' },
  { label: '轻松', value: 'relaxing' },
  { label: '史诗', value: 'epic' }
]

const editClipName = (index: number) => {
  clips.value[index].isNameEditing = true
}

// 方法
const goBack = () => {
  router.back()
}

const saveVideo = () => {
  console.log('保存视频')
}

const generateVideo = async () => {
  if (clips.value.length === 0) {
    message.error('请至少添加一个镜头')
    return
  }
  const videoFiles = clips.value[0].fileList;
  const videoMerger = new VideoMerger();
  console.log(12222)
  const result = await videoMerger.mergeVideosWithAudio(videoFiles, audioFile.value)
  console.log(result);
  await window.electronAPI.saveVideo(result.output);
  console.log('合成视频')
}

const addClip = () => {
  clips.value.push({
    name: '镜头' + (clips.value.length + 1),
    isNameEditing: false,
    useOriginVoice: true,
    fileList: [],
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
  clips.value.splice(index, 1)
}

const previewClip = (clip: any) => {
  console.log('预览片段', clip)
}
</script>

<style lang="scss" scoped>
@use './index.scss' as *;
</style> 