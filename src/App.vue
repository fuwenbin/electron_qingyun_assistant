<template>
  <MainLayout>
    <router-view />
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/components/layout/MainLayout.vue'
</script>

<style lang="scss">
@use '@/styles/quasar-variables.scss' as *;

#app {
  min-height: 100vh;
}
</style> 