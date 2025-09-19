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

const menuItems = ref<any[]>([
  {
    path: '/publish-video/batch-publish',
    title: '发视频'
  },
  {
    path: '/publish-video/my-settings',
    title: '我的配置'
  },
  {
    path: '/publish-video/my-tasks',
    title: '我的发布'
  },
  {
    path: '/video/edit',
    title: 'AI混剪'
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