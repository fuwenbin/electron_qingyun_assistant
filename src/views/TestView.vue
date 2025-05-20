<template>
  <div class="page">
    <a-button type="primary" @click="douyinLogin">抖音登录</a-button>
    <a-button type="primary" @click="douyinPublishVideo">抖音发布</a-button>
    <webview  src="https://creator.douyin.com" partition="persist:douyin" style="width: 100%; height: 600px" />
  </div>
</template>

<script lang="ts" setup>
const douyinLogin = async () => {
  await window.electronAPI.playwrightAction({
    action: 'douyin-login',
    sessionId: '123'
  })
  console.log('test')
}

const douyinPublishVideo = async () => {
  await window.electronAPI.playwrightAction({
    action: 'douyin-publish-video',
    payload: {
      filePath: '',
      description: '测试'
    },
    sessionId: '123'
  })
  console.log('test')
}
</script>

<style lang="scss" scoped>
.page {
  padding-top: 60px;
}
</style>