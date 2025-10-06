<template>
  <div class="page-single-publish">
    <div class="page-body">
      <div class="publish-base-content">
        <!-- <div class="base-content-title">视频发布配置</div> -->
        <div class="base-content-form">
          <div class="form-item">
            <div class="item-label">
              <div class="label-name">定时发布设置</div>
              <div class="label-tip">设置视频发布的时间间隔（支持2小时后及14天内的定时发布）</div>
            </div>
            <div class="item-input">
              <div class="timing-schedule-config">
                <div class="schedule-type">
                  <a-radio-group v-model:value="scheduleConfig.frequency">
                    <a-radio value="minutes">每隔分钟</a-radio>
                    <a-radio value="hours">每隔小时</a-radio>
                    <a-radio value="time">每天固定时间</a-radio>
                  </a-radio-group>
                </div>
                <div class="schedule-value">
                  <a-input-number 
                    v-if="scheduleConfig.frequency === 'minutes'"
                    v-model:value="scheduleConfig.value"
                    :min="5"
                    :max="59"
                    placeholder="5-59分钟"
                    addon-after="分钟"
                  />
                  <a-input-number 
                    v-if="scheduleConfig.frequency === 'hours'"
                    v-model:value="scheduleConfig.value"
                    :min="1"
                    :max="24"
                    placeholder="1-24小时"
                    addon-after="小时"
                  />
                  <a-time-picker 
                    v-if="scheduleConfig.frequency === 'time'"
                    v-model:value="scheduleConfig.timeValue"
                    format="HH:mm"
                    placeholder="选择时间"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="form-item">
            <div class="item-label">
              <div class="label-name">选择视频文件夹</div>
              <div class="label-tip">选择包含视频文件的文件夹</div>
            </div>
            <div class="item-input">
              <PublishVideoChooser v-model="selectedVideos" :selectedFolder="selectedFolder" @folderChange="handleFolderChange"/>
            </div>
          </div>
          <div class="form-item">
            <div class="item-label">
              <div class="label-name">标题</div>
              <div class="label-tip">如果添加多个标题，发布时会随机从中选择一个</div>
            </div>
            <div class="item-input">
              <div class="input-content">
                <BatchPublishTitle v-model="baseContentData.titleList"/>
              </div>
            </div>
          </div>
        </div>
        <div class="form-item">
          <div class="item-label">
            <div class="label-name">视频简介</div>
            <div class="label-tip">如果添加多个简介，发布时会随机从中选择一个</div>
          </div>
          <div class="item-input">
            <div class="input-content">
              <BatchPublishDescription v-model="baseContentData.descriptionList"/>
            </div>
          </div>
        </div>
        <div class="form-item">
          <div class="item-label">
            <div class="label-name">话题1</div>
            <div class="label-tip">发布时会从其中随机选择最多4个话题</div>
          </div>
          <div class="item-input">
            <div class="input-content">
              <a-tag v-for="item in baseContentData.topicGroup1" :key="item" 
                :closable="true" @close="handletopicGroup1Close(item)">{{ item }}
              </a-tag>
              <a-input v-model:value="topicGroup1InputValue" placeholder="请输入标签"
                type="text" size="small" :style="{ width: '100px' }"
                @blur="handletopicGroup1InputConfirm"
                @keyup.enter="handletopicGroup1InputConfirm"
              />
            </div>
          </div>
        </div>
        <div class="form-item">
          <div class="item-label">
            <div class="label-name">话题2</div>
            <div class="label-tip">发布时会从其中随机选择1个话题</div>
          </div>
          <div class="item-input">
            <div class="input-content">
              <a-tag v-for="item in baseContentData.topicGroup2" :key="item" 
                :closable="true" @close="handletopicGroup2Close(item)">{{ item }}
              </a-tag>
              <a-input v-model:value="topicGroup2InputValue" placeholder="请输入标签"
                type="text" size="small" :style="{ width: '100px' }"
                @blur="handletopicGroup2InputConfirm"
                @keyup.enter="handletopicGroup2InputConfirm"
              />
            </div>
          </div>
        </div>
          <div class="form-item">
            <div class="item-label">
              <div class="label-name">选择发布账号</div>
              <div class="label-tip">选择要发布视频的账号</div>
               <div class="select-all ">
                <a-checkbox :checked="isAccountAllSelected" @change="selectAllAccount">全选</a-checkbox>
              </div>
            </div>
            <div class="item-input">
              <div class="input-content">
                <div class="account-chooser-list">
                  <div v-for="item in platformAccountList" :key="item.id" >
                    <a-checkbox :checked="isAccountSelected(item)" @change="handleAccountCheckChange(item)" >
                      <div class="account-chooser-item">
                        <img :src="item.logo" class="item-logo" />
                        <div class="item-info">
                          <div class="item-name">{{ item.name }}</div>
                          <div class="platform-name">{{ item.platform?.name }}</div>
                        </div>
                      </div>
                    </a-checkbox>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
      <div class="publish-platform-list">
        <div class="platform-list-title">平台</div>
        <div class="platform-list">
          <div v-for="item in platformList" :key="item.id" :class="{active: item.id === selectedPlatformId}">
            <div class="platform-item" @click="selectedPlatformId = item.id">
              <img :src="logoDouyin" />
            </div>
          </div>
        </div>
      </div>
      <div class="publish-platform-content">

      </div>
    </div>
    <div class="page-footer">
      <a-button @click="saveConfiguration(-1)" style="margin-right: 10px;">保存配置</a-button>
      <a-button @click="resetForm" style="margin-right: 10px;">重置表单</a-button>
      <a-button type="primary" @click="saveConfiguration(0)">发布</a-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref, computed, onUnmounted, nextTick } from 'vue'
import logoDouyin from '@/assets/images/platform-logos/douyin.jpeg'
import { message } from 'ant-design-vue'
import BatchPublishTitle from './components/BatchPublishTitle.vue'
import BatchPublishDescription from './components/BatchPublishDescription.vue'
import PublishVideoChooser from './components/PublishVideoChooser.vue'

const selectedVideos = ref<any[]>([])
const selectedFolder = ref<string>('')

// 缓存键名常量
const CACHE_KEY = 'batch_publish_form_cache'

// Schedule configuration
const scheduleConfig = reactive({
  frequency: 'minutes', // 'minutes' | 'hours' | 'time'
  value: 5, // For minutes (5-59) or hours (1-24)
  timeValue: undefined as any // For daily time (dayjs object)
})

const baseContentData = reactive<{
  id?: string;
  filePathList: string[];
  titleList: string[];
  descriptionList: string[];
  topicGroup1: string[];
  topicGroup2: string[];
}>({
  filePathList: [],
  titleList: [],
  descriptionList: [],
  topicGroup1: [],
  topicGroup2: []
})
const platformList = ref<any[]>([])
const selectedPlatformId = ref()

const selectedAccountList = ref<any[]>([])
const topicGroup1InputValue = ref('')
const topicGroup2InputValue = ref('')

// 缓存管理函数
const saveFormCache = () => {
  try {
    const cacheData = {
      selectedVideos: selectedVideos.value,
      selectedFolder: selectedFolder.value,
      scheduleConfig: {
        frequency: scheduleConfig.frequency,
        value: scheduleConfig.value,
        timeValue: scheduleConfig.timeValue ? scheduleConfig.timeValue.format('HH:mm') : undefined
      },
      baseContentData: {
        titleList: baseContentData.titleList,
        descriptionList: baseContentData.descriptionList,
        topicGroup1: baseContentData.topicGroup1,
        topicGroup2: baseContentData.topicGroup2,
        filePathList: baseContentData.filePathList
      },
      selectedAccountList: selectedAccountList.value.map(account => ({
        id: account.id,
        name: account.name,
        logo: account.logo,
        platform: account.platform
      })),
      selectedPlatformId: selectedPlatformId.value,
      timestamp: new Date().getTime()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  } catch (error) {
    console.warn('保存表单缓存失败:', error)
  }
}

const loadFormCache = async () => {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY)
    if (!cacheStr) return

    const cacheData = JSON.parse(cacheStr)
    console.info("cacheData", cacheData)
    // 检查缓存是否过期（24小时）
    const now = new Date().getTime()
    const cacheAge = now - (cacheData.timestamp || 0)
    const maxAge = 24 * 60 * 60 * 1000 // 24小时
    
    if (cacheAge > maxAge) {
      clearFormCache()
      return
    }

    // 恢复数据
    if (cacheData.selectedVideos) {
      selectedVideos.value = cacheData.selectedVideos
    }
    
    if (cacheData.selectedFolder) {
      selectedFolder.value = cacheData.selectedFolder
    }
    
    if (cacheData.scheduleConfig) {
      scheduleConfig.frequency = cacheData.scheduleConfig.frequency || 'minutes'
      scheduleConfig.value = cacheData.scheduleConfig.value || 5
      if (cacheData.scheduleConfig.timeValue) {
        // 需要等到组件挂载后再设置时间值
        await nextTick()
        try {
          const dayjs = (await import('dayjs')).default
          scheduleConfig.timeValue = dayjs(cacheData.scheduleConfig.timeValue, 'HH:mm')
        } catch (error) {
          console.warn('恢复时间值失败:', error)
        }
      }
    }
    
    if (cacheData.baseContentData) {
      Object.assign(baseContentData, {
        titleList: cacheData.baseContentData.titleList || [],
        descriptionList: cacheData.baseContentData.descriptionList || [],
        topicGroup1: cacheData.baseContentData.topicGroup1 || [],
        topicGroup2: cacheData.baseContentData.topicGroup2 || [],
        filePathList: cacheData.baseContentData.filePathList || []
      })
    }
    
    if (cacheData.selectedPlatformId) {
      selectedPlatformId.value = cacheData.selectedPlatformId
    }
    
    // 等待账号列表加载完成后再恢复选中的账号
    if (cacheData.selectedAccountList && cacheData.selectedAccountList.length > 0) {
      // 使用定时器等待账号列表加载
      const restoreAccounts = () => {
        if (platformAccountList.value.length > 0) {
          const cachedAccountIds = cacheData.selectedAccountList.map((acc: any) => acc.id)
          selectedAccountList.value = platformAccountList.value.filter(account => 
            cachedAccountIds.includes(account.id)
          )
        } else {
          // 如果账号列表还没加载，继续等待
          setTimeout(restoreAccounts, 100)
        }
      }
      restoreAccounts()
    }
    
    console.log('表单缓存恢复成功')
  } catch (error) {
    console.warn('加载表单缓存失败:', error)
    clearFormCache()
  }
}

const clearFormCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY)
    message.success('表单缓存已清空')
    console.log('表单缓存已清空')
  } catch (error) {
    console.warn('清空表单缓存失败:', error)
    message.error('清空表单缓存失败')
  }
}

// Folder selection handler
const handleFolderChange = (folderPath: string) => {
  selectedFolder.value = folderPath
}

// Account management variables and methods
const platformAccountList = ref<any[]>([])

const isAccountSelected = (item: any) => {
  return !!selectedAccountList.value.find(v => v.id === item.id)
}

const isAccountAllSelected = computed(() => {
  let result = platformAccountList.value.length === selectedAccountList.value.length;
  if (!result) {
    return false;
  }
  for (let i = 0; i < platformAccountList.value.length; i++) {
    const item = platformAccountList.value[i];
    if (!selectedAccountList.value.find(v => v.id === item.id)) {
      result = false;
      break;
    }
  }
  return result;
})

const selectAllAccount = () => {
  if (isAccountAllSelected.value) {
    selectedAccountList.value = [];
  } else {
    selectedAccountList.value = platformAccountList.value;
  }
}

const handleAccountCheckChange = (item: any) => {
  if (selectedAccountList.value.find(v => v.id === item.id)) {
    selectedAccountList.value = selectedAccountList.value.filter(v => v.id !== item.id)
  } else {
    selectedAccountList.value = [...selectedAccountList.value, item]
  }
}

// 监听数据变化，自动保存缓存
// watch (selectedVideos, (newValue) => {
//   if (newValue && newValue.length) {
//     baseContentData.filePathList = newValue.map(v => v.filePath || v.path)
//   } else {
//     baseContentData.filePathList = []
//   }
//   saveFormCache()
// })

// 监听其他关键数据变化
// watch(selectedFolder, () => saveFormCache())
// watch(scheduleConfig, () => saveFormCache(), { deep: true })
// watch(baseContentData, () => saveFormCache(), { deep: true })
// watch(selectedAccountList, () => saveFormCache(), { deep: true })
// watch(selectedPlatformId, () => saveFormCache())

const getPlatformList = async () => {
  const res = await window.electronAPI.apiRequest({
    url: '/platform/list',
    method: 'GET'
  })
  if (res.code === 0) {
    platformList.value = res.data
    selectedPlatformId.value = platformList.value[0].id
  }
}

const getAccountList = async () => {
  const res = await window.electronAPI.apiRequest({
    url: '/platform-account/list',
    method: 'GET'
  })
  if (res.code === 0) {
    platformAccountList.value = res.data
  }
}


// const handlePublish = async () => {
//   
//   // First save the configuration
//   const saveResult = await saveConfiguration();
//   if (!saveResult) {
//     return;
//   }
//   
//   console.info("提交数据: ", baseContentData)
//   
//   const data = JSON.parse(JSON.stringify({
//     filePath: baseContentData.filePathList,
//     title: baseContentData.titleList,
//     description: baseContentData.descriptionList,
//     topicGroup1: baseContentData.topicGroup1,
//     topicGroup2: baseContentData.topicGroup2,
//     platformAccountList: selectedAccountList.value.map(v => v.id),
//     publishType: 1, // Fixed to 1 for timing publish
//     frequency: scheduleConfig.frequency,
//     frequencyValue: scheduleConfig.value,
//     dailyTime: scheduleConfig.frequency === 'time' ? scheduleConfig.timeValue?.format('HH:mm') : undefined,
//     directoryPath: selectedFolder.value
//   }))
//   
//   try {
//     console.info('发布任务参数：', data)
//     const res = await window.electronAPI.apiRequest({
//       url: '/video-publish-task/publish',
//       method: 'POST',
//       data
//     })
//     console.log(res)
//     if (res.code === 0) {
//       message.success("创建发布任务成功")
//       
//       // 发布成功后清空缓存和表单
//       // clearFormCache()
//       resetForm()
//     } else {
//       throw new Error(res.message)
//     }
//   } catch (error: any) {
//     console.error('创建发布任务失败：' + error.message);
//     message.error('创建发布任务失败：' + error.message)
//   }
// }

// Separate save configuration function
const saveConfiguration = async (status: number) => {
  if (selectedAccountList.value.length === 0) {
    message.error("请选择账号")
    return false
  }
  
  if (!selectedFolder.value) {
    message.error("请选择视频文件夹")
    return false
  }
  
  // Validate schedule configuration
  if (scheduleConfig.frequency === 'minutes' && (!scheduleConfig.value || scheduleConfig.value < 5 || scheduleConfig.value > 59)) {
    message.error("分钟间隔必须在5-59之间")
    return false
  }
  
  if (scheduleConfig.frequency === 'hours' && (!scheduleConfig.value || scheduleConfig.value < 1 || scheduleConfig.value > 24)) {
    message.error("小时间隔必须在1-24之间")
    return false
  }
  
  if (scheduleConfig.frequency === 'time' && !scheduleConfig.timeValue) {
    message.error("请选择每日发布时间")
    return
  }
  if (selectedVideos.value.length === 0 && !selectedFolder.value) {
    message.error('请选择视频文件夹或视频文件')
    return false
  }
  if (baseContentData.titleList.length === 0) {
    message.error('请填写至少一个标题')
    return false
  }
  if (baseContentData.descriptionList.length === 0) {
    message.error('请填写至少一个视频简介')
    return false
  }
  const data = {
    filePath: selectedFolder.value || baseContentData.filePathList.join('_,_'),
    title: baseContentData.titleList.join('_,_'),
    description: baseContentData.descriptionList.join('_,_'),
    topicGroup1: baseContentData.topicGroup1.join(','),
    topicGroup2: baseContentData.topicGroup2.join(','),
    platformData: JSON.stringify({}),
    frequency: scheduleConfig.frequency,
    frequencyValue: scheduleConfig.value,
    dailyTime: scheduleConfig.frequency === 'time' ? scheduleConfig.timeValue?.format('HH:mm') : undefined,
    accountIds: selectedAccountList.value.map(account => account.id).join(','),
    platformId: selectedPlatformId.value,
    status: status
  }
  try {
    const res = await window.electronAPI.apiRequest({
      url: '/video-publish-setting/save',
      method: 'POST',
      data
    })
    if (res.code === 0) {
      message.success('配置保存成功', 2)
      resetForm()
      return true;
    } else {
      throw new Error( res.message)
    }
 } catch (error: any) {
  console.error('保存失败：' + error.message)
  message.error('保存失败：' + error.message)
  return false;
 }
}

const handletopicGroup1InputConfirm = (e: any) => {
  const value = e.target.value
  console.log(value)
  if (value && value.trim() && !baseContentData.topicGroup1.includes(value)) {
    baseContentData.topicGroup1 = [...baseContentData.topicGroup1, value]
  }
  topicGroup1InputValue.value = ''
}

const handletopicGroup1Close = (value: string) => {
  baseContentData.topicGroup1 = baseContentData.topicGroup1.filter(item => item !== value)
}

const handletopicGroup2Close = (value: string) => { 
  baseContentData.topicGroup2 = baseContentData.topicGroup2.filter(item => item !== value)
}

const handletopicGroup2InputConfirm = (e: any) => {
  const value = e.target.value
  console.log(value)
  if (value && value.trim() && !baseContentData.topicGroup2.includes(value)) {
    baseContentData.topicGroup2 = [...baseContentData.topicGroup2, value]
  }
  topicGroup2InputValue.value = ''
}

// 重置表单函数
const resetForm = () => {
  selectedVideos.value = []
  selectedFolder.value = ''
  baseContentData.titleList = []
  baseContentData.filePathList = []
  baseContentData.descriptionList = []
  baseContentData.topicGroup1 = []
  baseContentData.topicGroup2 = []
  selectedAccountList.value = []
  scheduleConfig.frequency = 'minutes'
  scheduleConfig.value = 5
  scheduleConfig.timeValue = undefined
  topicGroup1InputValue.value = ''
  topicGroup2InputValue.value = ''
  clearFormCache()
}

// 页面可见性变化处理
const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    // 页面隐藏时保存缓存
    saveFormCache()
  }
}

onMounted(async () => { 
  // 添加页面可见性变化监听
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  // 添加页面卸载前保存缓存
  window.addEventListener('beforeunload', saveFormCache)
  
  // 获取基础数据
  await getPlatformList()
  await getAccountList()

  // 加载缓存数据
  await loadFormCache()
  console.info("onmounted")
})

onUnmounted(() => {
  // 页面卸载时保存缓存
  saveFormCache()
  console.info("onunmounted")
  // 移除事件监听
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('beforeunload', saveFormCache)
})
</script>

<style lang="scss" scoped>
@import "@/assets/styles/custom-scroll.scss";

.page-single-publish {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.page-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  .publish-base-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    height: calc(100vh - 100px); /* Subtract footer height */
  }
  .publish-platform-list{
    border-left: 1px solid #dfdfdf;

    .platform-list-title{ 
      display: flex;
      justify-content: center;
      font-weight: 600;
      padding: 5px;
    }
    .platform-list{
      display: flex;
      .active{
        background: #ffffff;
        border-left: 1px solid #209eff;
      }
      .platform-item{
        display: flex;
        img{
          width: 50px;
          height: 50px
        }

      }
    } 
  }
    
}

.base-content-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
}
.base-content-video {
  margin-bottom: 30px;
}
.form-item {
  margin-bottom: 20px;
  .item-label {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
    .label-name { 
      color: #111;
    }
    .label-tip {
      color: #1677ff;
      margin-left: 10px;
    }
    .select-all {
      margin-left: 10px;
    }
  }
}
.page-sider {
  width: 150px;
  margin-right: 20px;
}
.page-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  gap: 20px;
  border-top: 1px solid #f0f0f0;
  z-index: 1000;
}
.publish-modal-body {
  height: 70vh;
  .account-chooser-filter {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .account-chooser-item {
    height: 40pix;
    display: flex;
    align-items: center;
    gap: 5px;
    .item-logo {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
  }
}
.account-chooser-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.account-chooser-list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  gap: 10px;
}
.account-chooser-item {
  height: 40px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 0;
  .item-logo {
    width: 20px;
    height: 20px;
    border-radius: 50%;
  }
  .item-info {
    flex: 1;
    display: flex;
    align-items: center;
    .item-name {
      font-weight: 500;
      font-size: 14px;
      margin-bottom: 2px;
    }
    .platform-name {
      color: #666;
      font-size: 12px;
    }
  }
}
.timing-config {
  display: flex;
  align-items: center;
  gap: 10px;
}
.timing-schedule-config {
  display: flex;
  gap: 16px;
  
  .schedule-type {
    display: flex;
    align-items: center;
  }
  
  .schedule-value {
    display: flex;
    align-items: center;
  }
}
</style>