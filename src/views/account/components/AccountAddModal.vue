<template>
  <a-modal :open="props.open" title="添加账号" width="1000" :footer="null"
    @update:open="(value: boolean) => emit('update:open', value)">
    <div class="page-account-add">
    <div class="page-header">
      <div class="header-left">
      </div>
      <div class="header-right">
        <a-input type="search" placeholder="请输入要查找的平台" />
      </div>
    </div>
    <div class="page-body">
      <div class="platform-list-container">
        <div class="container-header">
          <div class="container-title">热门平台</div>
          <FireFilled style="color:red;"/>
        </div>
        <div class="container-body">
          <div class="platform-list">
            <div v-for="item in hotPlatformList" class="platform-item" @click="addAccount(item)">
              <div class="platform-logo">
                <img :src="getLogo(item.id)" />
              </div>
              <div class="platform-name">{{ item.name }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </a-modal>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { FireFilled } from '@ant-design/icons-vue'
import logoDouyin from '@/assets/images/platform-logos/logo_douyin.svg'
import message from 'ant-design-vue/es/message'

const props = defineProps<{
  open: boolean;
}>()

const emit = defineEmits(['update:open', 'close', 'refresh'])

const hotPlatformList = ref<any[]>([])

const getLogo = (platformId: number) => {
  if (platformId === 1) {
    return logoDouyin
  } else {
    return ''
  }
}
const addAccount = async (platform: any) => {
  const res = await window.electronAPI.playwrightAction({
    action: 'platform-account-add',
    payload: {
      platformId: platform.id,
      loginUrl: platform.loginUrl
    }
  })
  if (res.code === 0) {
    message.success('账号添加成功', 3);
    emit('update:open', false);
    emit('refresh');
  } else {
    message.error('账号添加失败：' + res.errorMsg)
  }
}

const getPlatformList = async () => {
  const res = await window.electronAPI.apiRequest({
    url: '/platform/list',
    method: 'GET'
  })
  if (res.code === 0) {
    hotPlatformList.value = res.data
  }
}

onMounted(() => {
  getPlatformList()
  window.electronAPI.onPlatformLoginFinished((res: any) => {
    console.log(res)
  })
})

onBeforeUnmount(() => {
  window.electronAPI.onPlatformLoginFinished(() => {})
})

const handleModalOpenChange = (value: boolean) => {
  emit('update:open', value)
  if (!value) {
    emit('close')
  }
}

</script>

<style lang="scss" scoped>
.page-account-add {
  padding: 20px;
}
.page-header {
  display: flex;
  height: 40px;
  align-items: center;
  justify-content: space-between;
}
.page-title {
  font-size: 18px;
  font-weight: bold;
}
.platform-list-container {
  .container-header {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .container-title {
    font-size: 14px;
    font-weight: bold;
  }
  .container-body {
    margin-top: 20px;
  }
}
.platform-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  .platform-item {
    display: flex;
    flex-direction: column;
    cursor: pointer;
    .platform-logo {
      width: 35px;
      height: 35px;
      align-items: center;
    }
    .platform-name {
      font-size: 14px;
      margin-top: 5px;
      text-align: center;
    }
  }
}
</style>