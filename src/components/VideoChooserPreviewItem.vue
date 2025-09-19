<template>
  <div class="video-chooser-preview-item">
    <div class="video-container">
      <video ref="videoElement" class="video-element" :src="props.src"
        @loadedmetadata="handleLoadedMetadata" crossorigin="anonymous"></video>
    </div>
    <div class="video-header" :title="props.name">{{ props.name }}</div>
    <div class="video-footer">
      <div class="video-duration">{{ formattedDuration }}</div>
      <div class="video-tools">
        <div class="video-tool-btn" @click="emit('preview')">查看</div>
        <div class="video-tool-btn" @click="emit('delete')">删除</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import  { ref, computed } from 'vue'
const props = defineProps<{
  src: string;
  duration?: number;
  name?: string;
}>()

const emit = defineEmits(['delete', 'preview', 'updateDuration'])

const duration = ref(0);
const videoElement = ref<HTMLVideoElement | null>(null)
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } else {
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
const formattedDuration = computed(()  => { 
  if (duration.value) {
    return formatTime(duration.value);
  } else {
    return '00:00';
  }
});
const handleLoadedMetadata = () => {
  if (videoElement.value) {
    duration.value = videoElement.value.duration;
    emit('updateDuration', duration.value);
    console.log('视频时长:', duration.value);
  }
};
</script>

<style lang="scss" scoped>
.video-chooser-preview-item {
  width: 100px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  background: #eeeeee;
  position: relative;
  &:hover {
    .video-header, .video-tools {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }
    .video-duration {
      display: none;
    }
  }
}
.video-container {
  width: 100%;
  height: 100%;
}
.video-element {
  width: 100%;
  height: 100%;
}
.video-header, .video-footer {
  position: absolute;
  left: 0;
  padding: 2px 4px;
  background: #333333;
  opacity: 0.3;
  color: #ffffff;
  width: 100%;
}
.video-header {
  top: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default;
}
.video-footer {
  bottom: 0;
}
.video-tools {
  display: none;
}
.video-tool-btn {
  color: #ffffff;
  cursor: pointer;
}
</style>
