<template>
  <Page class="page-publish-video">
    <Sidebar :menu-items="menuItems" />
    <div class="page-content">
      <div class="content-container">
        <div class="content-sider">
          <div class="sider-item">
            <a-icon class="item-icon" />
            <div class="item-name">新建视频发布</div>
          </div>
          <div class="sider-item">
            <a-icon class="item-icon" />
            <div class="item-name">新建批量发布</div>
          </div>
          <div class="sider-item">
            <a-icon class="item-icon" />
            <div class="item-name">一键设置话题</div>
          </div>
          <div class="sider-item">
            <a-icon class="item-icon" />
            <div class="item-name">位置设置</div>
          </div>
          <div class="sider-item">
            <a-icon class="item-icon" />
            <div class="item-name">购物车设置</div>
          </div>
        </div>
        <div class="content-body">
          <router-view></router-view>
        </div>
      </div>
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
      }
    ]
  },
  {
    path: '/test',
    title: '测试',
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
  padding-top: 10px;
  padding-left: 20px;
  min-height: calc(100vh - 130px);
  .content-container {
    max-width: 1750px;
    min-width: 1385px;
    margin: 0 auto;
    display: flex;
  }
  .content-sider {
    margin-right: 20px;
    .sider-item {
      cursor: pointer;
      background: #ffffff;
      padding: 5px 10px;
      border-radius: 4px;
      margin-bottom: 10px;
    }
  }
}
</style>