<template>
  <div class="video-view">
    <div class="content-area">
      <Sidebar :menu-items="menuItems" />
      <div class="main-content">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'

interface MenuItem {
  path: string
  title: string
  icon: string
  children?: MenuItem[]
}

const menuItems = ref<MenuItem[]>([
  {
    path: '/',
    title: '首页',
    icon: 'fas fa-home'
  },
  {
    path: '/ai',
    title: '创作中心',
    icon: 'fas fa-robot',
    children: [
      {
        path: '/video/edit',
        title: 'AI混剪',
        icon: 'fas fa-comments'
      },
      {
        path: '/video/create',
        title: '测试',
        icon: 'fas fa-comments'
      }
    ]
  }
])
</script>

<style lang="scss" scoped>
.video-view {
  height: 100%;
}

.content-area {
  display: flex;
  height: calc(100vh - 60px);
  margin-top: 60px;
}

.main-content {
  flex: 1;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .content-area {
    height: calc(100vh - 60px);
  }

  .main-content {
    margin-left: 0;
    padding: 16px;
  }
}
</style> 