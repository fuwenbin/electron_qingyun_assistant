<template>
  <div class="clip-item">
    <div class="clip-header">
      <div class="clip-title">
        <span class="icon">⋮⋮</span>
        <span>镜头{{ index }}</span>
        <span class="duration">素材数量: {{ materials.length }}</span>
      </div>
      <div class="clip-actions">
        <button class="mic-btn">
          <i class="fas fa-microphone"></i>
        </button>
        <button class="delete-btn">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
    
    <div class="clip-content">
      <div class="materials-list" v-if="materials.length > 0">
        <div 
          v-for="(material, idx) in materials" 
          :key="idx"
          class="material-item"
          @click="previewMaterial(material)"
        >
          <video 
            :src="material.url" 
            class="material-preview"
          ></video>
          <div class="material-duration">{{ formatDuration(material.duration) }}</div>
        </div>
      </div>
      <div class="add-material" v-else @click="handleAddMaterial">
        <button>+ 添加素材</button>
      </div>
      
      <div class="clip-tools">
        <button class="tool-btn">镜头配置</button>
        <button class="tool-btn">字幕与配音</button>
        <button class="tool-btn">文字标题</button>
        <div class="duration-select">
          <span>素材播放时长</span>
          <select v-model="playDuration">
            <option :value="3">3秒</option>
            <option :value="5">5秒</option>
            <option :value="10">10秒</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  index: number
}>()

const emit = defineEmits<{
  (e: 'preview', url: string): void
}>()

interface Material {
  url: string
  duration: number
}

const playDuration = ref(3)
const materials = ref<Material[]>([])

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const handleAddMaterial = () => {
  // 模拟添加视频素材
  // 实际应用中，这里应该打开文件选择器
  const mockMaterial: Material = {
    url: 'https://www.w3schools.com/html/mov_bbb.mp4', // 示例视频URL
    duration: 10
  }
  materials.value.push(mockMaterial)
}

const previewMaterial = (material: Material) => {
  emit('preview', material.url)
}
</script>

<style scoped>
.clip-item {
  border: 1px solid #e5e6e7;
  border-radius: 8px;
  overflow: hidden;
}

.clip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f5f6f7;
}

.clip-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon {
  color: #999;
  cursor: move;
}

.duration {
  color: #666;
  font-size: 0.9em;
}

.clip-actions {
  display: flex;
  gap: 8px;
}

.mic-btn,
.delete-btn {
  padding: 4px 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
}

.clip-content {
  padding: 16px;
}

.materials-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.material-item {
  position: relative;
  aspect-ratio: 16/9;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.material-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.material-duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 12px;
}

.add-material {
  height: 120px;
  border: 2px dashed #e5e6e7;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  cursor: pointer;
}

.add-material button {
  padding: 8px 24px;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
}

.clip-tools {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.tool-btn {
  padding: 6px 12px;
  background: none;
  border: 1px solid #e5e6e7;
  border-radius: 4px;
  color: #333;
  cursor: pointer;
}

.duration-select {
  display: flex;
  align-items: center;
  gap: 8px;
}

.duration-select select {
  padding: 4px 8px;
  border: 1px solid #e5e6e7;
  border-radius: 4px;
  background: white;
}
</style> 