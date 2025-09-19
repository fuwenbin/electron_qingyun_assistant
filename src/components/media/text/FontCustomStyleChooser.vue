<template>
  <div class="font-custom-style-chooser">
    <div v-for="item in options" :key="item" class="chooser-item" :class="{ 'active': modelValue === item}" 
      @click="() => emit('update:modelValue', item)" >
      <StopOutlined v-if="item === 'none'"/>
      <span :class="item" v-else>花字</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { StopOutlined } from '@ant-design/icons-vue';
const props = defineProps<{
  modelValue: string,
  options?: string[]
}>()

const emit = defineEmits(['update:modelValue'])

const options = computed(() => {
  if (props.options) {
    return props.options
  }
  return ['none', 'custom-style-1', 'custom-style-2', 'custom-style-3', 'custom-style-4', 'custom-style-5', 
    'custom-style-6', 'custom-style-7', 'custom-style-8', 'custom-style-9', 'custom-style-10', 'custom-style-11']
})




</script>

<style scoped lang="scss">
@import '@/assets/styles/custom-text-style.scss';

.font-custom-style-chooser {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  .chooser-item {
    font-size: 20px;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    border: 1px solid #ccc;
    cursor: pointer;
    font-weight: 800;
    &.active {
      border-color: #1890ff;
    }
  }
}
</style>
