<template>
  <div class="text-config">
    <div class="text-config-item">
      <div class="item-label">字体设置</div>
      <div class="item-content">
        <div class="font-basic-config">
          <div class="left-part part-box">
            <FontFamilySelect v-model="_value.fontFamily" />
            <a-divider type="vertical" class="divider" />
            <FontSizeSelect v-model="_value.fontSize" />
            <a-divider type="vertical" class="divider" />
            <ColorPicker v-model:value="_value.fontColor"/>
            <a-divider type="vertical" class="divider" />
            <FontStyleConfig v-model:fontWeight="_value.fontWeight" v-model:underline="_value.underline" 
              v-model:italic="_value.italic" style="width: 50px;"/>
          </div>
          <div class="right-part part-box">
            <TextAlignChooser v-model="_value.textAlign" />
          </div>
        </div>
        
      </div>
    </div>
    <div class="text-config-item">
      <div class="item-label">字体样式</div>
      <div class="item-content">
        <FontLevelChooser :value="_value" @update:value="handleFontLevelChange"/>
      </div>
    </div>
    <div class="text-config-item">
      <div class="item-label">花字设置</div>
      <div class="item-content">
        <FontCustomStyleChooser :model-value="_value.customStyle" @update:model-value="(value: string) => handleCustomStyleChange(value)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import FontFamilySelect from './FontFamilySelect.vue';
import FontSizeSelect from './FontSizeSelect.vue';
import FontStyleConfig from './FontStyleConfig.vue';
import TextAlignChooser from './TextAlignChooser.vue';
import FontLevelChooser from './FontLevelChooser.vue';
import FontCustomStyleChooser from './FontCustomStyleChooser.vue';
import ColorPicker from './ColorPicker.vue';

const props = defineProps<{
  modelValue: any
}>();

const _value = reactive(JSON.parse(JSON.stringify(props.modelValue)) || {
  fontFamily: '微软雅黑',
  fontSize: 36,
  fontColor: '#000000',
  fontWeight: 'normal',
  underline: false,
  italic: false,
  textAlign: 'center',
  customStyle: 'none',
});

const emit = defineEmits(['update:modelValue']);

watch(() => _value, (newVal) => {
  emit('update:modelValue', newVal);
}, { deep: true });

const handleFontLevelChange = (value: any) => {
  _value.fontSize = value.fontSize;
  _value.fontWeight = value.fontWeight;
}
const handleCustomStyleChange = (value: any) => {
  _value.customStyle = value;
}
const handleFontColorChange = (value: string) => {
  _value.fontColor = value;
}
</script>

<style lang="scss" scoped>
.font-basic-config {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  .part-box {
    display: flex;
    align-items: center;
    padding: 5px;
    border: 1px solid #999;
    border-radius: 4px;
    flex-wrap: wrap;
    gap: 4px;
    .divider {
      height: 20px;
    }
  }
}
</style>


