<template>
  <div class="page">
    <a-button type="primary" @click="douyinLogin">抖音登录</a-button>
    <a-button type="primary" @click="douyinPublishVideo">抖音发布</a-button>
    <!-- <webview  src="https://creator.douyin.com" 
      useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
      style="width: 100%; height: 600px" /> -->
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
      filePath: 'D:\\test\\video_4.mp4',
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