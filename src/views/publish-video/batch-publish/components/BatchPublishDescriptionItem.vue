<template>
  <div class="batch-publish-title-item">
    <div class="item-content">
      <a-textarea v-if="isEditing" v-model:value="_value" @blur="handleSave" @keyup.enter="handleSave"/>
      <div v-else>{{ props.modelValue }}</div>
    </div>
    <div class="item-actions">
      <a-button v-if="!isEditing" type="primary" @click="isEditing = true">编辑</a-button>
      <a-button v-if="isEditing" type="primary" @click="handleSave">保存</a-button>
      <a-button type="primary" @click="emit('remove')">删除</a-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits(["update:modelValue", 'remove'])

const isEditing = ref(false)
const _value = ref(props.modelValue)

const handleSave = () => {
  emit('update:modelValue', _value.value)
  isEditing.value = false
}

</script>

<style lang="scss" scoped>
.batch-publish-title-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.item-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}
.item-content {
  flex: 1;
}
</style>