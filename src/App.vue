<template>
  <a-config-provider :locale="zhCN">
    <MainLayout>
      <router-view />
    </MainLayout>
  </a-config-provider>
</template>

<script setup lang="ts">
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import MainLayout from '@/components/layout/MainLayout.vue'
</script>

<style lang="scss">
@use '@/styles/quasar-variables.scss' as *;

#app {
  min-height: 100vh;
}
</style> 