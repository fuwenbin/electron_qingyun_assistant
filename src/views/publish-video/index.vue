<template>
  <Page class="page-publish-video">
    <Sidebar :menu-items="menuItems" />
    <div class="page-content">
      <router-view></router-view>
    </div>
  </Page>
  
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Page from '@/components/Page.vue'

interface MenuItem {
  path: string
  title: string
  icon: string
  children?: MenuItem[]
}

const menuItems = ref<MenuItem[]>([
  {
    path: '/publish-video/single-publish',
    title: '发视频',
    icon: 'fas fa-home'
  },
  {
    path: '/publish-video/my-videos',
    title: '我的视频',
    icon: 'fas fa-robot'
  },
  {
    path: '/video/edit',
    title: 'AI混剪',
    icon: 'fas fa-question'
  },
  {
    path: '/video/edit',
    title: 'AI创作',
    icon: 'fas fa-question'
  },
  {
    path: '/video/edit',
    title: '发图文/动态',
    icon: 'fas fa-question'
  }
])
</script>

<style lang="scss" scoped>
.page-publish-video {
  display: flex;
}
.page-content {
  flex: 1;
  background: #f4f4f4;
  min-height: calc(100vh - 60px);
}
</style>