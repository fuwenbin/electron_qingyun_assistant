<template>
  <div class="video-chooser" style="display: flex; gap: 10px; flex-wrap: wrap;">
    <template v-for="item in props.modelValue">
      <video :src="item.url" class="video-box" />
    </template>
    <div class="video-chooser-box video-box" @click="selectFiles">
      <PlusOutlined class="video-chooser-icon" />
      <div class="video-chooser-title">添加素材</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PlusOutlined } from '@ant-design/icons-vue';

const props = defineProps<{
  modelValue: any[]
}>()

const emit = defineEmits(['update:modelValue'])

const selectFiles = async () => {
  const resultList = await window.electronAPI.openFileDialog({
    multiple: true,
    filters: [
      { name: 'Videos', extensions: ['mkv', 'avi', 'mp4'] }
    ]
  })
  emit('update:modelValue', resultList)
}
</script>

<style lang="scss" scoped>
.video-preview {
  width: 100px;
  height: 100px;
}
.video-chooser {
}
.video-box {
  width: 100px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
}
.video-chooser-box {
 
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  cursor: pointer;
  .video-chooser-icon { 
    font-size: 32px;
    color: #999;
  }
  .video-chooser-title {
    margin-top: 8px;
    color: #666;
  }
}
</style>
