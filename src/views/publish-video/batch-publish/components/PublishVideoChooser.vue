<template>
  <div class="publish-video-chooser">
    <div class="folder-chooser-section">
      <div class="folder-chooser-box" @click="selectFolder">
        <FolderOpenOutlined class="folder-chooser-icon" />
      </div>
      <div v-if="selectedFolder || (mode === 'direct' && videoFiles.length)" class="selected-folder-info">
        <div class="folder-path">
          {{ mode === 'direct' ? '已选择视频文件: ' : '已选择: ' }}{{ mode === 'direct' ? videoFiles[0]?.fileName : selectedFolder }}
        </div>
        <div v-if="mode === 'batch'" class="video-count">
          <div> 文件夹视频总数: {{ videoFiles.length }}</div>
          <div class="unpublished-count">未发布视频数量: {{ unpublishedVideoCount }} </div>
        </div>
      </div>
    </div>
    
    <a-table v-if="videoFiles.length" :data-source="dataList" :pagination="false" :scroll="{ y: 200 }">
      <a-table-column key="index" title="序号" :width="60">
        <template #default="{index}">{{ index + 1 }}</template>
      </a-table-column>
      <a-table-column key="fileName" title="视频文件名">
        <template #default="{record}">
          <div class="video-file-item">
            <div class="file-name">{{ record.fileName }}</div>
          </div>
        </template>
      </a-table-column>
      <a-table-column key="statistic" title="发布情况">
        <template #default="{record}">
          <template v-if="record?.statistic?.length">
            <div class="statistic-container">
              <div v-for="statisticItem in record.statistic" :key="statisticItem.platformId" class="statistic-item">
                <div class="item-platform">{{ statisticItem.platformName }}</div>
                <div class="item-count-status-0">待发布：{{ statisticItem.notPublishCount }}</div>
                <div class="item-count-status-1">发布中：{{ statisticItem.publishingCount }}</div>
                <div class="item-count-status-2">发布成功：{{ statisticItem.publishSuccessCount }}</div>
                <div class="item-count-status-3">发布失败：{{ statisticItem.publishFailCount }}</div>
              </div>
            </div>
          </template>
          <div v-else>未发布</div>
        </template>
      </a-table-column>
    </a-table>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { FolderOpenOutlined } from '@ant-design/icons-vue';

const props = defineProps<{
  modelValue: any[];
  selectedFolder?: string;
  mode?: 'batch' | 'direct'; // 新增mode属性
}>()

const emit = defineEmits(['update:modelValue', 'folderChange'])

const selectedFolder = ref<string>('')
const videoFiles = ref<any[]>([])
const videoStatistics = ref<any[]>([])

// Helper function to get filename from full path
const getFileName = (filePath: string): string => {
  const parts = filePath.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1]
}

// Watch for external folder changes
watch(() => props.selectedFolder, (newFolder) => {
  if (newFolder) {
    selectedFolder.value = newFolder
    if (props.mode === 'batch') {
      // 批量模式：加载文件夹中的视频文件
      loadVideoFiles()
    } else if (props.mode === 'direct') {
      // 直接发布模式：处理单个文件
      const fileName = getFileName(newFolder)
      const videoFile = {
        fileName: fileName,
        filePath: newFolder
      }
      videoFiles.value = [videoFile]
      emit('update:modelValue', videoFiles.value)
    }
  }else{
    selectedFolder.value = ''
    videoFiles.value = []
    videoStatistics.value = []
    emit('update:modelValue', [])
    emit('folderChange', '')
  }
})

const dataList = computed(() => {
  return videoFiles.value.map(v => {
    const rawStatistic = videoStatistics.value[v.fileName]
    const statisticList = []
    if (rawStatistic) {
      const statistic = JSON.parse(JSON.stringify(videoStatistics.value[v.fileName]))
      for (const key in statistic) {
        statisticList.push(statistic[key])
      }
    }
    return {
      ...v,
      statistic: statisticList
    }
  })
})

const unpublishedVideoCount = computed(() => {
  return videoFiles.value.filter(video => {
    const statistic = videoStatistics.value[video.fileName]
    if (!statistic) return true // No statistics means unpublished
    
    // Check if all platforms have 0 published/publishing/success counts
    for (const platformId in statistic) {
      const platformStat = statistic[platformId]
      if (platformStat.publishingCount > 0 || platformStat.publishSuccessCount > 0) {
        return false // This video has been published or is being published
      }
    }
    return true // No published/publishing tasks found
  }).length
})

const selectFolder = async () => {
  try {
    if (props.mode === 'direct') {
      // 直接发布模式：选择单个视频文件
      const result = await window.electronAPI.openFileDialog({
        title: '选择视频文件',
        filters: [
          { name: '视频文件', extensions: ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm'] }
        ],
        properties: ['openFile']
      })
      
      if (result && result.length > 0) {
        const filePath = result[0].path
        const fileName = getFileName(filePath)
        const videoFile = {
          fileName: fileName,
          filePath: filePath
        }
        
        videoFiles.value = [videoFile]
        emit('update:modelValue', videoFiles.value)
        emit('folderChange', filePath)
      }
    } else {
      // 定时批量模式：选择文件夹
      const folderPath = await window.electronAPI.selectDirectory({
        title: '选择视频文件夹'
      })
      
      if (folderPath) {
        selectedFolder.value = folderPath
        emit('folderChange', folderPath)
        await loadVideoFiles()
      }
    }
  } catch (error) {
    console.error('选择失败：', error)
  }
}

const loadVideoFiles = async () => {
  if (!selectedFolder.value || props.mode !== 'batch') return
  
  try {
    // Call API to get video files from the selected directory
    const response = await window.electronAPI.apiRequest({
      url: '/file/list-video-files',
      method: 'POST',
      data: { directoryPath: selectedFolder.value }
    })
    
    if (response.code === 0) {
      videoFiles.value = response.data.map((filePath: string) => ({
        fileName: getFileName(filePath),
        filePath: filePath
      }))
      
      // Update parent component
      emit('update:modelValue', videoFiles.value)
      
      // Load statistics for these files
      await loadVideoStatistics()
    } else {
      console.error('获取视频文件列表失败：', response.message)
    }
  } catch (error: any) {
    console.error('获取视频文件列表失败：', error.message)
  }
}

const loadVideoStatistics = async () => {
  if (videoFiles.value.length === 0) return
  
  try {
    const filenameList = videoFiles.value.map(item => item.fileName)
    const statisticRes = await window.electronAPI.apiRequest({
      url: '/video-publish-task/statistic-by-filename',
      method: 'GET',
      data: filenameList
    })
    
    if (statisticRes.code === 0) {
      videoStatistics.value = statisticRes.data
    } else {
      throw new Error(statisticRes.message)
    }
  } catch (error: any) {
    console.error('获取视频的发布统计信息失败：' + error.message)
  }
}
</script>

<style lang="scss" scoped>
.publish-video-chooser {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.folder-chooser-section {
  display: flex;
  gap: 10px;
}

.folder-chooser-box {
  width: 100px;
  height: 40px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.3s;
  
  &:hover {
    border-color: #1677ff;
  }
  
  .folder-chooser-icon { 
    font-size: 32px;
    color: #999;
  }
  
  .folder-chooser-title {
    margin-top: 8px;
    color: #666;
  }
}

.selected-folder-info {
  .folder-path {
    font-size: 14px;
    color: #333;
    margin-bottom: 4px;
  }
  
  .video-count {
    font-size: 12px;
    color: #666;
    display: flex;
    gap: 20px;
    .unpublished-count{
      font-weight: 600;
      color: #333;
    }
  }
}

.video-file-item {
  .file-name {
    font-size: 14px;
    color: #333;
  }
}

.statistic-container {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.statistic-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  
  .item-platform {
    font-weight: 500;
  }
}
</style>