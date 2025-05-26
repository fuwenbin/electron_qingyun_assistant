<template>
  <div class="video-preview">
    <div class="preview-container" :class="{ 'aspect-9-16': props.aspectRatio === '9:16' }">
      <video
        ref="videoRef"
        class="preview-video"
        :src="currentVideoUrl"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoadedMetadata"
        crossorigin="anonymous"
      ></video>
      <div v-if="!currentVideoUrl" class="placeholder">
        <i class="fas fa-film"></i>
        <span>暂无预览内容</span>
      </div>
    </div>
    
    <div class="preview-controls">
      <div class="time-info">
        <span>{{ formatTime(currentTime) }}</span>
        <span>/</span>
        <span>{{ formatTime(duration) }}</span>
      </div>
      
      <div class="progress-bar">
        <div class="progress-bg"></div>
        <div class="progress-current" :style="{ width: `${progress}%` }"></div>
        <input
          type="range"
          class="progress-input"
          min="0"
          max="100"
          v-model="progress"
          @input="onProgressChange"
        >
      </div>
      
      <div class="control-buttons">
        <button @click="togglePlay">
          <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
        </button>
        <button @click="toggleMute">
          <i :class="isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up'"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  aspectRatio?: '9:16' | '16:9'
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const currentVideoUrl = ref('')
const isPlaying = ref(false)
const isMuted = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const togglePlay = () => {
  if (!videoRef.value) return
  if (isPlaying.value) {
    videoRef.value.pause()
  } else {
    videoRef.value.play()
  }
  isPlaying.value = !isPlaying.value
}

const toggleMute = () => {
  if (!videoRef.value) return
  videoRef.value.muted = !videoRef.value.muted
  isMuted.value = videoRef.value.muted
}

const onTimeUpdate = () => {
  if (!videoRef.value) return
  currentTime.value = videoRef.value.currentTime
  progress.value = (currentTime.value / duration.value) * 100
}

const onLoadedMetadata = () => {
  if (!videoRef.value) return
  duration.value = videoRef.value.duration
}

const onProgressChange = () => {
  if (!videoRef.value) return
  const time = (progress.value / 100) * duration.value
  videoRef.value.currentTime = time
}

// 提供预览方法给父组件
defineExpose({
  preview: (url: string) => {
    currentVideoUrl.value = url
    if (videoRef.value) {
      videoRef.value.load()
    }
  }
})
</script>

<style scoped>
.video-preview {
  width: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.preview-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: #1a1a1a;
}

.preview-container.aspect-9-16 {
  aspect-ratio: 9/16;
}

.preview-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  gap: 12px;
}

.placeholder i {
  font-size: 32px;
}

.preview-controls {
  padding: 12px;
  background: #1a1a1a;
  color: white;
}

.time-info {
  display: flex;
  gap: 4px;
  font-size: 12px;
  margin-bottom: 8px;
}

.progress-bar {
  position: relative;
  height: 4px;
  margin-bottom: 12px;
}

.progress-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  background: #333;
  border-radius: 2px;
}

.progress-current {
  position: absolute;
  height: 100%;
  background: #4e6ef2;
  border-radius: 2px;
}

.progress-input {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.control-buttons {
  display: flex;
  gap: 16px;
}

.control-buttons button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.control-buttons button:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style> 