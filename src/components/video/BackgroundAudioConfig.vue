<template>
  <ConfigPanel title="全局配置-背景音乐" @close="emit('close')">
    <div class="config-form">
      <div class="config-item">
        <div class="item-label">音乐音量</div>
        <div class="item-content">
          <a-slider :value="props.modelValue.volume" :min="0" :max="100" :step="1" 
            style="width: 250px;"
            @change="changeVolume"/>
        </div>
      </div>
      <div class="config-item">
        <div class="item-content">
          <div class="audio-choose-btn" @click="chooseBackgroundAudio">
            <UploadOutlined />
            <span style="margin-left: 10px;">选择音频</span>
          </div>
        </div>
      </div>
    </div>
  </ConfigPanel>
</template>
<script lang="ts" setup>
import ConfigPanel from './ConfigPanel.vue';
import { UploadOutlined } from '@ant-design/icons-vue';

const props = withDefaults(defineProps<{
  modelValue: any
}>(), {
  modelValue: {
    volume: 100
  }
})
const emit = defineEmits(['close', 'update:modelValue'])
const changeVolume = (value: number) => {
  emit('update:modelValue', { ...props.modelValue, volume: value })
}

const chooseBackgroundAudio = async () => {
  const fileList = await window.electronAPI.openFileDialog({
    filters: [
      { name: 'Audios', extensions: ['mp3', 'm4a', 'aac', 'wav', 'wma', 'ogg', 'm4r', 'flac', 'arm'] }
    ]
  })
  const selectedFile = fileList[0]
  emit('update:modelValue', {
    ...props.modelValue,
    ...selectedFile
  })
}
</script>

<style lang="scss" scoped>
.config-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.config-item {
  display: flex;
  align-items: center;
  gap: 10px;
  .item-label {
    width: 100px;
  }
  .item-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
.audio-choose-btn {
  width: 150px;
  height: 80px;
  background: #eeeeee;
  border: 2px solid #cccccc;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  &:hover {
    border-color: #1677ff;
  }
}
</style>