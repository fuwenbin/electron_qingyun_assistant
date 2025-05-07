<template>
  <a-modal>
    <video :src="props.src" controls />
  </a-modal>
</template>

<script lang="ts" setup> 
const props = defineProps<{
  open: boolean;
  src: string;
}>()
</script>

<style scoped lang="scss">

</style>