<template>
  <a-select :value="props.modelValue" :bordered="false"
    @update:value="(value: number) => emit('update:modelValue', value)">
    <a-select-option v-for="option in options" :key="option" :value="option">
      {{ option }}
    </a-select-option>
  </a-select>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{
  modelValue: number,
  options?: number[]
}>()

const emit = defineEmits(['update:modelValue'])

const options = computed(() => {
  if (props.options) {
    return props.options
  }
  return [12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 44, 48, 56, 62, 64, 68, 72, 80]
})
</script>

<style scoped>

</style>
