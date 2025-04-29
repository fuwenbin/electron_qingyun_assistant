<template>
  <config-panel :title="title + '-文字标题'" @close="emit('close')">
    <div class="video-title-input-box">
      <template v-for="(item, index) in _value.datas" :key="item.name">
        <a-textarea :value="item.text" placeholder="请输入内容" :autosize="{minRows: 1}" 
          @update:value="(value: string) => handleChangeTitleInput(index, value)" />
      </template>
      <a-button v-if="false" @click="addTitle">
        <template #icon>
          <PlusOutlined />
        </template>
        <span>添加标题</span>
      </a-button>
    </div>
    <template #footer>
      <a-button @click="emit('close')">关闭</a-button>
      <a-button @click="handleReset">重置</a-button>
    </template>
  </config-panel>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import ConfigPanel from './ConfigPanel.vue';
import { PlusOutlined } from '@ant-design/icons-vue';

const props = defineProps<{
  rootName: string;
  title: string;
  modelValue: any;
}>()

const emit = defineEmits(['update:modelValue', 'close']);

let titleNo = 0;

const _value = reactive(props.modelValue || {
  datas: []
});

const addTitle = () => {
  _value.datas.push({
    name: `标题${++titleNo}`,
  });
}


const getTitleName = () => {
  return '文字' + (++titleNo);
}

const handleReset = () => {
  _value.datas = [{
      title: getTitleName(),
      text: '',
      duration: 0
  }];
  _value.selectedIndex = 0;
  emit('update:modelValue', undefined);
}

const handleChangeTitleInput = (index: number, text: string) => {
  _value.datas[index].text = text;
  emit('update:modelValue', _value);
}

if (_value.datas.length === 0) {
  handleReset();
}
</script>

<style scoped lang="scss">
.video-title-config {
  width: 100%;
}
</style>
