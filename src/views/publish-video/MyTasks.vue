<template>
  <div class="page-my-task">
    <a-table :data-source="dataList" :pagination="false" rowKey="id">
      <a-table-column key="index" title="ID">
        <template #default="{record}">
          <div>{{ record.id }}</div>
        </template>
      </a-table-column>
      <a-table-column key="filePath" title="视频文件"> 
        <template #default="{record}">
          <div>{{ record.fileName }}</div>
        </template>
      </a-table-column>
      <a-table-column key="title" title="标题">
        <template #default="{record}">
          <div>{{ record.title }}</div>
        </template>
      </a-table-column>
      <!-- <a-table-column key="description" title="视频简介">
        <template #default="{record}">
          <div>{{ record.description }}</div>
        </template>
      </a-table-column>
      <a-table-column key="createdAt" title="任务生成时间">
        <template #default="{record}">
          <div>{{ record.createdAt }}</div>
        </template>
      </a-table-column> -->
      <a-table-column key="scheduledStartTime" title="定时发布时间">
        <template #default="{record}">
          <div>{{ record.scheduledStartTime }}</div>
        </template>
      </a-table-column>
      <a-table-column key="status" title="状态">
        <template #default="{record}">
          <div>{{ getStatusName(record.status) }}</div>
        </template>
      </a-table-column>
      <a-table-column key="details" title="详情">
        <template #default="{record}">
          <a-popover
            trigger="hover"
            placement="right"
            :overlayInnerStyle="{ maxWidth: '520px', whiteSpace: 'normal', wordBreak: 'break-all' }"
          >
            <template #content>
              <div class="details-popover">
                <div><strong>文件名：</strong>{{ record.fileName }}</div>
                <div><strong>完整路径：</strong>{{ record.filePath }}</div>
                <div><strong>描述：</strong>{{ record.description }}</div>
                <div><strong>话题：</strong>{{ record.topic }}</div>
                <div><strong>平台：</strong>{{ record.platformId }}</div>
                <div><strong>账号：</strong>{{ record.accountId }}</div>
                <div><strong>发布类型：</strong>{{ record.publishType }}</div>
                <div><strong>计划时间：</strong>{{ record.publishTime }}</div>
                <div><strong>开始/结束：</strong>{{ record.startTime }} / {{ record.endTime }}</div>
                <div><strong>ItemId：</strong>{{ record.itemId }}</div>
                <div><strong>统计：</strong>播 {{ record.playCount }} · 赞 {{ record.diggCount }} · 评 {{ record.commentCount }} · 转 {{ record.shareCount }}</div>
                <div><strong>创建/更新：</strong>{{ record.createdAt }} / {{ record.updatedAt }}</div>
              </div>
            </template>
            <a-tag color="blue" class="details-tag">详情</a-tag>
          </a-popover>
        </template>
      </a-table-column>
      <!-- <a-table-column key="startTime" title="实际发布开始时间">
        <template #default="{record}">
          <div>{{ record.startTime }}</div>
        </template>
      </a-table-column>
      <a-table-column key="endTime" title="实际发布结束时间">
        <template #default="{record}">
          <div>{{ record.endTime }}</div>
        </template>
      </a-table-column> -->
      <!-- <a-table-column key="endTime" title="播放" data-index="playCount"></a-table-column>
      <a-table-column key="endTime" title="点赞" data-index="diggCount"></a-table-column>
      <a-table-column key="endTime" title="评论" data-index="commentCount"></a-table-column>
      <a-table-column key="endTime" title="分享" data-index="shareCount"></a-table-column> -->
      <!-- <a-table-column key="actions" title="操作">
        <template #default="{record}">
          <div class="item-actions">
            <a-button v-if="record.status === 3" type="primary" 
              @click="() => {}">重试</a-button>
            <a-button v-if="record.status === 0" type="text" danger @click="() => {}">取消</a-button>
            <a-button v-if="record.status === 2" type="default" size="small" 
              @click="openCommentDialog(record)">评论</a-button>
            <a-button v-if="record.status === 2" type="default" size="small" 
              @click="() => {}">私信</a-button>
          </div>
        </template>
      </a-table-column> -->
    </a-table>
  </div>
  <comment-list-dialog v-if="commentListDialogOpen" v-model:open="commentListDialogOpen" :accountId="commentTask?.accountId" 
    :platformId="commentTask?.platformId" :itemId="commentTask?.itemId"/>
</template>

<script lang="ts" setup>
import {  ref, onMounted, onBeforeUnmount } from 'vue'
import { message } from 'ant-design-vue'
import CommentListDialog from './components/CommentListDialog.vue'

const dataList = ref<any[]>([])
const refreshTimeout = ref<any>(null)
const commentListDialogOpen = ref(false)
const commentTask = ref<any>(null)


const getDataList = async () => {
  try {
    const res = await window.electronAPI.apiRequest({
      url: '/video-publish-task/list',
      method: 'GET'
    })
    if (res.code === 0) {
      dataList.value = res.data
    } else {
      throw new Error(res.message)
    }
  } catch (error: any) {
    console.error("获取视频发布任务列表失败：" + error.message)
    message.error("获取视频发布任务列表失败：" + error.message)
  }
}
const getStatusName = (status: number) => {
  switch (status) {
    case 0:
      return '待发布'
    case 1:
      return '发布中'
    case 2:
      return '发布成功'
    case 3:
      return '发布失败'
    default:
      return '未知'
  }
}

const refresh  = () => {
  if (!refreshTimeout.value) {
    refreshTimeout.value = setTimeout(async () => {
      await getDataList()
      refreshTimeout.value = null
      refresh();
    }, 5000)
  }
}

// const openCommentDialog = (task: any) => {
//   commentTask.value = task;
//   commentListDialogOpen.value = true;
// }




onMounted(async () => {
  console.log('MyTasks onMounted')
  await getDataList();
  // refresh();
})

onBeforeUnmount(() => {
  if (refreshTimeout.value) {
    clearTimeout(refreshTimeout.value)
    refreshTimeout.value = null
  }
})
  
</script>

<style lang="scss" scoped>
.item-video {
  display: flex;
  align-items: center;
  gap: 5px;
  video {
    width: 40px;
    height: 40px;
  }
}
.item-actions {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.details-tag {
  cursor: pointer;
  font-size: 12px !important;
}
</style>