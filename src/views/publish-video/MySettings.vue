<template>
   <div class="my-setting">
    <a-table :data-source="dataList">
      <a-table-column key="index" title="序号">
        <template #default="{index}">
          <div>{{ index + 1 }}</div>
        </template>
      </a-table-column>
      <a-table-column key="filePath" title="视频">
        <template #default="{record}">
          <div v-for="videoItem in getVideoList(record)" class="video-item">
            <video :src="videoItem" :controls="false" />
            <div>{{ videoItem }}</div>
          </div>
        </template>
      </a-table-column>
      <a-table-column key="title" title="标题">
        <template #default="{record}">
          <div v-for="titleItem in getTitleList(record)" class="title-item">{{ titleItem }}</div>
        </template>
      </a-table-column>
      <a-table-column key="description" title="描述">
        <template #default="{record}">
          <div v-for="descriptionItem in getDescriptionList(record)" class="description-item">{{ descriptionItem }}</div>
        </template>
      </a-table-column>
      <a-table-column key="topicGroup1" title="话题1">
        <template #default="{record}">
          <div v-for="topicItem in getTopicList(record.topicGroup1)" class="topic-item">{{ topicItem }}</div>
        </template>
      </a-table-column>
      <a-table-column key="topicGroup2" title="话题2">
        <template #default="{record}">
          <div v-for="topicItem in getTopicList(record.topicGroup2)" class="topic-item">{{ topicItem }}</div>
        </template>
      </a-table-column>
      <a-table-column key="actions" title="操作">
        <template #default="{record}">
          <div class="actions">
            <a-button type="primary" size="small" @click="openPublishModal(record)">发布</a-button>
            <a-button type="primary" size="small">编辑</a-button>
            <a-button type="primary" size="small">复制</a-button>
            <a-button type="primary" size="small">删除</a-button>
          </div>
        </template>
      </a-table-column>
    </a-table>
  </div>
  <PublishSettingDialog :open="publishModalOpen" :setting="selectedSetting"
    @update:open="() => closePublishModal()"/>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import PublishSettingDialog from './components/PublishSettingDialog.vue'

const dataList = ref<any[]>([])
const publishModalOpen = ref(false)
const selectedSetting = ref<any>(null)
const getDataList = async () => {
  try {
    const res = await window.electronAPI.apiRequest({
      url: '/video-publish-setting/list',
      method: 'GET'
    })
    if (res.code === 0) {
      dataList.value = res.data
    } else {
      throw new Error(res.message)
    }
  } catch (error: any) {
    console.error('获取配置列表失败：' + error.message)
    message.error('获取配置列表失败：' + error.message)
  }
}

const getVideoList = (item: any) => {
  if (item.filePath) {
    return item.filePath.split('_,_')
  } else {
    return []
  }
}

const getTitleList = (item: any) => {
  if (item.title) {
    return item.title.split('_,_')
  } else {
    return []
  }
}

const getDescriptionList = (item: any) => {
  if (item.description) {
    return item.description.split('_,_')
  } else {
    return []
  }
}

const getTopicList = (value: string) => {
  if (value && value.trim()) {
    return value.split(',')
  } else {
    return []
  }
}

const openPublishModal = (record: any) => {
  selectedSetting.value = record
  publishModalOpen.value = true
}

const closePublishModal = () => {
  publishModalOpen.value = false
  selectedSetting.value = null;
}

onMounted(() => {
  getDataList()
})
</script>

<style lang="scss" scoped>
.video-item {
  display: flex;
  align-items: center;
  gap: 5px;
  video {
    width: 40px;
    height: 40px;
  }
}
.actions {
  display: flex;
  gap: 5px;
}
</style>