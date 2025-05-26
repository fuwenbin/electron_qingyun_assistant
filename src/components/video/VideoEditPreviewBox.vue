<template>
  <div ref="previewBoxRef" class="video-edit-preview-box">
    <video v-if="videoUrl" :src="videoUrl" crossorigin="anonymous"
      class="preview-placeholder-video" :class="{[direction]: direction}"></video>
    <VideoEditPreviewBoxPlaceholderText v-if="zimuTextConfig" 
      class="preview-placeholder-text" key="zimuPreview"
      :global-config="props.globalConfig" text-type="zimu"
      :text-config="zimuTextConfig" :text="zimuText"
      :container="previewBoxRef"
      @change-position="(value: number) => emit('changeZimuPosition', value)"/>
    <VideoEditPreviewBoxPlaceholderText v-if="titleTextConfig" 
      class="preview-placeholder-text" key="titlePreview"
      :global-config="props.globalConfig" text-type="title"
      :text-config="titleTextConfig" :text="titleText"
      :container="previewBoxRef"
      @change-position="(value: number) => emit('changeTitlePosition', value)"/>
    <div ref="previewPlaceholderTitleRef"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import VideoEditPreviewBoxPlaceholderText  from './VideoEditPreviewBoxPlaceholderText.vue';

const props = defineProps<{
  globalConfig: any;
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
    return props.clips[selectedClipIndex].zimuConfig;
  } else {
    return null;
  }
})

const zimuTextConfig = computed(() => {
  return zimuConfig.value?.textConfig;
})

const zimuText = computed(() => {
  if (zimuConfig.value && zimuConfig.value.datas) {
    return zimuConfig.value.datas[zimuConfig.value.selectedIndex].text;
  } else {
    return '';
  }
})

const titleConfig = computed(() => {
  const INDEX_PREFIX = 'title-';
  if (props.selectedConfigIndex && props.selectedConfigIndex.startsWith(INDEX_PREFIX)) {
    const selectedClipIndex = Number(props.selectedConfigIndex.substring(INDEX_PREFIX.length));
    return props.clips[selectedClipIndex].videoTitleConfig;
  } else {
    return null;
  }
})

const titleTextConfig = computed(() => {
  if (titleConfig.value && titleConfig.value.datas) {
    return titleConfig.value.datas[titleConfig.value.selectedIndex].textConfig;
  } else {
    return null;
  }
})

const titleText = computed(() => {
  if (titleConfig.value && titleConfig.value.datas) {
    return titleConfig.value.datas[titleConfig.value.selectedIndex].text;
  } else {
    return null;
  }
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