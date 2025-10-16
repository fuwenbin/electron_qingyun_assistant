<template>
  <div class="video-edit">
    <!-- 顶部操作栏 -->
    <div class="edit-header">
      <div class="left-actions">
        <q-input 
          v-model="videoTitle" 
          style="width: 200px;" 
          placeholder="视频标题"
          clearable
          dense
          @blur="handleTitleBlur"
        />
      </div>
      <div class="right-actions">
        <div class="video-create-tip">
          <span>剩余剪辑点：</span>
          <span :style="{ color: currentEditeCount <= 0 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }">{{ currentEditeCount }}</span>
          <span style="margin-left: 15px;">预计合成</span>
          <span :style="{ color: estimateGenerateVideoNum > currentEditeCount ? '#ff4d4f' : 'inherit' }">{{ estimateGenerateVideoNum || '--' }}</span>
          <span>条</span>
          <a-tooltip v-if="isEstimatedDuration" title="时长为估算值，实际时长以合成配音后为准">
            <span style="margin-left: 10px; color: #faad14;">预计时长（估算）</span>
          </a-tooltip>
          <span v-else style="margin-left: 10px;">预计时长</span>
          <span>{{ estimateGenerateVideoDurationForShow || '--' }}</span>
          <span>秒</span>
        </div>
        <a-button type="primary" @click="generateVideo" :loading="isGeneratingVideo">合成视频</a-button>
        <a-button type="text" @click="showHelpModal" style="margin-left: 8px;">
          <template #icon>
            <QuestionCircleOutlined />
          </template>
        </a-button>
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
        <VideoEditPreview :clips="state.clips" :video-config="state.videoConfig" 
          :selected-config-index="selectedRightConfigIndex"
          @change-zimu-position="changePreviewZimuPosition"
          @change-title-position="changePreviewTitlePosition"/>
      </div>

      <!-- 右侧面板 -->
      <div class="right-panel custom-scroll">
        <GlobalConfig v-if="selectedRightConfigIndex === ''" 
          v-model="state.videoConfig" :closeable="false"
          @changeConfigIndex="(value) => selectedRightConfigIndex = value"/>
        <ZimuConfig v-if="selectedRightConfigIndex === `globalZimuConfig`" 
          :rootName="videoTitle" title="全局配置" v-model="state.videoConfig.zimuConfig" 
          @close="closeConfigPanel" />
        <VideoTitleConfig v-if="selectedRightConfigIndex === `globalTitleConfig`" 
          :rootName="videoTitle" title="全局配置" v-model="state.videoConfig.titleConfig" 
          @close="closeConfigPanel" />
        <BackgroundAudioConfig v-if="selectedRightConfigIndex === `globalBackgroundAudioConfig`" 
          v-model="state.videoConfig.backgroundAudioConfig" 
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

    <!-- 帮助说明弹窗 -->
    <a-modal
      v-model:open="helpModalVisible"
      title="合成视频使用说明"
      :width="800"
      :footer="null"
      :body-style="{ maxHeight: '600px', overflowY: 'auto' }"
    >
      <div class="help-content">
        <h3>🎬 合成视频逻辑说明</h3>
        <div class="help-section">
          <h4>📋 基本流程</h4>
          <ol>
            <li><strong>添加镜头</strong>：点击"添加镜头"按钮，选择视频文件添加到剪辑列表</li>
            <li><strong>配置参数</strong>：为每个镜头设置标题、字幕、时长等参数</li>
            <li><strong>全局设置</strong>：配置视频分辨率、比例、输出格式等全局参数</li>
            <li><strong>合成视频</strong>：点击"合成视频"按钮开始批量生成</li>
          </ol>
        </div>

        <div class="help-section">
          <h4>⚙️ 合成逻辑</h4>
          <ul>
            <li><strong>批量生成</strong>：系统会根据镜头数量自动生成多个视频组合</li>
            <li><strong>智能组合</strong>：每个镜头都会与其他镜头进行组合，生成不同的视频版本</li>
            <li><strong>参数继承</strong>：每个镜头会继承全局配置，同时保留自身特殊设置</li>
            <li><strong>时长控制</strong>：根据设置的时长参数自动裁剪或循环视频内容</li>
          </ul>
        </div>

        <div class="help-section">
          <h4>💡 使用技巧</h4>
          <ul>
            <li><strong>镜头顺序</strong>：调整镜头顺序会影响最终视频的组合效果</li>
            <li><strong>时长设置</strong>：合理设置每个镜头的时长，避免视频过长或过短</li>
            <li><strong>标题字幕</strong>：为每个镜头设置不同的标题和字幕，增加视频多样性</li>
            <li><strong>预览功能</strong>：合成前可以预览效果，确保配置正确</li>
          </ul>
        </div>

        <div class="help-section">
          <h4>📊 剪辑点说明</h4>
          <ul>
            <li><strong>消耗机制</strong>：每个生成的视频会消耗相应的剪辑点数</li>
            <li><strong>预估显示</strong>：系统会显示预计生成的视频数量和消耗的剪辑点数</li>
            <li><strong>余额提醒</strong>：剪辑点不足时会显示警告，请及时充值</li>
          </ul>
        </div>

        <div class="help-section">
          <h4>🎯 输出说明</h4>
          <ul>
            <li><strong>文件命名</strong>：输出文件会以"视频标题_组合编号"的格式命名</li>
            <li><strong>保存位置</strong>：合成完成后会提示保存位置，可自定义输出目录</li>
            <li><strong>格式支持</strong>：支持MP4、AVI等主流视频格式输出</li>
          </ul>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed, nextTick, watch } from 'vue'
import dayjs from 'dayjs'
import VideoChooser from '@/components/VideoChooser.vue'
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import ZimuConfig from '@/components/video/ZimuConfig.vue'
import GlobalConfig from '@/components/video/GlobalConfig.vue'
import VideoTitleConfig from '@/components/video/VideoTitleConfig.vue'
import BackgroundAudioConfig from '@/components/video/BackgroundAudioConfig.vue'
import { formatDuration } from '@/utils/common-utils'
import VideoEditPreview from '@/components/video/VideoEditPreview.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 创建默认的视频配置
const createDefaultVideoConfig = () => ({
  zimuConfig: undefined,
  titleConfig: undefined,
  backgroundAudioConfig: undefined,
  videoRatio: '9:16',
  videoResolution: '1080x1920',
  outputDir: undefined
})

const defaultVideoTitle = '批量混剪_' + dayjs().format('YYYYMMDDHHmm')

// 处理标题输入框失去焦点
const handleTitleBlur = () => {
  if (!videoTitle.value || videoTitle.value.trim() === '') {
    videoTitle.value = defaultVideoTitle
  }
}

// 状态
const videoTitle = ref(defaultVideoTitle)

// 帮助弹窗
const helpModalVisible = ref(false)
const showHelpModal = () => {
  helpModalVisible.value = true
}

const state = reactive<any>({
  clips: [],
  videoConfig: createDefaultVideoConfig()
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

// 计算当前剩余剪辑点数
const currentEditeCount = computed(() => {
  return userStore.userInfo?.edite_count || 0
})

// 检查是否所有镜头都已生成实际配音
const isEstimatedDuration = computed(() => {
  for (const clip of state.clips) {
    if (clip.zimuConfig?.datas?.[0]?.text && !clip.zimuConfig?.datas?.[0]?.duration) {
      return true; // 有字幕但没有实际配音时长，说明是估算值
    }
  }
  return false;
})


const editClipName = (index: number) => {
  state.clips[index].isNameEditing = true
}

// 方法
// const goBack = () => {
//   router.back()
// }

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


// 字幕文件现在在后端生成（在缓存清空之后），不需要前端提前生成

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
  if (!checkGlobalConfig(state.videoConfig)) {
    return;
  }
  
  // 检查本地缓存的剪辑点数
  const availableEditeCount = userStore.userInfo?.edite_count || 0
  if (availableEditeCount <= 0) {
    message.error(`剪辑点数不足，当前剩余：${availableEditeCount}，无法进行视频合成`)
    return
  }
  
  // 预估视频生成个数与时长（需要在配音生成后才能准确计算）
  // 先进行初步检查
  if (estimateGenerateVideoNum.value > availableEditeCount) {
    message.error(`剪辑点数不足！预计生成 ${estimateGenerateVideoNum.value} 条视频，但剩余剪辑点数仅 ${availableEditeCount} 个`)
    return
  }
  
  try {
    isGeneratingVideo.value = true;
    
    // 不在前端生成配音和字幕，全部交给后端处理
    // 后端会在清空缓存后统一生成所有临时文件
    // await generateAudios();
    // await generateAssFiles();
    
    const params = JSON.parse(JSON.stringify({
      globalConfig: state.videoConfig,
      clips: state.clips,
      outputFileName: videoTitle.value,
    }))
    console.log('开始合成视频，参数：' + JSON.stringify(params));
    
    // 监听视频合并完成事件，扣除剪辑点数
    let totalDeducted = 0
    let isDeducting = false  // 防止重复扣点
    
    const handleVideoMerged = async (cutCount: number) => {
      // 防止并发调用导致重复扣点
      if (isDeducting) {
        console.log('正在扣点中，跳过重复调用')
        return
      }
      
      try {
        isDeducting = true
        const { executeWithDeduct } = await import('@/utils/permission-check')
        const result = await executeWithDeduct(cutCount, false) // 不显示提示，静默扣除
        if (result.success) {
          totalDeducted += cutCount
          console.log(`视频合并成功，已扣除 ${cutCount} 个剪辑点数，累计扣除：${totalDeducted}，剩余：${result.newCount}`)
        }
      } catch (error) {
        console.error('扣除剪辑点数失败:', error)
      } finally {
        isDeducting = false
      }
    }
    
    // 清理之前可能存在的监听器，避免重复注册
    window.electronAPI.removeAllListeners?.('deduct-edite-count')
    
    // 注册 IPC 监听器
    window.electronAPI.onDeductEditeCount(handleVideoMerged)
    
    const result = await window.electronAPI.videoMixAndCut(params);
    
    // 显示合成结果和扣点信息
    if (totalDeducted > 0) {
      message.success(`合成视频成功！共生成 ${result.length} 个视频，扣除 ${totalDeducted} 个剪辑点数`)
    } else {
      message.success('合成视频成功！')
    }
    console.log('合成视频成功，结果：' + JSON.stringify(result));
    console.log(`总计扣除剪辑点数：${totalDeducted}`);
    
    // 清理监听器
    window.electronAPI.removeAllListeners?.('deduct-edite-count')
  } catch (error: any) {
    console.log(error)
    message.error('合成视频失败：' + error.message)
  } finally {
    console.log('合成视频结束')
    isGeneratingVideo.value = false;
  }
}

/**
 * 估算配音时长（基于文字数量和语速）
 * @param text 字幕文本
 * @param speechRate 语速 (-500 到 500)
 * @returns 估算的时长（秒）
 */
const estimateAudioDuration = (text: string, speechRate: number = 0): number => {
  if (!text || text.trim().length === 0) {
    return 0;
  }
  
  // 基础语速：每个字约 0.4 秒
  const baseSecondsPerChar = 0.4;
  
  // 根据 speech_rate 调整语速
  // speech_rate 范围: -500 到 500
  // -500 最慢（0.5倍速），0 正常（1倍速），500 最快（2倍速）
  const speedMultiplier = 1 + (speechRate / 1000);
  
  // 计算实际每个字的时间
  const actualSecondsPerChar = baseSecondsPerChar / speedMultiplier;
  
  // 计算总时长（去除空格和标点符号）
  const charCount = text.replace(/[\s\n.,，。！？!?；;：:]/g, '').length;
  const estimatedDuration = charCount * actualSecondsPerChar;
  
  // 返回时长，保留2位小数
  return Math.ceil(estimatedDuration * 100) / 100;
}

const estimateVideoResult = () => {
  let totalDuration = 0;
  let totalNum = 0;
  
  try {
    for (let i = 0; i < state.clips.length; i++) {
      const clip = state.clips[i];
      const videoList = clip.videoList;
      
      // 如果没有字幕配置，跳过此镜头
      if (!clip.zimuConfig?.datas?.[0]) {
        continue;
      }
      
      const zimuData = clip.zimuConfig.datas[0];
      
      // 获取配音时长：优先使用实际时长，否则估算
      let audioDuration = zimuData.duration;
      if (!audioDuration && zimuData.text) {
        const speechRate = clip.zimuConfig?.audioConfig?.speech_rate || 0;
        audioDuration = estimateAudioDuration(zimuData.text, speechRate);
      }
      
      // 如果仍然没有时长，跳过
      if (!audioDuration) {
        continue;
      }
      
      // 计算当前镜头的分段数（所有视频的分段数之和）
      let clipSegmentsNum = 0;
      for (let j = 0; j < videoList.length; j++) {
        const itemVideo = videoList[j];
        const itemVideoDuration = itemVideo.duration;
        if (itemVideoDuration && audioDuration) {
          clipSegmentsNum += Math.ceil(itemVideoDuration / audioDuration);
        }
      }
      
      // 取所有镜头中分段数的最小值（如果某个镜头只有1个分段，则只能生成1条视频）
      if (totalNum === 0) {
        totalNum = clipSegmentsNum;
      } else {
        totalNum = Math.min(totalNum, clipSegmentsNum);
      }
      
      totalDuration += audioDuration;
    }
  } catch (error) {
    console.error('预估视频结果时出错:', error);
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
  state.videoConfig.outputDir = res;
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

// 监听 clips 变化，自动重新计算预估结果
watch(() => state.clips, () => {
  estimateVideoResult();
}, { deep: true });

onMounted(async () => {
  
});
</script>

<style lang="scss" scoped>
@use './index.scss' as *;
.left-actions{
  display: flex;
  align-items: center;
  gap: 10px;
}

.help-content {
  h3 {
    color: #1890ff;
    margin-bottom: 20px;
    font-size: 18px;
  }
  
  .help-section {
    margin-bottom: 20px;
    
    h4 {
      color: #333;
      margin-bottom: 10px;
      font-size: 14px;
      font-weight: 600;
    }
    
    ol, ul {
      margin-left: 20px;
      
      li {
        margin-bottom: 8px;
        line-height: 1.6;
        
        strong {
          color: #1890ff;
        }
      }
    }
  }
}
</style> 