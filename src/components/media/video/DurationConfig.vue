<template>
  <div class="duration-config">
    <a-input-number v-model:value="props.value" :min="0" :step="1" 
      @change="(value: number) => emit('update:value', value)" />
    <span>秒</span>
  </div>
</template>

<script setup lang="ts">

const props = defineProps<{
  value: number;
}>();

const emit = defineEmits(['update:value']);

</script>

<style scoped lang="scss">
.duration-config {
  display: flex;
  align-items: center;
  gap: 10px;
  :deep(.ant-input-number-input) {
    text-align: center;
  }
}
</style>