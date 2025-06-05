<template>
  <div class="batch-publish-description">
    <BatchPublishDescriptionItem v-for="(item, index) in modelValue" :key="item" 
      :modelValue="item" 
      @update:modelValue="(value: string) => changeItem(value, index)" 
      @remove="removeItem(index)"
    />
    <a-textarea placeholder="添加视频简介" v-model:value="inputValue"
      @keyup.enter="addItem" @blur="addItem" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import BatchPublishDescriptionItem from './BatchPublishDescriptionItem.vue';

const props = defineProps<{
  modelValue: string[]
}>()

const emit = defineEmits(['update:modelValue'])

const inputValue = ref('')

const changeItem = (value: string, index: number) => {
  const newValue = props.modelValue.map((item, i) => {
    if (i === index) {
      return value
    }
    return item
  })
  emit('update:modelValue', newValue)
}

const removeItem = (index: number) => {
  const newValue = props.modelValue.filter((_, i) => i !== index)
  emit('update:modelValue', newValue)
}

const addItem = (e: any) => {
  const value = e.target.value;
  if (value && !props.modelValue.includes(value)) {
    emit('update:modelValue', [...props.modelValue, value])
  }
  inputValue.value = ''
}
</script>

<style lang="scss" scoped>
.batch-publish-description {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
</style>