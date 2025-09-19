<template>
  <div class="video-chooser" style="display: flex; gap: 10px; flex-wrap: wrap;">
    <template v-for="(item, index) in props.modelValue">
      <VideoChooserPreviewItem :src="item.url" :duration="item.duration" 
        :name="item.name"
        @delete="deleteItem(index)"
        @preview="() => handlePreview(item)"
        @update-duration="(value) => handleUpdateDuration(index, value)"/>
    </template>
    <div v-if="!limit || (props.modelValue.length < limit)" class="video-chooser-box video-box" @click="selectFiles">
      <PlusOutlined class="video-chooser-icon" />
      <div class="video-chooser-title">添加素材</div>
    </div>
  </div>
  <a-modal v-model:open="previewDialogOpen" title="视频信息" :footer="null" :width="800" @cancel="closePreviewDialog">
    <video ref="videoRef" v-if="selectedPreviewItem" :src="selectedPreviewItem.url" controls 
      style="width: 100%;max-height: 80vh;" controlslist="nodownload"/>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, onBeforeUnmount } from 'vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import VideoChooserPreviewItem from './VideoChooserPreviewItem.vue';

const props = defineProps<{
  modelValue: any[];
  limit?: number;
  isShowDuration?: boolean;
}>()

const previewDialogOpen = ref(false)
const selectedPreviewItem = ref<any>(null)
const videoRef = ref<HTMLVideoElement | null>(null)

const emit = defineEmits(['update:modelValue'])

const selectFiles = async () => {
  const resultList = await window.electronAPI.openFileDialog({
    multiple: true,
    filters: [
      { name: 'Videos', extensions: ['mkv', 'avi', 'mp4'] }
    ]
  })
  if (resultList.length === 0) {
    return
  } else {
    let newList = props.modelValue;
    if (newList && newList.length > 0) {
      for (let i = 0; i < resultList.length; i++) {
        const resultItem  = resultList[i];
        if (newList.find((item: any) => item.url !== resultItem.url)) {
          newList.push(resultItem);
        }
      }
    } else {
      newList = resultList;
    }
    console.log(newList)
    emit('update:modelValue', newList)
  }
  
}

const handlePreview = (item: any) => {
  selectedPreviewItem.value = item
  previewDialogOpen.value = true
}

const handleUpdateDuration = (index: number, duration: number) => {
  const newValue = props.modelValue.map((item: any, i: number) => {
    if (i === index) {
      return {
        ...item,
        duration
      }
    }
    return item
  })
  emit('update:modelValue', newValue)
}

const deleteItem = (index: number) => {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}

const closePreviewDialog = () => {
  previewDialogOpen.value = false
  if (videoRef.value) {
    videoRef.value.pause()
  }
}

onBeforeUnmount(() => {
  if (videoRef.value) {
    videoRef.value.pause()
  }
})
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
