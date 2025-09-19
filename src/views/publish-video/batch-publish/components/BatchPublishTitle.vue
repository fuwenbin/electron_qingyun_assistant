<template>
  <div class="batch-publish-title">
    <BatchPublishTitleItem v-for="(item, index) in modelValue" :key="item" 
      :modelValue="item" 
      @update:modelValue="(value: string) => changeItem(value, index)" 
      @remove="removeItem(index)"
    />
    <a-input placeholder="添加标题（5-30字）" v-model:value="inputValue"
      @keyup.enter="addTitle" @blur="addTitle" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import BatchPublishTitleItem from './BatchPublishTitleItem.vue';

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

const addTitle = (e: any) => {
  const value = e.target.value;
  if (value && !props.modelValue.includes(value)) {
    emit('update:modelValue', [...props.modelValue, value])
  }
  inputValue.value = ''
}
</script>

<style lang="scss" scoped>
.batch-publish-title {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
</style>