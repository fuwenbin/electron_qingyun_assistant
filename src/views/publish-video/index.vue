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
    title: '我的任务'
  },
  {
    path: '/publish-video/my-tasks',
    title: '我的发布'
  },
])
</script>

<style lang="scss" scoped>
.page-publish-video {
  display: flex;
  height: calc(100vh - 60px); // 这个高度是content area的高度，不包括Page的padding
}
.page-content {
  flex: 1;
  background: #f4f4f4;
  overflow: hidden; // 防止内容溢出
}
</style>