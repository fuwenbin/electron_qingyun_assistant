<template>
  <a-select :value="props.modelValue" :bordered="false"
    @update:value="(value: string) => emit('update:modelValue', value)">
    <a-select-option v-for="option in options" :key="option.value" :value="option.value">
      {{ option.label }}
    </a-select-option>
  </a-select>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{
  modelValue: string
  options?: {
    label: string,
    value: string
  }[]
}>();

const emit = defineEmits(['update:modelValue'])

const options = computed(() => {
  if (props.options) {
    return props.options;
  }
  return [{
    label: '微软雅黑',
    value: '微软雅黑'
  }, {
    label: '宋体',
    value: '宋体 常规'
  }, {
    label: '仿宋',
    value: '仿宋 常规'
  }, {
    label: '黑体',
    value: '黑体 常规'
  }, {
    label: '楷体',
    value: '楷体 常规'
  }]
})

</script>

<style scoped>

</style>
