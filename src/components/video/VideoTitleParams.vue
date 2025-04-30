<template>
  <div class="video-title-params">
    <div class="title-name">
      {{ '设置-' + title }}
    </div>
    <div class="param-item">
      <div class="base-style">
        <a-select v-model:value="_value.fontStyle" placeholder="请选择">
          <a-select-option value="微软雅黑">微软雅黑</a-select-option>
          <a-select-option value="宋体">宋体</a-select-option>
          <a-select-option value="仿宋">仿宋</a-select-option>
          <a-select-option value="黑体">黑体</a-select-option>
          <a-select-option value="楷体">楷体</a-select-option>
        </a-select>
        <a-select v-model:value="_value.fontSize" placeholder="请选择">
          <a-select-option value="36">36</a-select-option>
          <a-select-option value="48">48</a-select-option>
          <a-select-option value="60">60</a-select-option>
        </a-select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
const props = defineProps<{
  title: string;
  modelValue: any;
}>()

const emit = defineEmits(['update:modelValue']);

const _value = reactive(props.modelValue || {
  fontStyle: 'normal',
  fontSize: 36,
  fontColor: '#ff9c20',
  fontWeight: 'normal',
  fontUnderline: false,
  fontItalic: false,
  textAlign: 'center',
});

</script>

<style scoped lang="scss">

</style>
