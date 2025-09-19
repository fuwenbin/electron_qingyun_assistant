<template>
  <div class="publish-video-chooser" style="display: flex; gap: 10px; flex-wrap: wrap;">
    <div v-if="!limit || (props.modelValue.length < limit)" class="video-chooser-box video-box" @click="selectFiles">
      <PlusOutlined class="video-chooser-icon" />
      <div class="video-chooser-title">添加素材</div>
    </div>
    <a-table v-if="dataList.length" :data-source="dataList">
      <a-table-column key="index" title="序号">
        <template #default="{index}">{{ index + 1 }}</template>
      </a-table-column>
      <a-table-column key="path" title="视频">
        <template #default="{record}">
          <div class="preview-item-video">
            <video class="preview-video" :src="record.path" />
            <div>{{ record.path }}</div>
          </div>
          
        </template>
      </a-table-column>
      <a-table-column key="statistic" title="发布情况">
        <template #default="{record}">
          <template v-if="record?.statistic?.length">
            <div class="statistic-container">
              <div v-for="statisticItem in record.statistic" class="statistic-item">
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
      <a-table-column key="actions" title="操作">
        <template #default="{index, record}">
          <div class="actions-container">
            <a-button type="primary" @click="handlePreview(record)" size="small">预览</a-button>
            <a-button type="primary" @click="deleteItem(index)" danger size="small">删除</a-button>
          </div>
        </template>
      </a-table-column>
"
    </a-table>
  </div>
  <a-modal v-model:open="previewDialogOpen" title="视频信息" :footer="null" :width="800" @cancel="closePreviewDialog">
    <video ref="videoRef" v-if="selectedPreviewItem" :src="selectedPreviewItem.path" controls 
      style="width: 100%;max-height: 80vh;" controlslist="nodownload"/>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, onBeforeUnmount, computed } from 'vue';
import { PlusOutlined } from '@ant-design/icons-vue';

const props = defineProps<{
  modelValue: any[];
  limit?: number;
  isShowDuration?: boolean;
}>()

const emit = defineEmits(['update:modelValue'])

const previewDialogOpen = ref(false)
const selectedPreviewItem = ref<any>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const videoStatistics = ref<any[]>([])
const dataList = computed(() => {
  return props.modelValue.map(v => {
    const rawStatistic = videoStatistics.value[v.name]
    const statisticList = []
    if (rawStatistic) {
      const statistic = JSON.parse(JSON.stringify(videoStatistics.value[v.name]))
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
    const filenameList = newList.map((item: any) => item.name)
    try {
      const statisticRes = await window.electronAPI.apiRequest({
        url: '/video-publish-task/statistic-by-filename',
        method: 'GET',
        data: filenameList
      })
      if (statisticRes.code === 0) {
        videoStatistics.value = statisticRes.data
        console.log(statisticRes.data)
        console.log('#################')
      } else {
        throw new Error(statisticRes.message)
      }
    } catch (error: any) {
      console.error('获取视频的发布统计信息失败：' + error.message)
    }
  }
  
}

const handlePreview = (item: any) => {
  selectedPreviewItem.value = item
  previewDialogOpen.value = true
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
.publish-video-chooser {
  display: flex;
  flex-direction: column;
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
.preview-item-video {
  display: flex;
  align-items: center;
  gap: 5px;
  .preview-video {
    width: 40px;
    height: 40px;
  }
}
.actions-container {
  display: flex;
  gap: 5px;
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
}
</style>
