<template>
  <div class="color-picker">
    <a-popover trigger="click" v-model:open="pickerOpen">
      <template #content>
        <div class="color-picker-content">
          <div class="color-picker-panel"></div>
          <div class="common-color-list">
            <div class="common-color-item" v-for="color in commonColors" :key="color" :style="{ backgroundColor: color }" 
              @click="handleColorChange(color)" :class="{ 'active': color === props.value }"></div>
          </div>
          <div class="custom-color-input">
            <a-input v-model:value="customColorInput" placeholder="请输入颜色" />
            <a-button type="primary" @click="handleCustomColorChange">确定</a-button>
          </div>
        </div>
      </template>
      <div class="color-picker-placeholder" :style="{ backgroundColor: props.value }">
        <DownOutlined  style="font-size: 12px;color:#fff;"/>
      </div>
    </a-popover>
  </div>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue';
import { DownOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
const props = defineProps<{
  value: string;
  commonColors?: string[];
}>();

const emit = defineEmits(['update:value']);

const commonColors = computed(() => {
  return props.commonColors || ['#FF0000', '#DC0A0A', '#FF4500', '#F8622A', '#FF8C00', '#FFB55C', '#D77A0A', 
    '#FFD700', '#FFDF33', '#CFB10E', '#00FF00', '#90EE90', '#0DCF0D', '#06F4C4', '#00CED1', '#2CEDCC',
    '#27F2F5', '#1E90FF', '#387CEA', '#3E94E7', '#C370EE', '#961DD5', '#C71585', '#F4089C'];
});

const customColorInput = ref(props.value);

const pickerOpen = ref(false);

const handleColorChange = (color: string) => {
  customColorInput.value = color;
  emit('update:value', color);
}

const handleCustomColorChange = () => {
  // 判断是否是合法的颜色值
  if (/^#[0-9abcdefABCDEF]{6}$/.test(customColorInput.value)) {
    emit('update:value', customColorInput.value);
    pickerOpen.value = false;
  } else {
    message.error('请输入合法的颜色值');
  }
}
</script>

<style scoped lang="scss">
.color-picker-placeholder {
  width: 25px;
  height: 25px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.color-picker-content {
  width: 250px;
}
.common-color-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.common-color-item {  
  width: 20px;
  height: 20px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  &.active {
    border-color: #1677ff;
  }
}
.custom-color-input {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
}

</style>


