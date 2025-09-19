<template>
  <div class="text-align-chooser">
    <AlignLeftOutlined class="text-align-chooser-item" :class="{ active: props.modelValue === 'left' }" 
      @click="changeAlign('left')" />
    <AlignCenterOutlined class="text-align-chooser-item" :class="{ active: props.modelValue === 'center' }" 
      @click="changeAlign('center')" />
    <AlignRightOutlined class="text-align-chooser-item" :class="{ active: props.modelValue === 'right' }" 
      @click="changeAlign('right')" />
  </div>
</template>

<script setup lang="ts">
import { AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined } from '@ant-design/icons-vue';

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits(['update:modelValue'])

const changeAlign = (align: string) => {
  emit('update:modelValue', align)
}
</script>

<style scoped lang="scss">
.text-align-chooser {
  display: flex;
  align-items: center;
  .text-align-chooser-item {
    font-size: 16px;
    padding: 5px;
    cursor: pointer;
    &.active {
      color: #1677ff;
    }
  }
}


</style>
