<template>
  <ConfigPanel title="全局配置-背景音乐" @close="emit('close')">
    <div class="config-form">
      <div class="config-item">
        <div class="item-label">音乐音量</div>
        <div class="item-content">
          <a-slider :value="props.modelValue.volume" :min="0" :max="100" :step="1" 
            style="flex: 1;"
            @change="changeVolume"/>
          <div style="margin-left: 10px;font-size: 16px;width: 30px;">{{ props.modelValue.volume }}</div>
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
      <div v-if="props.modelValue.audio" class="config-item">
        <div class="item-content">
          <AudioPlayer :modelValue="props.modelValue.audio" @remove="removeAudio" @update:modelValue="updateAudioInfo"/>
        </div>
      </div>
    </div>
  </ConfigPanel>
</template>
<script lang="ts" setup>
import ConfigPanel from './ConfigPanel.vue';
import { UploadOutlined } from '@ant-design/icons-vue';
import AudioPlayer from '@/components/media/audio/AudioPlayer.vue';
import { message } from 'ant-design-vue';

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
  try {
    const fileList = await window.electronAPI.openFileDialog({
      filters: [
        { name: 'Audios', extensions: ['mp3', 'm4a', 'aac', 'wav', 'wma', 'ogg', 'm4r', 'flac', 'arm'] }
      ]
    })
    if (fileList.length > 0) {
      const selectedFile = fileList[0]
      emit('update:modelValue', {
        ...props.modelValue,
        audio: selectedFile
      })
    }
  } catch (error: any) {
    console.log(error)
    message.error('打开文件失败:' + error.message);
  }
}

const removeAudio = () => {
  emit('update:modelValue', {
    ...props.modelValue,
    audio: null
  })
}

const updateAudioInfo = (info: any) => {
  emit('update:modelValue', {
    ...props.modelValue,
    audio: info
  })
}
</script>

<style lang="scss" scoped>
.config-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 40px;
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