<template>
  <div ref="placeholderRef" draggable="true"
    :style="placeholderStyle"
    :class="{[placeholderClass]: !!placeholderClass}"
  >{{ props.text }}</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';

const props = defineProps<{
  textType: string;
  videoConfig: any;
  text: string;
  textConfig: any;
  container?: HTMLElement
}>()

const emit = defineEmits(['changePosition'])

const placeholderRef = ref<HTMLElement>();
const placeholderDragStartY = ref(0);
const placeholderDragEndY = ref(0);

const previewBoxHeight = computed(() => {
  return props.container ? props.container.clientHeight : 0;
})

const defaultPosition = computed(() => {
  return props.textType === 'title' ? 0.15 : 2/3;
})

const placeholderTop = computed(() => {
  return props.textConfig?.posYPercent ?? defaultPosition.value;
})

const placeholderStyleObj = computed(() => {
  const obj: any = {};
  const textConfig = props.textConfig;
  
  if (textConfig) {
    obj['font-family'] = textConfig.fontFamily;
    obj['font-size'] = `${textConfig.fontSize / 100 / 0.6}vw`;
    obj['color'] = textConfig.fontColor;
    obj['font-weight'] = textConfig.fontWeight;
    obj['text-decoration'] = textConfig.underline ? 'underline' : 'none';
    obj['font-style'] = textConfig.italic ? 'italic' : 'normal';
    obj['text-align'] = textConfig.textAlign;
    obj['height'] = fontHeight.value + 'px';
    obj['top'] = (Math.floor(placeholderTop.value * previewBoxHeight.value)) + 'px';
  }
  
  return obj;
})

const placeholderStyle = computed(() => {
  let result = '';
  for (let key in placeholderStyleObj.value) {
    if (placeholderStyleObj.value[key]) {
      result += `${key}: ${placeholderStyleObj.value[key]};`;
    }
  }
  return result;
})

const fontHeight = computed(() => {
  if (props.container && props.textConfig && props.videoConfig) {
    const placeholderFontSize = props.textConfig.fontSize;
    const videoRatio = props.videoConfig?.videoRatio || '9:16';
    const isVertical = videoRatio === '9:16';
    
    return isVertical 
      ? props.container.clientWidth * (placeholderFontSize / 100) * 0.6 / 2
      : props.container.clientHeight * (placeholderFontSize / 100) * 0.6 / 2;
  }
  return 0;
})

const placeholderClass = computed(() => {
  return props.textConfig?.customStyle || '';
})

const dragStart = (e: any) => {
  placeholderDragStartY.value = e.clientY;
  placeholderDragEndY.value = e.clientY;
  e.dataTransfer.setData('text/plain', 'dragging');
}

const dragOver = (e: any) => {
  e.preventDefault();
}

const dragEnd = (e: any) => {
  placeholderDragEndY.value = e.clientY;
  const moveY = placeholderDragEndY.value - placeholderDragStartY.value;
  const newTopValue = placeholderTop.value + moveY / previewBoxHeight.value;
  const maxTopValue = (previewBoxHeight.value - fontHeight.value) / previewBoxHeight.value;
  let resultTopValue = newTopValue;
  if (newTopValue < 0) {
    resultTopValue = 0;
  } else if (newTopValue > maxTopValue) {
    resultTopValue = maxTopValue;
  }
  emit('changePosition', resultTopValue);
  e.preventDefault();
}

const initPlaceholder = () => {
  const target = placeholderRef.value
  if (target) {
    target.addEventListener('dragstart', dragStart);
    const dragContainer = props.container || document;
    dragContainer.addEventListener('dragover', dragOver);
    dragContainer.addEventListener('drop', dragEnd);
  }
}

onMounted(() => {
  initPlaceholder();
})

onBeforeUnmount(() => {
  const target = placeholderRef.value
  if (target) {
    target.removeEventListener('dragstart', dragStart);
    const dragContainer = props.container || document;
    dragContainer.removeEventListener('dragover', dragOver);
    dragContainer.removeEventListener('drop', dragEnd);
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/styles/custom-text-style.scss';
</style>