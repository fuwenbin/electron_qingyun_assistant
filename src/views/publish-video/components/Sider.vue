<template>
  <div class="sider">
    <div class="sider-item" @click="router.push('/publish-video/single-publish')">
      <div class="item-name">新建视频发布</div>
    </div>
    <div class="sider-item" @click="router.push('/publish-video/batch-publish')">
      <div class="item-name">新建批量发布</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style lang="scss" scoped>
.sider-item {
  cursor: pointer;
  background: #ffffff;
  padding: 5px 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}
</style>