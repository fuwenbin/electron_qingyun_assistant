<template>
  <div class="page-my-settings" ref="pageRef">
    <a-table
      :data-source="dataList"
      :pagination="false"
      rowKey="id"
      :scroll="{ y: tableScrollY }"
    >
      <a-table-column key="filePath" title="文件夹" :width="380">
        <template #default="{record}">
          <div class="folder-item">
            <FolderOpenOutlined />
            <span>{{ getFolderPath(record) }}</span>
          </div>
        </template>
      </a-table-column>
      <a-table-column key="frequency" title="执行周期">
        <template #default="{record}">
          <div class="frequency-item">
            <span v-if="record.frequency === 'minutes'">每 {{ record.frequencyValue }} 分钟</span>
            <span v-else-if="record.frequency === 'hours'">每 {{ record.frequencyValue }} 小时</span>
            <span v-else-if="record.frequency === 'time'">每天 {{ record.dailyTime }}</span>
          </div>
        </template>
      </a-table-column>
      <a-table-column key="status" title="状态" >
        <template #default="{record}">
          <div class="status-item">
            <a-tag v-if="record.status === -1" color="default">未激活</a-tag>
            <a-tag v-else-if="record.status === 0" color="default">待执行</a-tag>
            <a-tag v-else-if="record.status === 1" color="processing">执行中</a-tag>
            <a-tag v-else-if="record.status === 2" color="success">完成</a-tag>
          </div>
        </template>
      </a-table-column>
      <a-table-column key="taskIds" title="任务队列">
        <template #default="{record}">
          <div class="task-ids-item">
            <span v-if="record.taskIds && record.taskIds.trim()">
              {{ getTaskCount(record.taskIds) }} 个任务
            </span>
            <span v-else class="no-tasks">无任务</span>
          </div>
        </template>
      </a-table-column>
      <a-table-column key="title" title="标题">
        <template #default="{record}">
          <div v-for="titleItem in getTitleList(record)" class="title-item">{{ titleItem }}</div>
        </template>
      </a-table-column>
      <a-table-column key="details" title="详情" :width="80">
        <template #default="{record}">
          <div class="details-item">
            <a-button type="link" size="small" @click="openDetailModal(record)">详情</a-button>
          </div>
        </template>
      </a-table-column>
      <a-table-column key="actions" title="操作" :width="120">
        <template #default="{record}">
          <div class="actions">
            <a-button 
              v-if="record.status === -1" 
              type="primary" 
              size="small" 
              @click="handleExecute(record)"
              style="margin-right: 8px;"
            >
              执行
            </a-button>
            <a-button type="primary" size="small" @click="handleDelete(record)">删除</a-button>
          </div>
        </template>
      </a-table-column>
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
  <PublishSettingDialog :open="publishModalOpen" :setting="selectedSetting"
    @update:open="() => closePublishModal()"/>
  
  <!-- Detail Modal -->
  <a-modal 
    v-model:open="detailModalOpen" 
    title="配置详情" 
    :footer="null"
    width="800px"
  >
    <div v-if="selectedDetail" class="detail-content">
      <div class="detail-section">
        <div class="detail-item">
          <label>文件夹路径:</label>
          <span>{{ getFolderPath(selectedDetail) }}</span>
        </div>
        <div class="detail-item">
          <label>执行周期:</label>
          <span>
            <span v-if="selectedDetail.frequency === 'minutes'">每 {{ selectedDetail.frequencyValue }} 分钟</span>
            <span v-else-if="selectedDetail.frequency === 'hours'">每 {{ selectedDetail.frequencyValue }} 小时</span>
            <span v-else-if="selectedDetail.frequency === 'time'">每天 {{ selectedDetail.dailyTime }}</span>
          </span>
        </div>
        <div class="detail-item">
          <label>状态:</label>
          <span>
            <a-tag v-if="selectedDetail.status === -1" color="default">未激活</a-tag>
            <a-tag v-else-if="selectedDetail.status === 0" color="default">待执行</a-tag>
            <a-tag v-else-if="selectedDetail.status === 1" color="processing">执行中</a-tag>
            <a-tag v-else-if="selectedDetail.status === 2" color="success">完成</a-tag>
          </span>
        </div>
        <div class="detail-item" v-if="selectedDetail.taskIds">
          <label>任务队列:</label>
          <span>{{ getTaskCount(selectedDetail.taskIds) }} 个任务</span>
        </div>
        <div class="detail-item">
          <label>创建时间:</label>
          <span>{{ formatDateTime(selectedDetail.createdAt) }}</span>
        </div>
        <div class="detail-item">
          <label>更新时间:</label>
          <span>{{ formatDateTime(selectedDetail.updatedAt) }}</span>
        </div>
      </div>
      
      <div class="detail-section">
        <div class="detail-item">
          <label>标题列表:</label>
          <div class="list-content">
            <div v-for="(title, index) in getTitleList(selectedDetail)" :key="index" class="list-item">
              {{ index + 1 }}. {{ title }}
            </div>
          </div>
        </div>
        <div class="detail-item" v-if="hasDescription(selectedDetail)">
          <label>描述列表:</label>
          <div class="list-content">
            <div v-for="(desc, index) in getDescriptionList(selectedDetail)" :key="index" class="list-item">
              {{ index + 1 }}. {{ desc }}
            </div>
          </div>
        </div>
        <div class="detail-item" v-if="hasTopic1(selectedDetail)">
          <label>话题1:</label>
          <div class="list-content">
            <a-tag v-for="topic in getTopicList(selectedDetail.topicGroup1)" :key="topic" color="green">
              {{ topic }}
            </a-tag>
          </div>
        </div>
        <div class="detail-item" v-if="hasTopic2(selectedDetail)">
          <label>话题2:</label>
          <div class="list-content">
            <a-tag v-for="topic in getTopicList(selectedDetail.topicGroup2)" :key="topic" color="orange">
              {{ topic }}
            </a-tag>
          </div>
        </div>
      </div>
      
      <div class="detail-section" v-if="selectedDetail.platformId || selectedDetail.accountIds">
        <div class="detail-item" v-if="selectedDetail.platformId">
          <label>平台:</label>
          <span>{{ getPlatformName(selectedDetail.platformId) }}</span>
        </div>
        <div class="detail-item" v-if="selectedDetail.accountIds">
          <label>账户列表:</label>
          <div class="list-content">
            <div v-for="account in getSelectedAccounts(selectedDetail.accountIds)" :key="account.id" class="account-item">
              <img v-if="account.logo" :src="account.logo" class="account-logo" />
              <div v-else class="account-logo account-logo-placeholder"></div>
              <span class="account-name">{{ account.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { FolderOpenOutlined } from '@ant-design/icons-vue'
import PublishSettingDialog from './components/PublishSettingDialog.vue'

const dataList = ref<any[]>([])
const pageRef = ref<HTMLElement | null>(null)
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
const publishModalOpen = ref(false)
const selectedSetting = ref<any>(null)
const detailModalOpen = ref(false)
const selectedDetail = ref<any>(null)
const platformList = ref<any[]>([])
const accountList = ref<any[]>([])
const getDataList = async () => {
  try {
    const res = await window.electronAPI.apiRequest({
      url: '/video-publish-setting/list',
      method: 'GET',
      data: {
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
    console.error('获取配置列表失败：' + error.message)
    message.error('获取配置列表失败：' + error.message)
  }
}

const getPlatformList = async () => {
  try {
    const res = await window.electronAPI.apiRequest({
      url: '/platform/list',
      method: 'GET'
    })
    if (res.code === 0) {
      platformList.value = res.data
    }
  } catch (error: any) {
    console.error('获取平台列表失败：' + error.message)
  }
}

const getAccountList = async () => {
  try {
    const res = await window.electronAPI.apiRequest({
      url: '/platform-account/list',
      method: 'GET'
    })
    if (res.code === 0) {
      accountList.value = res.data
    }
  } catch (error: any) {
    console.error('获取账户列表失败：' + error.message)
  }
}

const getFolderPath = (item: any) => {
  // If it's a folder path, show it directly
  // If it's old format with multiple files, show the first file's directory
  if (item.filePath) {
    if (item.filePath.includes('_,_')) {
      // Old format with multiple files
      const firstFile = item.filePath.split('_,_')[0]
      return firstFile.substring(0, firstFile.lastIndexOf('/'))
    } else {
      // New format - folder path
      return item.filePath
    }
  }
  return ''
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

const getTaskCount = (taskIds: string) => {
  if (!taskIds || !taskIds.trim()) {
    return 0
  }
  return taskIds.split(',').filter(id => id.trim()).length
}

const formatDateTime = (dateTimeString: string) => {
  if (!dateTimeString) {
    return '未知'
  }
  try {
    const date = new Date(dateTimeString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    return dateTimeString
  }
}

const hasDescription = (record: any) => {
  return record.description && record.description.trim() && record.description !== ''
}

const hasTopic1 = (record: any) => {
  return record.topicGroup1 && record.topicGroup1.trim() && record.topicGroup1 !== ''
}

const hasTopic2 = (record: any) => {
  return record.topicGroup2 && record.topicGroup2.trim() && record.topicGroup2 !== ''
}


const closePublishModal = () => {
  publishModalOpen.value = false
  selectedSetting.value = null;
}

const openDetailModal = (record: any) => {
  selectedDetail.value = record
  detailModalOpen.value = true
}

const getPlatformName = (platformId: number) => {
  const platform = platformList.value.find(p => p.id === platformId)
  return platform ? platform.name : `未知平台(${platformId})`
}

const getSelectedAccounts = (accountIds: string) => {
  if (!accountIds || !accountIds.trim()) {
    return []
  }
  const accountIdList = accountIds.split(',').filter(id => id.trim())
  return accountIdList.map(id => {
    const account = accountList.value.find(acc => acc.id === id.trim())
    if (account) {
      return account
    } else {
      // 返回占位符数据，表示账户可能已被删除
      return {
        id,
        name: `已删除账户(${id.substring(0, 8)}...)`,
        logo: '',
        platform: { name: '未知' }
      }
    }
  })
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
    const footerEl = footerRef.value
    if (!pageEl) return
    const pageRect = pageEl.getBoundingClientRect()
    const footerH = footerEl ? footerEl.getBoundingClientRect().height : 0
    const padding = 24
    const y = Math.max(200, Math.floor(pageRect.height - footerH - padding))
    tableScrollY.value = y
  } catch {}
}

const handleExecute = async (record: any) => {
  try {
    // 调用更新接口，将状态设置为0
    const res = await window.electronAPI.apiRequest({
      url: '/video-publish-setting/update',
      method: 'POST',
      data: {
        ...record,
        status: 0
      }
    })
    
    if (res.code === 0) {
      message.success('配置已激活，开始执行')
      // 刷新列表
      await getDataList()
    } else {
      throw new Error(res.message)
    }
  } catch (error: any) {
    console.error('激活配置失败：' + error.message)
    message.error('激活配置失败：' + error.message)
  }
}

const handleDelete = async (record: any) => {
  // 首先检查执行状态，不允许删除正在执行中的配置
  if (record.status === 1) {
    message.error('正在执行中的配置不允许删除')
    return
  }
  
  // 二次确认对话框
  const confirmResult = await new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除配置"${record.title ? record.title.split('_,_')[0] : '未命名'}"吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => resolve(true),
      onCancel: () => resolve(false)
    })
  })
  
  if (!confirmResult) {
    return
  }
  
  try {
    // 在执行删除之前再次实时查询数据库中的状态
    const statusCheckRes = await window.electronAPI.apiRequest({
      url: `/video-publish-setting/${record.id}`,
      method: 'GET'
    })
    
    if (statusCheckRes.code === 0 && statusCheckRes.data) {
      if (statusCheckRes.data.status === 1) {
        message.error('配置已开始执行，无法删除')
        return
      }
    }
    
    // 执行删除操作
    const deleteRes = await window.electronAPI.apiRequest({
      url: `/video-publish-setting/${record.id}`,
      method: 'DELETE'
    })
    
    if (deleteRes.code === 0) {
      message.success('删除成功')
      // 刷新列表
      await getDataList()
    } else {
      throw new Error(deleteRes.message)
    }
  } catch (error: any) {
    console.error('删除失败：' + error.message)
    message.error('删除失败：' + error.message)
  }
}

onMounted(async () => {
  console.log('MySettings onMounted')
  await getDataList()
  await getPlatformList()
  await getAccountList()
  await nextTick()
  recalcTableHeight()
  window.addEventListener('resize', recalcTableHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', recalcTableHeight)
})
</script>

<style lang="scss" scoped>
.page-my-settings{
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%; // 占满父容器高度
  overflow: hidden; // 隐藏外层溢出，仅表格区域内部滚动
  
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

.video-item {
  display: flex;
  align-items: center;
  gap: 5px;
  video {
    width: 40px;
    height: 40px;
  }
}
.folder-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1677ff;
  span {
    color: #333;
  }
}
.frequency-item {
  font-size: 14px;
  color: #666;
}
.details-item {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  align-items: center;
  .no-details {
    color: #999;
    font-size: 12px;
  }
}
.tooltip-content {
  max-width: 300px;
  .tooltip-section {
    margin-bottom: 8px;
    &:last-child {
      margin-bottom: 0;
    }
    strong {
      display: block;
      margin-bottom: 4px;
      color: #fff;
    }
  }
  .tooltip-item {
    padding: 2px 0;
    color: #fff;
    word-break: break-word;
  }
}
.task-ids-item {
  font-size: 14px;
  .no-tasks {
    color: #999;
  }
}
.status-item {
  display: flex;
  align-items: center;
}
.detail-content {
  max-height: 70vh;
  overflow-y: auto;
}
.detail-section {
  margin-bottom: 24px;
  &:last-child {
    margin-bottom: 0;
  }
  h4 {
    margin-bottom: 12px;
    color: #1677ff;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 8px;
  }
}
.detail-item {
  display: flex;
  margin-bottom: 12px;
  &:last-child {
    margin-bottom: 0;
  }
  label {
    min-width: 100px;
    font-weight: 500;
    color: #666;
    margin-right: 12px;
  }
  span {
    flex: 1;
  }
}
.list-content {
  flex: 1;
  .list-item {
    padding: 4px 0;
    border-bottom: 1px solid #f5f5f5;
    &:last-child {
      border-bottom: none;
    }
  }
}
.account-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
  &:last-child {
    border-bottom: none;
  }
  .account-logo {
    width: 20px;
    height: 20px;
    border-radius: 10px;
    margin-right: 8px;
    &.account-logo-placeholder {
      background-color: #f5f5f5;
      border: 1px solid #d9d9d9;
      display: flex;
      align-items: center;
      justify-content: center;
      &::after {
        content: '用';
        font-size: 12px;
        color: #999;
      }
    }
  }
  .account-name {
    font-weight: 500;
    margin-right: 8px;
  }
  .platform-name {
    color: #999;
    font-size: 12px;
  }
}
.actions {
  display: flex;
  gap: 5px;
}
</style>