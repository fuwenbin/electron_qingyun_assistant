<template>
  <div class="page-single-publish">
    <div class="page-body">
      <div class="publish-base-content">
        <div class="base-content-title">视频发布配置</div>
        <div class="base-content-form">
          <div class="form-item">
            <div class="item-label">添加视频</div>
            <div class="item-input">
              <PublishVideoChooser v-model="selectedVideos"/>
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
      <a-button @click="save">保存</a-button>
      <a-button @click="openPublishModal">发布</a-button>
    </div>
  </div>
  <PublishSettingDialog v-model:open="publishModalOpen" :setting="baseContentData"/>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref, watch } from 'vue'
import logoDouyin from '@/assets/images/platform-logos/douyin.jpeg'
import { message } from 'ant-design-vue'
import BatchPublishTitle from './components/BatchPublishTitle.vue'
import BatchPublishDescription from './components/BatchPublishDescription.vue'
import PublishSettingDialog from '../components/PublishSettingDialog.vue'
import PublishVideoChooser from './components/PublishVideoChooser.vue'

const selectedVideos  = ref<any[]>([])

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
const publishModalOpen = ref(false)
const selectedAccountList = ref<any[]>([])
const isTimingPublish = ref(false)
const timingPublishTime = ref('')
const topicGroup1InputValue = ref('')
const topicGroup2InputValue = ref('')

watch (selectedVideos, (newValue) => {
  if (newValue && newValue.length) {
    baseContentData.filePathList = newValue.map(v => v.path)
  } else {
    baseContentData.filePathList = []
  }
})

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

const save = async () => {
  if (selectedVideos.value.length === 0) {
    message.error('请选择视频')
    return
  }
  if (baseContentData.titleList.length === 0) {
    message.error('请填写至少一个标题')
    return
  }
  if (baseContentData.descriptionList.length === 0) {
    message.error('请填写至少一个视频简介')
    return
  }
  const data = {
    filePath: baseContentData.filePathList.join('_,_'),
    title: baseContentData.titleList.join('_,_'),
    description: baseContentData.descriptionList.join('_,_'),
    topicGroup1: baseContentData.topicGroup1.join(','),
    topicGroup2: baseContentData.topicGroup2.join(','),
    platformData: JSON.stringify({})
  }
  try {
    const res = await window.electronAPI.apiRequest({
      url: '/video-publish-setting/save',
      method: 'POST',
      data
    })
    if (res.code === 0) {
      message.success('保存成功', 3)
    } else {
      throw new Error( res.message)
    }
    return true;
 } catch (error: any) {
  console.error('保存失败：' + error.message)
  message.error('保存失败：' + error.message)
  return false;
 }
}

const openPublishModal = async () => {
  if (!baseContentData.id) {
    const saveRes = await save();
    if (!saveRes) {
      return;
    }
  }
  publishModalOpen.value = true
  isTimingPublish.value = false
  timingPublishTime.value = ''
  selectedAccountList.value = []
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

// const reset = () => {
//   selectedVideos.value = []
//   baseContentData.titleList = []
//   baseContentData.filePathList = []
//   baseContentData.descriptionList = []
//   baseContentData.topicGroup1 = []
//   baseContentData.topicGroup2 = []
//   selectedAccountList.value = []
//   isTimingPublish.value = false
//   timingPublishTime.value = ''
// }

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
.page-sider {
  width: 150px;
  margin-right: 20px;
}
.page-body {
  flex: 1;
  display: flex;
  .publish-base-content {
    flex: 1;
    padding: 20px;
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