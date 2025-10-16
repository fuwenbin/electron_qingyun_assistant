<template>
  <div class="page-my-task" ref="pageRef">
    <div class="toolbar" ref="toolbarRef">
      <a-form layout="inline" @submit.prevent>
        <a-form-item label="ID">
          <a-input v-model:value="filters.id" placeholder="精确ID" style="width: 140px" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="filters.status" allow-clear placeholder="全部" style="width: 140px">
            <a-select-option :value="0">待发布</a-select-option>
            <a-select-option :value="1">发布中</a-select-option>
            <a-select-option :value="2">发布成功</a-select-option>
            <a-select-option :value="3">发布失败</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="关键词">
          <a-input v-model:value="filters.keyword" placeholder="文件名/标题 模糊" style="width: 220px" />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="onSearch">查询</a-button>
            <a-button @click="onReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </div>

    <a-table
      :data-source="dataList"
      :pagination="false"
      rowKey="id"
      :scroll="{ y: tableScrollY }"
    >
      <a-table-column key="index" title="ID" :width="80">
        <template #default="{record}">
          <div>{{ record.id }}</div>
        </template>
      </a-table-column>
      <a-table-column key="filePath" title="视频文件" > 
        <template #default="{record}">
          <div>{{ record.fileName }}</div>
        </template>
      </a-table-column>
      <a-table-column key="title" title="标题" :width="160">
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
      <a-table-column key="scheduledStartTime" title="定时发布时间" :width="160">
        <template #default="{record}">
          <div>{{ record.scheduledStartTime }}</div>
        </template>
      </a-table-column>
      <a-table-column key="status" title="状态" :width="100">
        <template #default="{record}">
          <div>{{ getStatusName(record.status) }}</div>
        </template>
      </a-table-column>
      <a-table-column key="details" title="详情" :width="80">
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
      <a-table-column key="actions" title="操作" :width="80">
        <template #default="{record}">
          <div class="action-buttons">
            <a-button 
              type="text" 
              danger 
              size="small"
              :disabled="record.status === 1"
              @click="handleDelete(record)"
            >
              删除
            </a-button>
          </div>
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

    <div class="table-pagination" ref="footerRef">
      <a-pagination
        :current="pagination.current"
        :pageSize="pagination.pageSize"
        :total="pagination.total"
        :showTotal="pagination.showTotal"
        :showSizeChanger="true"
        :pageSizeOptions="pagination.pageSizeOptions"
        @change="onPageChange"
        @showSizeChange="onPageSizeChange"
      />
    </div>
  </div>
  <comment-list-dialog v-if="commentListDialogOpen" v-model:open="commentListDialogOpen" :accountId="commentTask?.accountId" 
    :platformId="commentTask?.platformId" :itemId="commentTask?.itemId"/>
</template>

<script lang="ts" setup>
import {  ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { message, Modal } from 'ant-design-vue'
import CommentListDialog from './components/CommentListDialog.vue'

const dataList = ref<any[]>([])
const pageRef = ref<HTMLElement | null>(null)
const toolbarRef = ref<HTMLElement | null>(null)
const footerRef = ref<HTMLElement | null>(null)
const tableScrollY = ref<number>(640)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: (total: number) => `共 ${total} 条`,
  showSizeChanger: true,
  pageSizeOptions: ['10','20','50','100']
})
const filters = reactive<{ id?: number | undefined, status?: number | undefined, keyword?: string | undefined }>({ id: undefined, status: undefined, keyword: undefined })
const refreshTimeout = ref<any>(null)
const commentListDialogOpen = ref(false)
const commentTask = ref<any>(null)


const getDataList = async () => {
  try {
    const res = await window.electronAPI.apiRequest({
      url: '/video-publish-task/list',
      method: 'GET',
      data: {
        id: filters.id,
        status: filters.status,
        keyword: filters.keyword,
        page: pagination.current,
        pageSize: pagination.pageSize
      }
    })
    if (res.code === 0) {
      if (Array.isArray(res.data)) {
        // 兼容老接口返回数组
        dataList.value = res.data
        pagination.total = res.data.length
      } else {
        dataList.value = res.data.list || []
        pagination.total = res.data.total || 0
      }
    } else {
      throw new Error(res.message)
    }
  } catch (error: any) {
    console.error("获取视频发布任务列表失败：" + error.message)
    message.error("获取视频发布任务列表失败：" + error.message)
  }
}
const onSearch = async () => {
  pagination.current = 1
  await getDataList()
}
const onReset = async () => {
  filters.id = undefined
  filters.status = undefined
  filters.keyword = undefined
  pagination.current = 1
  await getDataList()
}
const onPageChange = async (page: number, pageSize: number) => {
  pagination.current = page
  pagination.pageSize = pageSize
  await getDataList()
}
const onPageSizeChange = async (_current: number, size: number) => {
  pagination.current = 1
  pagination.pageSize = size
  await getDataList()
}

const recalcTableHeight = () => {
  try {
    const pageEl = pageRef.value
    const toolbarEl = toolbarRef.value
    const footerEl = footerRef.value
    if (!pageEl) return
    const pageRect = pageEl.getBoundingClientRect()
    const toolbarH = toolbarEl ? toolbarEl.getBoundingClientRect().height : 0
    const footerH = footerEl ? footerEl.getBoundingClientRect().height : 0
    const padding = 50
    const y = Math.max(200, Math.floor(pageRect.height - toolbarH - footerH - padding))
    console.info("tableScrollY", y, pageRect.height, toolbarH, footerH, padding)
    tableScrollY.value = y
  } catch {}
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

// 删除任务处理函数
const handleDelete = (record: any) => {
  // 检查状态，发布中不允许删除
  if (record.status === 1) {
    message.warning('发布中的任务不允许删除')
    return
  }
  
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除任务 ID: ${record.id} 吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        const res = await window.electronAPI.apiRequest({
          url: '/video-publish-task/delete',
          method: 'POST',
          data: { id: record.id }
        })
        
        if (res.code === 0) {
          message.success('删除成功')
          // 重新获取数据列表
          await getDataList()
        } else {
          throw new Error(res.message)
        }
      } catch (error: any) {
        console.error('删除任务失败：', error.message)
        message.error('删除失败：' + error.message)
      }
    }
  })
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
  await nextTick()
  recalcTableHeight()
  window.addEventListener('resize', recalcTableHeight)
})

onBeforeUnmount(() => {
  if (refreshTimeout.value) {
    clearTimeout(refreshTimeout.value)
    refreshTimeout.value = null
  }
  window.removeEventListener('resize', recalcTableHeight)
})
  
</script>

<style lang="scss" scoped>
.page-my-task{
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%; // 占满父容器高度
  overflow: hidden; // 隐藏外层溢出，仅表格区域内部滚动
  .toolbar{
    padding: 10px;
    flex: 0 0 auto;
  }
  :deep(.ant-table-wrapper){
    flex: 1 1 auto;
    min-height: 0; // 使中间区域可压缩
  }
  .table-pagination{
    position: sticky;
    bottom: 0;
    background: #fff;
    padding: 8px 12px;
    text-align: right;
    border-top: 1px solid #f0f0f0;
    z-index: 2;
  }
}
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

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>