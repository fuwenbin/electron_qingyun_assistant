<template>
  <div class="voice-chooser">
    <a-select 
      :value="props.value" 
      @update:value="(value: string) => emit('update:value', value)"
      placeholder="选择语音"
    >
      <a-select-option v-for="item in displayOptions" :key="item.value" :value="item.value">
        {{ item.label }}
      </a-select-option>
    </a-select>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const props = defineProps<{
  value: string
  options?: any[]
}>()

const emit = defineEmits(['update:value'])

const voiceOptions = ref<Array<{label: string, value: string}>>([])

// 固定的中文语音列表
const CHINESE_VOICES = [
  { label: '晓晓 (女声)', value: 'zh-CN-XiaoxiaoNeural' },
  { label: '云希 (女声)', value: 'zh-CN-YunxiNeural' },
  { label: '云健 (男声)', value: 'zh-CN-YunjianNeural' },
  { label: '晓辰 (女声)', value: 'zh-CN-XiaochenNeural' },
  { label: '晓涵 (女声)', value: 'zh-CN-XiaohanNeural' },
  { label: '晓墨 (女声)', value: 'zh-CN-XiaomengNeural' },
  { label: '晓悠 (女声)', value: 'zh-CN-XiaoyouNeural' },
  { label: '云扬 (男声)', value: 'zh-CN-YunyangNeural' },
  { label: '晓伊 (女声)', value: 'zh-CN-XiaoyiNeural' },
  { label: '云枫 (男声)', value: 'zh-CN-YunfengNeural' }
]

// 直接使用固定的语音列表
const loadVoices = () => {
  voiceOptions.value = CHINESE_VOICES
  
  // 设置默认音色为云希 (女声)
  if (!props.value && voiceOptions.value.length > 0) {
    emit('update:value', 'zh-CN-YunxiNeural')
  }
}

// 如果传入了自定义选项，使用自定义选项
const finalOptions = computed(() => {
  if (props.options && props.options.length > 0) {
    return props.options
  }
  return voiceOptions.value
})

// 使用 finalOptions 而不是直接使用 voiceOptions
const displayOptions = computed(() => finalOptions.value)

onMounted(() => {
  if (!props.options || props.options.length === 0) {
    loadVoices()
  } else {
    voiceOptions.value = props.options
  }
})

</script>

<style scoped lang="scss">
</style>
