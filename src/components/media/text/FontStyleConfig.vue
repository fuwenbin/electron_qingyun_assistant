<template>
  <div class="font-style-config">
    <BoldOutlined class="font-style-config-item"  :class="{ active: props.fontWeight === 'bold' }" 
      @click="toggleFontWeight"/>
    <UnderlineOutlined class="font-style-config-item" :class="{ active: props.underline }" 
      @click="toggleUnderline"/>
    <ItalicOutlined class="font-style-config-item" :class="{ active: props.italic }" 
      @click="toggleItalic"/>
  </div>
</template>

<script setup lang="ts">
import { withDefaults } from 'vue'
import { BoldOutlined, UnderlineOutlined, ItalicOutlined } from '@ant-design/icons-vue'

const props = withDefaults(defineProps<{
  fontWeight: string,
  underline: boolean,
  italic: boolean
}>(), {
  fontWeight: 'normal',
  underline: false,
  italic: false
})

const emit = defineEmits(['update:fontWeight', 'update:underline', 'update:italic'])

const toggleFontWeight = () => {
  emit('update:fontWeight', props.fontWeight === 'normal' ? 'bold' : 'normal')
}

const toggleUnderline = () => {
  emit('update:underline', !props.underline)
}

const toggleItalic = () => {
  emit('update:italic', !props.italic)
}
</script>

<style scoped lang="scss">
.font-style-config {
  display: flex;
  align-items: center;
  justify-content: space-around;
}
.font-style-config-item {
  font-size: 16px;
  padding: 5px;
  cursor: pointer;
  &.active {
    color: #1677ff;
  }
}

</style>
