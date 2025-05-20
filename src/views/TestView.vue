<template>
  <div class="page">
    <a-button type="primary" @click="test">Click</a-button>
  </div>
</template>

<script lang="ts" setup>
const test = () => {
  console.log('test')
}
</script>

<style lang="scss" scoped>
.page {
  padding-top: 60px;
}
</style>