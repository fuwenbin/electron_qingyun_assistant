<template>
  <a-modal :open="props.open" title="选择账号" :width="1000" okText="发布"
    @ok="handleOk" 
    @update:open="(value: boolean) => emit('update:open', value)">
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
                  format="YYYY-MM-DD HH:mm" :show-time="true" :disabled-date="disabledDate"
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
import dayjs from 'dayjs';
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'

const props = defineProps<{ 
  open: boolean;
  setting?: any;
}>()

const emit = defineEmits(['update:open'])

const loading = ref(false)
const platformAccountList = ref<any[]>([])
const selectedAccountList = ref<any[]>([])
const isTimingPublish = ref(false)
const timingPublishTime = ref('')

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

const handleAccountCheckChange = (item: any) => {
  if (selectedAccountList.value.find(v => v.id === item.id)) {
    selectedAccountList.value = selectedAccountList.value.filter(v => v.id !== item.id)
  } else {
    selectedAccountList.value = [...selectedAccountList.value, item]
  }
}

const handleOk = async () => {
  if (selectedAccountList.value.length === 0) {
    message.error("请选择账号")
    return
  }
  console.info("提交数据: ",props.setting)
  const data = JSON.parse(JSON.stringify({
    filePath: props.setting.filePathList,
    title: props.setting.title,
    description: props.setting.description,
    topicGroup1: props.setting.topicGroup1,
    topicGroup2: props.setting.topicGroup2,
    platformData: props.setting.platformData,
    platformAccountList: selectedAccountList.value.map(v => v.id),
    publishType: isTimingPublish.value ? 1 : 0,
    publishTime: isTimingPublish.value ? timingPublishTime.value : dayjs().format('YYYY-MM-DD HH:mm')
  }))
  try {
    console.info('发布任务参数：', data)
    const res = await window.electronAPI.apiRequest({
      url: '/video-publish-task/publish',
      method: 'POST',
      data
    })
    console.log(res)
    if (res.code === 0) {
      message.success("创建发布任务成功")
      emit('update:open', false);
    } else {
      throw new Error(res.message)
    }
  } catch (error: any) {
    console.error('创建发布任务失败：' + error.message);
    message.error('创建发布任务失败：' + error.message)
  }
}

const disabledDate = (currentDate: any) => {
  const startDate = dayjs().add(2, 'hours')
  const endDate = dayjs().add(14, 'days')
  return currentDate.isBefore(startDate) || currentDate.isAfter(endDate)
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

onMounted(() => {
  getAccountList()
})
</script>

<style lang="scss" scoped>
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