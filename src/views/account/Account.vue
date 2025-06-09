<template>
  <Page>
    <div class="page-header">
      <a-button type="primary" @click="accountAddModelOpen = true">添加账号</a-button>
      <a-button type="primary" @click="accountSyncModelOpen = true">同步账号</a-button>
      <a-button type="default" @click="() => router.push('/account/manage')">账号管理</a-button>
    </div>
    <div class="page-body">
      <div class="account-list-container">
        <div class="container-header">
          <div class="header-left">
            <span>全部({{ accountList.length }})</span>
          </div>
        </div>
        <div class="account-list custom-scroll">
          <div class="account-item" v-for="item in accountList" :key="item.id">
            <div class="item-logo">
              <img :src="item.logo" alt="">
            </div>
            <div class="item-name">
              {{ item.name }}
            </div>
          </div>
        </div>
        <div class="container-footer"></div>
      </div>
      <div class="webview-list-container">

      </div>
    </div>
  </Page>
  <AccountAddModal v-model:open="accountAddModelOpen" @refresh="getAccountList"/>
  <AccountSyncModal v-model:open="accountSyncModelOpen" />
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import Page from '@/components/Page.vue';
import { useRouter } from 'vue-router';
import AccountAddModal from './components/AccountAddModal.vue';
import AccountSyncModal from './components/AccountSyncModal.vue';

const accountAddModelOpen = ref(false);
const accountSyncModelOpen = ref(false);
const router = useRouter();

const accountList = ref<any>([])

const getAccountList = async () => {
  const res = await window.electronAPI.apiRequest({
    url: '/platform-account/list',
    method: 'GET'
  })
  if (res.code === 0) { 
    accountList.value = res.data
  }
}

onMounted(() => {
  getAccountList()
})
</script>

<style lang="scss" scoped>
@import "@/assets/styles/custom-scroll.scss";
.page-header {
  display: flex;
  gap: 10px;
  height: 60px;
  align-items: center;
  padding: 0 20px;
  background: #ffffff;
}

.page-body {
  display: flex;
  align-items: center;
}
.account-list-container {
  width: 300px;
  border-right: 1px solid #cccccc;
  .container-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 60px;
    padding: 0 20px;
  }
  .account-list {
    height: calc(100vh - 240px);
    .account-item {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 10px 20px;
      cursor: default;
      &:hover {
        background: #cccccc;
      }
      .item-logo {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
        }
      }
      .item-name {
        width: 205px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
    }
  }
}
</style>