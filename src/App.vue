<template>
  <a-config-provider :locale="zhCN">
    <!-- 显示加载状态 -->
    <div v-if="isInitializing" class="app-loading">
      <div class="loading-content">
        <a-spin size="large" />
        <p>正在初始化应用...</p>
      </div>
    </div>
    
    <!-- 主应用内容 -->
    <template v-else>
      <MainLayout>
        <router-view />
      </MainLayout>
      
      <!-- 强制登录弹窗 -->
      <LoginModal
        :open="showLoginModal"
        :required="true"
        title="请先登录"
        @success="handleLoginSuccess"
        @update:open="handleLoginModalUpdate"
      />
    </template>
  </a-config-provider>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import MainLayout from '@/components/layout/MainLayout.vue'
import LoginModal from '@/components/auth/LoginModal.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const isInitializing = ref(true)
const showLoginModal = ref(false)

// 处理登录成功
const handleLoginSuccess = () => {
  showLoginModal.value = false
}

// 处理登录弹窗状态更新（强制模式下不允许关闭）
const handleLoginModalUpdate = (value: boolean) => {
  // 在强制登录模式下，不允许关闭弹窗
  if (!userStore.isLoggedIn) {
    showLoginModal.value = true
  } else {
    showLoginModal.value = value
  }
}

// 监听用户登录状态变化
watch(
  () => userStore.isLoggedIn,
  (isLoggedIn) => {
    if (!isLoggedIn && !isInitializing.value) {
      // 如果用户退出登录且不是初始化阶段，显示登录弹窗
      showLoginModal.value = true
    }
  }
)

// 应用初始化
onMounted(async () => {
  try {
    // 初始化用户状态
    await userStore.initUserState()
    
    // 检查是否已登录
    if (!userStore.isLoggedIn) {
      // 未登录，显示强制登录弹窗
      showLoginModal.value = true
    }
  } catch (error) {
    console.error('App initialization failed:', error)
    // 初始化失败也显示登录弹窗
    showLoginModal.value = true
  } finally {
    isInitializing.value = false
  }
})
</script>

<style lang="scss">
@use '@/styles/quasar-variables.scss' as *;

#app {
  min-height: 100vh;
}

.app-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  
  .loading-content {
    text-align: center;
    
    p {
      margin-top: 16px;
      color: #666;
      font-size: 14px;
    }
  }
}
</style> 