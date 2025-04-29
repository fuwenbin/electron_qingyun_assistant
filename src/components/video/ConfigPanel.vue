<template>
  <div class="config-panel">
    <slot name="header">
      <div class="config-panel-header">
        <div class="header-left">
          <slot name="title">
            <div v-if="props.title" class="config-panel-header-title">{{ props.title }}</div>
          </slot>
        </div>
        <div class="header-right">
          <CloseOutlined v-if="props.closeable" class="close-icon" @click="emit('close')" />
        </div>
      </div>
    </slot>
    <div class="config-panel-body custom-scroll">
      <slot name="body"></slot>
    </div>
    <div class="config-panel-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CloseOutlined } from '@ant-design/icons-vue';
const props = withDefaults(defineProps<{
  title?: string,
  closeable?: boolean
}>(), {
  closeable: true
})
const emit = defineEmits(['close'])
</script>

<style scoped lang="scss">
@import '@/assets/styles/custom-scroll.scss';

.config-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
.config-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  height: 60px;
}
.config-panel-header-title {
  font-size: 16px;
  font-weight: 600;
  color: #000;
}
.close-icon {
  font-size: 16px;
  color: #000;
  cursor: pointer;
}
.config-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.config-panel-footer {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  height: 60px;
}
</style>
