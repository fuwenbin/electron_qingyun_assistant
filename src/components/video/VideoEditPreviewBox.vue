<template>
  <div ref="previewBoxRef" class="video-edit-preview-box">
    <video v-if="videoUrl" :src="videoUrl" crossorigin="anonymous"
      class="preview-placeholder-video" :class="{[direction]: direction}"></video>
    <!-- 使用完整的 key 确保组件在配置切换时正确更新 -->
    <VideoEditPreviewBoxPlaceholderText 
      v-if="zimuTextConfig && props.videoConfig" 
      class="preview-placeholder-text" 
      :key="`zimu-${props.selectedConfigIndex}-${zimuText}`"
      :video-config="props.videoConfig" 
      text-type="zimu"
      :text-config="zimuTextConfig" 
      :text="zimuText"
      :container="previewBoxRef"
      @change-position="(value: number) => emit('changeZimuPosition', value)"/>
    <VideoEditPreviewBoxPlaceholderText 
      v-if="titleTextConfig && props.videoConfig" 
      class="preview-placeholder-text" 
      :key="`title-${props.selectedConfigIndex}-${titleText}`"
      :video-config="props.videoConfig" 
      text-type="title"
      :text-config="titleTextConfig" 
      :text="titleText"
      :container="previewBoxRef"
      @change-position="(value: number) => emit('changeTitlePosition', value)"/>
    <div ref="previewPlaceholderTitleRef"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import VideoEditPreviewBoxPlaceholderText  from './VideoEditPreviewBoxPlaceholderText.vue';

const props = defineProps<{
  videoConfig: any;
  clips: any[];
  selectedConfigIndex: string;
  videoUrl: string;
  direction: string;
}>()

const emit = defineEmits(['changeZimuPosition', 'changeTitlePosition'])
const previewBoxRef = ref<HTMLElement>();

const zimuConfig = computed(() => {
  const INDEX_PREFIX = 'zimu-';
  if (props.selectedConfigIndex && props.selectedConfigIndex.startsWith(INDEX_PREFIX)) {
    const selectedClipIndex = Number(props.selectedConfigIndex.substring(INDEX_PREFIX.length));
    return props.clips[selectedClipIndex]?.zimuConfig || null;
  }
  return null;
})

const zimuTextConfig = computed(() => {
  return zimuConfig.value?.textConfig;
})

const zimuText = computed(() => {
  if (zimuConfig.value && zimuConfig.value.datas) {
    const selectedIndex = zimuConfig.value.selectedIndex ?? 0;
    return zimuConfig.value.datas[selectedIndex]?.text || '';
  }
  return '';
})

const titleConfig = computed(() => {
  const INDEX_PREFIX = 'title-';
  if (props.selectedConfigIndex && props.selectedConfigIndex.startsWith(INDEX_PREFIX)) {
    const selectedClipIndex = Number(props.selectedConfigIndex.substring(INDEX_PREFIX.length));
    return props.clips[selectedClipIndex]?.videoTitleConfig || null;
  }
  return null;
})

const titleTextConfig = computed(() => {
  if (titleConfig.value && titleConfig.value.datas) {
    const selectedIndex = titleConfig.value.selectedIndex ?? 0;
    return titleConfig.value.datas[selectedIndex]?.textConfig;
  }
  return null;
})

const titleText = computed(() => {
  if (titleConfig.value && titleConfig.value.datas) {
    const selectedIndex = titleConfig.value.selectedIndex ?? 0;
    return titleConfig.value.datas[selectedIndex]?.text || null;
  }
  return null;
})

</script>

<style  lang="scss" scoped>
.video-edit-preview-box {
  width: 100%;
  height: 100%;
  position: relative;
}
.preview-placeholder-video {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
}
.preview-placeholder-text {
  position: absolute;
  left: 0;
  text-align: center;
  width: 100%;
  border-top: 1px solid #1677ff;
  border-bottom: 1px solid #1677ff;
  white-space: nowrap;
  overflow: hidden;
}
</style>