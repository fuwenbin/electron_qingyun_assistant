<template>
  <div ref="previewBoxRef" class="video-edit-preview-box">
    <video v-if="videoUrl" :src="videoUrl"
      class="preview-placeholder-video" :class="{[direction]: direction}"></video>
    <div ref="previewPlaceholderZimuRef" 
      draggable="true" class="preview-placeholder-subtitles"
      :style="zimuStyleStr"
      :class="{[previewPlaceholderZimuClass]: !!previewPlaceholderZimuClass}"
    >{{ previewPlaceholderZimuText }}</div>
    <div ref="previewPlaceholderTitleRef"></div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import VideoEditPreviewBoxPlaceholderZimu  from './VideoEditPreviewBoxPlaceholderZimu.vue';
const props = defineProps<{
  globalConfig: any;
  clips: any[];
  selectedConfigIndex: string;
  videoUrl: string;
  direction: string;
}>()

const emit = defineEmits(['changeZimuPosition', 'changeTitlePosition'])
const previewBoxRef = ref<HTMLElement>();

const previewPlaceholderZimuRef = ref<HTMLElement>();
const zimuDragStartY = ref(0);
const zimuDragEndY = ref(0);
const previewPlaceholderTitleRef = ref<HTMLElement>();
const titleDragStartY = ref(0);
const titleDragEndY = ref(0);

const previewBoxHeight = computed(() => {
  if (previewBoxRef.value) {
    return previewBoxRef.value.clientHeight;
  } else {
    return 0;
  }
})

const zimuTop = computed(() => {
  const zimuConfig = previewPlaceholderZimuConfig.value;
  if (zimuConfig && zimuConfig.textConfig) {
    return zimuConfig.textConfig.posYPercent;
  } else {
    return 2/3;
  }
})

const zimuStyleObj = computed(() => {
  const obj: any = {};
  const textConfig = previewPlaceholderZimuConfig.value?.textConfig;
  if (textConfig) {
    obj['font-family'] = textConfig.fontFamily;
    obj['font-size'] = `${textConfig.fontSize / 100 / 0.6}vw`;
    obj['color'] = textConfig.fontColor;
    obj['font-weight'] = textConfig.fontWeight;
    obj['text-decoration'] = textConfig.underline ? 'underline' : 'none';
    obj['font-style'] = textConfig.italic ? 'italic' : 'normal';
    obj['text-align'] = textConfig.textAlign;
    obj['height'] = zimuFontHeight.value + 'px';
    obj['top'] = (Math.floor(zimuTop.value * previewBoxHeight.value)) + 'px';
  }
  return obj;
})

const zimuStyleStr = computed(() => {
  let result = '';
  for (let key in  zimuStyleObj.value) {
    if (zimuStyleObj.value[key]) {
      result += `${key}: ${zimuStyleObj.value[key]};`;
    }
  }
  return result;
})

const zimuFontHeight = computed(() => {
  const zimuConfig = previewPlaceholderZimuConfig.value;
  if (previewBoxRef.value && zimuConfig) {
    const zimuFontSize = zimuConfig.textConfig.fontSize;
    return previewBoxRef.value.clientWidth * (zimuFontSize / 100) * 0.6 / 2;
  } else {
    return 0;
  }
})

const previewPlaceholderZimuConfig = computed(() => {
  if (props.selectedConfigIndex && props.selectedConfigIndex.startsWith('zimu-')) {
    const selectedClipIndex = Number(props.selectedConfigIndex.substring('zimu-'.length));
    console.log(props.clips[selectedClipIndex].zimuConfig)
    return props.clips[selectedClipIndex].zimuConfig;
  } else {
    return null;
  }
})

const previewPlaceholderZimuText = computed(() => {
  const zimuConfig = previewPlaceholderZimuConfig.value;
  let zimuText = '';
  if (zimuConfig?.datas[zimuConfig.selectedIndex]) {
    zimuText = zimuConfig.datas[zimuConfig.selectedIndex].text;
  }
  return zimuText;
})

const previewPlaceholderZimuClass = computed(() => {
  const zimuConfig = previewPlaceholderZimuConfig.value;
  let zimuClass = '';
  if (zimuConfig && zimuConfig.textConfig) {
    const textConfig = zimuConfig.textConfig;
    return textConfig.customStyle;
  }
  console.log(zimuClass)
  return zimuClass
})

watch (zimuTop, (newValue) => {
  emit('changeZimuPosition', newValue);
})

const initPreviewPlaceholderZimu = () => {
  const target = previewPlaceholderZimuRef.value
  if (target) {
    target.addEventListener('dragstart', (e: any) => {
      zimuDragStartY.value = e.clientY;
      zimuDragEndY.value = e.clientY;
      e.dataTransfer.setData('text/plain', 'dragging');
    });
    const dragContainer = previewBoxRef.value || document;
    dragContainer.addEventListener('dragover', (e: any) => {
      e.preventDefault();
    });
    dragContainer.addEventListener('drop', (e: any) => {
      zimuDragEndY.value = e.clientY;
      const moveY = zimuDragEndY.value - zimuDragStartY.value;
      const newTopValue = zimuTop.value + moveY / previewBoxHeight.value;
      const maxTopValue = (previewBoxHeight.value - zimuFontHeight.value) / previewBoxHeight.value;
      let resultTopValue = newTopValue;
      if (newTopValue < 0) {
        resultTopValue = 0;
      } else if (newTopValue > maxTopValue) {
        resultTopValue = maxTopValue;
      }
      emit('changeZimuPosition', resultTopValue);
      e.preventDefault();
    });
  }
}

onMounted(() => {
  initPreviewPlaceholderZimu();
})
</script>

<style  lang="scss" scoped>
@import '@/assets/styles/custom-text-style.scss';

.video-edit-preview-box {
  width: 100%;
  height: 100%;
  position: relative;
}
.preview-placeholder-video {
  position: absolute;
  width: 100%;
  &.vertical {
    width: 100%;
    margin-top: 50%;
  }
  &.horizontal {
    width: 100%;
  }
}
.preview-placeholder-subtitles {
  position: absolute;
  left: 0;
  bottom: 0;
  text-align: center;
  width: 100%;
  height: auto;
  border-top: 1px solid #1677ff;
  border-bottom: 1px solid #1677ff;
  // white-space: nowrap;
  // overflow: hidden;
}
</style>