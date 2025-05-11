<template>
  <div ref="previewPlaceholderZimuRef" 
    :style="zimuStyleStr"
    :class="{[previewPlaceholderZimuClass]: !!previewPlaceholderZimuClass}"
  >{{ previewPlaceholderZimuText }}</div>
</template>

<script lang="ts">
import { computed, onMounted, ref } from 'vue';
const props = defineProps<{
  globalConfig: any;
  clips: any[];
  selectedConfigIndex: string;
  videoUrl: string;
  direction: string;
  boxHeight: number;
  container: HTMLElement
}>()

const emit = defineEmits(['changePosition'])

const previewPlaceholderZimuRef = ref<HTMLElement>();
const zimuDragStartY = ref(0);
const zimuDragEndY = ref(0);

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
    obj['top'] = (Math.floor(zimuTop.value * props.boxHeight)) + 'px';
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
  if (props.container && zimuConfig) {
    const zimuFontSize = zimuConfig.textConfig.fontSize;
    return props.container.clientWidth * (zimuFontSize / 100) * 0.6 / 2;
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

const initPreviewPlaceholderZimu = () => {
  const target = previewPlaceholderZimuRef.value
  if (target) {
    target.addEventListener('dragstart', (e: any) => {
      zimuDragStartY.value = e.clientY;
      zimuDragEndY.value = e.clientY;
      e.dataTransfer.setData('text/plain', 'dragging');
    });
    const dragContainer = props.container || document;
    dragContainer.addEventListener('dragover', (e: any) => {
      e.preventDefault();
    });
    dragContainer.addEventListener('drop', (e: any) => {
      zimuDragEndY.value = e.clientY;
      const moveY = zimuDragEndY.value - zimuDragStartY.value;
      const newTopValue = zimuTop.value + moveY / props.boxHeight;
      const maxTopValue = (props.boxHeight - zimuFontHeight.value) / props.boxHeight;
      let resultTopValue = newTopValue;
      if (newTopValue < 0) {
        resultTopValue = 0;
      } else if (newTopValue > maxTopValue) {
        resultTopValue = maxTopValue;
      }
      emit('changePosition', resultTopValue);
      e.preventDefault();
    });
  }
}

onMounted(() => {
  initPreviewPlaceholderZimu();
})
</script>

<style lang="scss" scoped>

</style>