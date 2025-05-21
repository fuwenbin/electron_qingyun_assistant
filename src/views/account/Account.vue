<template>
  <Page>
    <div class="page-header">
      <a-button type="primary" @click="() => $router.push('/account/add')">添加账号</a-button>
      <a-button type="primary" @click="() => $router.push('/account/sync')">同步账号</a-button>
      <a-button type="default" @click="() => $router.push('/account/manage')">账号管理</a-button>
    </div>
    <router-view />
  </Page>
  <a-modal  v-model:open="addAccountDialogOpen">
    <div>1111</div>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import Page from '@/components/Page.vue';

const addAccountDialogOpen = ref(false);
</script>

<style lang="scss" scoped>
.page-header {
  display: flex;
  gap: 10px;
  height: 60px;
  align-items: center;
  padding: 0 20px;
  background: #ffffff;
}
</style>