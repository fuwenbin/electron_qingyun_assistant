<template>
  <div class="main-layout">
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <img src="@/assets/logo.png" alt="Logo" />
          <span>青云助手</span>
        </div>
        <nav class="nav-links">
          <router-link to="/account" class="nav-link">账号</router-link>
        </nav>
        <nav class="nav-links">
          <router-link to="/publish-video" class="nav-link">发视频</router-link>
        </nav>
        <nav class="nav-links">
          <router-link to="/video/edit" class="nav-link">AI视频混剪</router-link>
        </nav>
        <!-- <nav class="nav-links">
          <router-link to="/test" class="nav-link">测试</router-link>
        </nav> -->
      </div>
      <div class="header-right">

        <div class="user-actions">
          <!-- 通知按钮 -->
          <button class="action-btn notification-btn" @click="showNotifications">
            <i class="fas fa-bell"></i>
            <span v-if="userStore.userInfo?.unreadNotifications" class="notification-badge">
              {{ userStore.userInfo.unreadNotifications }}
            </span>
          </button>
          
          <!-- 设置按钮 -->
          <button class="action-btn" @click="showSettings">
            <i class="fas fa-cog"></i>
          </button>
          
          <!-- 用户信息 -->
          <a-dropdown v-if="userStore.isLoggedIn && userStore.userInfo" placement="bottomRight" :trigger="['click']">
            <div class="user-info">
              <div class="user-avatar">
                <img :src="userStore.userInfo.avatar" :alt="userStore.userInfo.name" />
              </div>
              <div class="user-name">{{ userStore.userInfo.name }}</div>
              <i class="fas fa-chevron-down"></i>
            </div>
            <template #overlay>
              <a-menu @click="handleUserMenuClick">
                <a-menu-item key="profile">
                  <i class="fas fa-user" style="margin-right: 8px;"></i>
                  个人资料
                </a-menu-item>
                <a-menu-item key="settings">
                  <i class="fas fa-cog" style="margin-right: 8px;"></i>
                  设置
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout" class="logout-item">
                  <i class="fas fa-sign-out-alt" style="margin-right: 8px;"></i>
                  退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          
          <!-- 未登录状态 -->
          <button v-else class="action-btn login-btn" @click="showLogin">
            <i class="fas fa-user"></i>
            <span>登录</span>
          </button>
        </div>
      </div>
    </header>
    
    <main class="main-content" :class="{ 'content-expanded': isSidebarCollapsed }">
      <slot></slot>
    </main>
    
    <!-- 设置弹窗 -->
    <SettingsModal v-model:open="settingsModalOpen" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import eventBus, { sidebarState, SIDEBAR_EVENTS } from '@/utils/eventBus'
import { useUserStore } from '@/stores/user'
import SettingsModal from '@/components/settings/SettingsModal.vue'

const userStore = useUserStore()
const isSidebarCollapsed = ref(sidebarState.isCollapsed.value)
const settingsModalOpen = ref(false)

// 显示登录弹窗
const showLogin = () => {
  // 登录逻辑现在由App.vue的watch监听器自动处理
  message.info('请登录后使用')
}

// 显示通知
const showNotifications = () => {
  message.info('通知功能开发中...')
}

// 显示设置
const showSettings = () => {
  settingsModalOpen.value = true
}

// 处理用户菜单点击事件
const handleUserMenuClick = (e: any) => {
  switch (e.key) {
    case 'profile':
      showProfile()
      break
    case 'settings':
      showSettings()
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 显示个人资料
const showProfile = () => {
  message.info('个人资料功能开发中...')
}

// 处理退出登录
const handleLogout = () => {
  // 显示确认对话框
  Modal.confirm({
    title: '确认退出',
    content: '确定要退出登录吗？',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        // 执行退出登录
        await userStore.logout()
        message.success('已退出登录')
        
        // 登录状态变化会自动触发App.vue中的登录弹窗
        // 不需要手动调用showLoginModal()
      } catch (error) {
        console.error('退出登录失败:', error)
        message.error('退出登录失败')
      }
    }
  })
}

onMounted(() => {
  // 初始化用户状态
  userStore.initUserState()
  
  const unsubscribe = eventBus.on(SIDEBAR_EVENTS.TOGGLE, (value: boolean) => {
    isSidebarCollapsed.value = value
  })
  
  onUnmounted(() => {
    unsubscribe()
  })
})
</script>

<style lang="scss" scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  
  img {
    height: 32px;
    width: auto;
  }
  
  span {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
}

.nav-links {
  display: flex;
  gap: 24px;
}

.nav-link {
  color: #666;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
  
  &:hover {
    color: var(--q-primary);
  }
  
  &.router-link-active {
    color: var(--q-primary);
    font-weight: 500;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.upgrade-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: var(--q-primary);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: var(--q-primary-dark);
  }
  
  i {
    font-size: 16px;
  }
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-btn {
  position: relative;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: #666;
  cursor: pointer;
  transition: color 0.3s ease;
  
  &:hover {
    color: var(--q-primary);
  }
  
  i {
    font-size: 18px;
  }
  
  &.login-btn {
    width: auto;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    background-color: var(--q-primary);
    color: #fff;
    border-radius: 4px;
    font-size: 14px;
    
    &:hover {
      background-color: var(--q-primary-dark);
      color: #fff;
    }
  }
  
  &.notification-btn {
    .notification-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      background-color: #ff4d4f;
      color: #fff;
      border-radius: 50%;
      min-width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      line-height: 1;
    }
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background-color: #f5f5f5;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #e6f7ff;
    transform: translateY(-1px);
  }
  
  .user-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .user-name {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  i {
    font-size: 12px;
    color: #999;
    transition: transform 0.3s ease;
  }
  
  &:hover i {
    transform: rotate(180deg);
  }
}

// 下拉菜单样式
:deep(.ant-dropdown-menu) {
  min-width: 160px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  
  .ant-menu-item {
    padding: 8px 16px;
    display: flex;
    align-items: center;
    
    &:hover {
      background-color: #f5f5f5;
    }
    
    &.logout-item {
      color: #ff4d4f;
      
      &:hover {
        background-color: #fff2f0;
      }
    }
  }
  
  .ant-menu-item-divider {
    margin: 4px 0;
  }
}

.main-content {
  height: calc(100vh - 60px);
  transition: margin-left 0.3s ease;
  margin-top: 60px;
  &.content-expanded {
    margin-left: 60px;
  }
}

@media (max-width: 768px) {
  .header {
    padding: 0 16px;
  }
  
  .nav-links {
    display: none;
  }
  
  .main-content {
    margin-left: 0;
    padding: 16px;

    &.content-expanded {
      margin-left: 60px;
    }
  }
}
</style> 