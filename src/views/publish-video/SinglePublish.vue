<template>
  <div class="page-single-publish">
    <div class="page-body">
      <Sider class="page-sider" />
      <div class="publish-base-content">
        <div class="base-content-title">单条视频发布</div>
        <div class="base-content-form">
          <div class="form-item">
            <div class="item-label">添加视频</div>
            <div class="item-input">
              <VideoChooser v-model="selectedVideos" :limit="1"/>
            </div>
          </div>
          <div class="form-item">
            <div class="item-label">
              <div class="label-name">标题</div>
              <div class="label-tip">填写建议</div>
            </div>
            <div class="item-input">
              <div class="input-content">
                <a-input placeholder="标题（5-30字）" v-model:value="baseContentData.title" />
              </div>
            </div>
          </div>
        </div>
        <div class="base-content-description">
          <div class="form-item">
            <div class="item-label">
              <div class="label-name">视频简介</div>
            </div>
            <div class="item-input">
              <div class="input-content">
                <a-textarea placeholder="" v-model:value="baseContentData.description" />
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
      <a-button @click="openPublishModal">发布</a-button>
      <a-button>定时发布</a-button>
      <a-button>关闭</a-button>
    </div>
  </div>
  <a-modal v-model:open="publishModalOpen" title="选择账号" :width="1000" okText="发布"
    @ok="publishConfirm">
    <a-spin size="large" :spinning="loading">
      <div class="publish-modal-body custom-scroll">
        <div class="platform-account-group-list">

        </div>
        <div class="platform-account-chooser-container">
          <div class="account-chooser-filter">
            <div class="select-all">
              <a-checkbox :checked="isAccountAllSelected" @change="selectAllAccount"/>全选
            </div>
            <div class="timing-config">
              <div class="timing-config-type">
                <a-checkbox v-model:checked="isTimingPublish" />定时发布
              </div>
              <div class="timing-config-time">
                <a-date-picker v-if="isTimingPublish" v-model:value="timingPublishTime" 
                  format="YYYY-MM-DD HH:mm" :show-time="true" 
                />
              </div>
            </div>
          </div>
          <div class="account-chooser-list">
            <div v-for="item in platformAccountList" :key="item.id" class="account-chooser-item">
              <a-checkbox :checked="isAccountSelected(item)" @change="handleAccountCheckChange(item)" />
              <img :src="item.logo" class="item-logo" />
              <div class="item-info">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-platform-info">
                  <div class="platform-name">{{ item.platform?.name }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-spin>
  </a-modal>
</template>

<script lang="ts" setup>
import VideoChooser from '@/components/VideoChooser.vue'
import { onMounted, reactive, ref, watch, computed } from 'vue'
import logoDouyin from '@/assets/images/platform-logos/logo_douyin.svg'
import Sider from './components/Sider.vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

const selectedVideos  = ref<any[]>([])

const baseContentData = reactive({
  filePath: '',
  title: '',
  description: ''
})
const platformList = ref<any[]>([])
const selectedPlatformId = ref()
const publishModalOpen = ref(false)
const platformAccountList = ref<any[]>([])
const selectedAccountList = ref<any[]>([])
const isTimingPublish = ref(false)
const timingPublishTime = ref('')
const loading = ref(false)

watch (selectedVideos, (newValue) => {
  if (newValue && newValue.length) {
    const selectedVideo = newValue[0]
    baseContentData.filePath = selectedVideo.path
    baseContentData.title = selectedVideo.name
    baseContentData.description = selectedVideo.name
  } else {
    baseContentData.filePath = ''
    baseContentData.title = ''
    baseContentData.description = ''
  }
})

const isAccountSelected = (item: any) => {
  return !!selectedAccountList.value.find(v => v.id === item.id)
}

const isAccountAllSelected = computed(() => {
  let result = platformAccountList.value.length ===  selectedAccountList.value.length;
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

const publishConfirm = async () => {
  if (selectedAccountList.value.length === 0) {
    message.error('请选择要发布的账号')
    return;
  }
  const params = JSON.parse(JSON.stringify({
    platformId: selectedPlatformId.value,
    accountList: selectedAccountList.value,
    ...baseContentData,
    isTimingPublish: isTimingPublish.value,
    timingPublishTime: dayjs(timingPublishTime.value).format('YYYY-MM-DD HH:mm')
  }))
  loading.value = true;
  try {
    const res = await window.electronAPI.playwrightAction({
      action: 'publish-video',
      payload: params
    })
    if (res.code === 0) {
      message.success('发布成功', 3000)
      publishModalOpen.value = false
      reset()
    } else {
      throw new Error(res.message);
    }
  } catch (error: any) {
    console.error('发布失败：' + error.message)
    message.error('发布失败：' + error.message)
  } finally {
    loading.value = false;
  }
}

const openPublishModal = () => {
  if (!baseContentData.filePath) {
    message.error('请添加要发布的视频');
    return;
  }
  publishModalOpen.value = true
  isTimingPublish.value = false
  timingPublishTime.value = ''
  selectedAccountList.value = []
  getAccountList()
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

const handleAccountCheckChange = (item: any) => {
  if (selectedAccountList.value.find(v => v.id === item.id)) {
    selectedAccountList.value = selectedAccountList.value.filter(v => v.id !== item.id)
  } else {
    selectedAccountList.value = [...selectedAccountList.value, item]
  }
}

const reset = () => {
  selectedVideos.value = []
  baseContentData.title = ''
  baseContentData.filePath = ''
  baseContentData.description = ''
  selectedAccountList.value = []
  isTimingPublish.value = false
  timingPublishTime.value = ''
}

onMounted(() => { 
  getPlatformList()
})
</script>

<style lang="scss" scoped>
@import "@/assets/styles/custom-scroll.scss";

.page-single-publish {
  width: 100%;
  height: 100%;
  display: flex;
  padding-top: 10px;
  flex-direction: column;
}

.base-content-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
}
.base-content-video {
  margin-bottom: 30px;
}
.base-content-form {
  .form-item {
    margin-bottom: 20px;
    .item-label {
      display: flex;
      align-items: center;
      margin-bottom: 5px;
      .label-tip {
        color: #1677ff;
        margin-left: 10px;
      }
    }
  }
}
.page-sider {
  width: 150px;
  margin-right: 20px;
}
.page-body {
  flex: 1;
  padding-left: 20px;
  display: flex;
  .publish-base-content {
    flex: 1;
  }
}
.page-footer {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  gap: 20px;
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
.timing-config {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>