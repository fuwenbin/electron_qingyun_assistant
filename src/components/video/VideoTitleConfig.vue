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
    <template v-for="(item, index) in _value.datas" :key="item.name">
      <div class="style-config">
        <div class="style-config-title">
          <span>{{ item.title }}</span>
        </div>
        <TextConfig :modelValue="item.textConfig" @update:model-value="handleChangeTextConfig"/>
        <div class="style-config-item">
          <div class="item-label">开始时间</div>
          <div class="item-content">
            <StartTimeConfig :value="item.start"
              @update:value="(value: number) => handleChangeStartTime(index, value)" />
          </div>
        </div>
        <div class="style-config-item">
          <div class="item-label">
            <span class="label-title">持续时间</span>
            <span class="label-tip">（默认持续时间是素材结束时间,可手动设置）</span>
          </div>
          <div class="item-content">
            <DurationConfig :value="item.duration"
              @update:value="(value: number) => handleChangeDuration(index, value)" />
          </div>
        </div>
      </div>

    </template>
    <template #footer>
      <a-button @click="emit('close')">关闭</a-button>
      <a-button @click="handleReset">重置</a-button>
    </template>
  </config-panel>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import ConfigPanel from './ConfigPanel.vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import TextConfig from '@/components/media/text/TextConfig.vue';
import StartTimeConfig from '@/components/media/video/StartTimeConfig.vue';
import DurationConfig from '@/components/media/video/DurationConfig.vue';


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

const getDefaultConfig = () => {
  return {
    text: '',
    textConfig: {
      fontFamily: 'Microsoft YaHei',
      fontSize: 36,
      fontWeight: 'bold'
    },
    start: 0,
    duration: 0
  }
}

const addTitle = () => {
  const defaultConfig = JSON.parse(JSON.stringify(getDefaultConfig()));
  _value.datas.push({
    name: `标题${++titleNo}`,
    ...defaultConfig
  });
}


const getTitleName = () => {
  return '标题' + (++titleNo);
}

const handleReset = () => {
  const defaultConfig = JSON.parse(JSON.stringify(getDefaultConfig()));
  _value.datas = [{
      name: getTitleName(),
      ...defaultConfig
  }];
  _value.selectedIndex = 0;
  emit('update:modelValue', undefined);
}

const handleChangeTitleInput = (index: number, text: string) => {
  _value.datas[index].text = text;
  emit('update:modelValue', _value);
}

const handleChangeTextConfig = (index: number, value: any) => {
  _value.datas[index].textConfig = value;
  emit('update:modelValue', _value);
}

const handleChangeStartTime = (index: number, value: number) => {
  _value.datas[index].start = value;
  emit('update:modelValue', _value);
}

const handleChangeDuration = (index: number, value: number) => {
  _value.datas[index].duration = value;
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
.style-config-item {
  margin-top: 10px;
  .item-label {
    .label-tip {
      font-size: 12px;
      color: #1890ff;
    }
  }
}
</style>
