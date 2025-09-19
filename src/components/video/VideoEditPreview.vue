<template>
  <div class="video-edit-preview">
    <div class="preview-header">
      <div class="header-left">
        <div class="header-title">效果预览</div>
        <div class="header-subtitle">预览视频整体效果</div>
      </div>
      <div class="header-right">
        <a-button type="primary">
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
          <VideoEditPreviewBox :videoUrl="previewPlaceholderVideoUrl" 
            :global-config="props.globalConfig"
            :clips="props.clips" :selected-config-index="props.selectedConfigIndex"
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
import { computed} from 'vue'
import { FileSearchOutlined } from '@ant-design/icons-vue';
import VideoEditPreviewBox from './VideoEditPreviewBox.vue';

const props = defineProps<{
  globalConfig: any;
  clips: any[];
  selectedConfigIndex: string;
}>()

const emit = defineEmits(['changeZimuPosition', 'changeTitlePosition'])

const previewPlaceholderVideoUrl = computed(() => {
  if (props.clips.length > 0 && props.clips[0].videoList.length > 0) {
    return props.clips[0].videoList[0].url;
  } else {
    return '';
  }
})

const previewBoxDirection = computed(() => {
  return props.globalConfig.videoRatio === '9:16' ? 'vertical' : 'horizontal'
})

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