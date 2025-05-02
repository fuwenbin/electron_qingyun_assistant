<template>
  <div class="audio-config">
    <div class="config-item">
      <div class="item-label">音色选择</div>
      <div class="item-content">
        <VoiceChooser :value="_value.voice" @update:value="(value: string) => _value.voice = value" />
      </div>
    </div>
    <div class="config-item">
      <div class="item-label">朗读速度</div>
      <div class="item-content">
        <span>慢</span>
        <a-slider v-model:value="_value.speech_rate" :min="-500" :max="500" :step="1" class="content-input"
          @change="(value: number) => _value.speech_rate = value"
        />
        <span>快</span>
      </div>
    </div>
    <div class="config-item">
      <div class="item-label">配音音量</div>
      <div class="item-content">
        <span>小</span>
        <a-slider v-model:value="_value.volume" :min="0" :max="100" :step="1" class="content-input"
          @change="(value: number) => _value.volume = value"
        />
        <span>大</span>
      </div>
    </div>
    <div class="config-item">
      <div class="item-label">语调调整</div>
      <div class="item-content">
        <span>低</span>
        <a-slider v-model:value="_value.pitch_rate" :min="-500" :max="500" :step="1" class="content-input"
          @change="(value: number) => _value.pitch_rate = value"
        />
        <span>高</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import VoiceChooser from './VoiceChooser.vue';

const props = defineProps<{
  modelValue: any
}>()

const _value = reactive(props.modelValue)

const emit = defineEmits(['update:modelValue'])

const handleUpdateModelValue = (value: any) => {
  emit('update:modelValue', value)
}

watch(() => _value, (value: any) => {
  handleUpdateModelValue(value)
}, { deep: true })
</script>

<style scoped lang="scss">
.audio-config {
  display: flex;
  flex-direction: column;
  gap: 10px;
  .config-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .item-label {
      width: 70px;
    }
    .item-content {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 2px;
      .content-input {
        flex: 1;
      }
      span {
        width: 20px;
        text-align: center;
      }
    }
  }
}
</style>
