<template>
  <div class="voice-chooser">
    <a-select :value="props.value" @update:value="(value: string) => emit('update:value', value)">
      <a-select-option v-for="item in options" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
    </a-select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value: string
  options?: any[]
}>()

const emit = defineEmits(['update:value'])

const options = computed(() => {
  return props.options || [{
    label: '小云',
    value: 'xiaoyun'
  }]
})

</script>

<style scoped lang="scss">
</style>
