<template>
  <div class="video-edit-preview">
    <div class="preview-header">
      <div class="header-left">
        <div class="header-title">效果预览</div>
        <div class="header-subtitle">预览视频整体效果</div>
      </div>
      <div class="header-right">
        <a-button type="primary" @click="handlePreview" :loading="previewLoading">
          <template #icon>
            <FileSearchOutlined />
          </template>
          预览
        </a-button>
      </div>
    </div>
    <div class="preview-body">
      <div class="preview-box" :class="{[previewBoxDirection]: true}">
        <div v-if="previewPlaceholderVideoUrl"  class="preview-placeholder-content">
          <!-- 添加 key 确保配置切换时组件正确重新渲染 -->
          <VideoEditPreviewBox 
            :key="`preview-${props.selectedConfigIndex}`"
            :videoUrl="previewPlaceholderVideoUrl" 
            :video-config="props.videoConfig"
            :clips="props.clips" 
            :selected-config-index="props.selectedConfigIndex"
            :direction="previewBoxDirection" 
            @change-zimu-position="(value: number) => emit('changeZimuPosition', value)"
            @change-title-position="(value: number) => emit('changeTitlePosition', value)"
           />
        </div>
        <div v-else class="preview-placeholder-tip">请在每个镜头下添加素材</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { FileSearchOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import VideoEditPreviewBox from './VideoEditPreviewBox.vue';
import { executeWithDeduct } from '@/utils/permission-check';
import { useUserStore } from '@/stores/user';

const props = defineProps<{
  videoConfig: any;
  clips: any[];
  selectedConfigIndex: string;
}>()

const emit = defineEmits(['changeZimuPosition', 'changeTitlePosition'])

// 预览按钮loading状态
const previewLoading = ref(false)

const previewPlaceholderVideoUrl = computed(() => {
  if (props.clips.length > 0 && props.clips[0].videoList.length > 0) {
    return props.clips[0].videoList[0].url;
  }
  return '';
})

const previewBoxDirection = computed(() => {
  const videoRatio = props.videoConfig?.videoRatio || '9:16'
  return videoRatio === '9:16' ? 'vertical' : 'horizontal'
})

const userStore = useUserStore()

// 处理预览按钮点击
const handlePreview = async () => {
  try {
    previewLoading.value = true
    
    // 执行预览操作并扣除100个点数
    // 会自动检查：租期是否过期 + 点数是否足够 + 扣除点数
    const result = await executeWithDeduct(100, true)
    
    if (result.success) {
      message.success(`预览成功！${result.message}，剩余：${result.newCount}`)
      
      // 这里可以添加实际的预览逻辑
      console.log('开始预览视频...')
      console.log('当前剩余点数:', userStore.userInfo?.edite_count)
    }
  } catch (error) {
    console.error('预览失败:', error)
    // 错误提示已在 request.ts 拦截器中处理
  } finally {
    previewLoading.value = false
  }
}

</script>

<style lang="scss" scoped>
.video-edit-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80px;
  .header-title {
    font-size: 16px;
    height: 40px;
    line-height: 40px;
  }
  .header-subtitle {
    font-size: 12px;
  }
}
.preview-body {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  height: calc(100vh - 200px);
}
.preview-box {
  background: #000000;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  &.vertical {
    width: 50%;
    aspect-ratio: 9/16;
  }
  &.horizontal {
    width: 90%;
    aspect-ratio: 16/9;
  }
}
.preview-placeholder-content {
  width: 100%;
  height: 100%;
  position: relative;
}
.preview-placeholder-tip {
  color: #ffffff;
  font-size: .36vw;
}
</style>