<template>
  <div class="page">
    <div class="test-section">
      <h2>抖音功能测试</h2>
      <div class="button-group">
        <a-button type="primary" @click="douyinLogin">抖音登录</a-button>
        <a-button type="primary" @click="douyinPublishVideo">抖音发布</a-button>
        <a-button type="primary" @click="douyinSyncComment">抖音评论</a-button>
      </div>
    </div>
    
    <a-divider />
  
    <login-modal v-model:open="loginVisible" />
    <a-button type="primary" @click="loginVisible = true">登录</a-button>
    <!-- <webview  src="https://creator.douyin.com" 
      useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
      style="width: 100%; height: 600px" /> -->
  </div>
</template>

<script lang="ts" setup>
import LoginModal from '@/components/auth/LoginModal.vue'
import { ref } from 'vue'
const loginVisible = ref(false)
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
const douyinSyncComment = async () => {
  const res = await window.electronAPI.apiRequest({
    url: '/platform-account-comment/listNotReplyCommentLatest10',
    method: 'GET',
    data: {
      accountId: '83747f605d954de39eca0a51a4257863',
      itemId: '7513185073592585487'
    }
  })
  console.log(res)
}
</script>

<style lang="scss" scoped>
.page {
  padding: 80px 20px 20px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 40px;
  
  h2 {
    color: #333;
    margin-bottom: 20px;
    font-size: 20px;
    font-weight: 600;
  }
  
  .button-group {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
  }
}

.ant-divider {
  margin: 40px 0;
}
</style>