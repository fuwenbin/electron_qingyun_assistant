<template>
  <config-panel :title="props.title + ' - 字幕与配音'" 
    @close="emit('close')">
    <template #body>
      <div class="config-content">
        <div class="content-header">
          <div class="content-header-title">
            <span class="title-text">添加字幕内容</span>
            <span class="title-description">shift + enter 折行，enter 添加字幕中台词</span>
          </div>
          <div class="content-header-description">
            <ExclamationCircleOutlined />
            <span>若添加多条字幕，最终每条成片会随机选其一来使用</span>
          </div>
        </div>
        <div class="content-body">
          <div v-for="(data, index) in _value.datas" :key="index" class="zimu-input-box">
            <div class="box-header">
              <div class="header-left">
                <div class="header-left-title">{{ data.title }}</div>
                <div class="header-left-duration">
                  <span>口播时长：</span>
                  <span>{{ data.duration || '未知' }}</span>
                </div>
                <a-tooltip title="点击下方合成配音按钮生成口播时长">
                  <ExclamationCircleOutlined />
                </a-tooltip>
              </div>
              <div class="header-right">
                <a-button v-if="_value.datas.length > 1 && selectedZimuInputIndex === index" type="text" 
                  @click="handleDeleteZimuInput(index)">删除</a-button>
              </div>
            </div>
            <div class="box-content">
              <a-textarea :value="data.text" placeholder="请输入字幕内容" show-count  
                :auto-size="{ minRows: 5 }" :maxlength="300" @update:value="(value: string) => handleChangeZimuInput(index, value)"/>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <a-button @click="handleReset">重置</a-button>
      <a-button type="primary" @click="handleSynthesize">合成配音</a-button>
    </template>
  </config-panel>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import ConfigPanel from './ConfigPanel.vue';
import dayjs from 'dayjs';
const props = defineProps<{
  rootName: string;
  title: string;
  modelValue: any;
}>();

const _value = reactive(props.modelValue || {
  datas: []
});

const emit = defineEmits(['close', 'update:modelValue']);
let zimuInputIndex = 0;
const selectedZimuInputIndex = ref<number>(0);

const getZimuInputTitle = () => {
  return '字幕' + (++zimuInputIndex);
}

const handleDeleteZimuInput = (index: number) => {
  _value.datas.splice(index, 1);
  emit('update:modelValue', _value);
}

const handleReset = () => {
  _value.datas = [{
      title: getZimuInputTitle(),
      text: '',
      duration: 0
  }];
  _value.selectedIndex = 0;
  emit('update:modelValue', undefined);
}

const handleSynthesize = async() => {
  try {
    const resList = await Promise.all(_value.datas.map(async (data: any) => {
      const outputFileName = `${props.rootName}_${props.title}_${data.title}_${dayjs().format('YYYYMMDDHHmmss')}`
      const params = JSON.parse(JSON.stringify({
        text: data.text,
        voice: 'xiaoyun',
        format: 'mp3',
        sampleRate: 16000,
        outputFileName: outputFileName
      }))
      return await window.electronAPI.text2voice(params);
    }));
    resList.forEach((res: any, index: number) => {
      _value.datas[index].path = res.outputFile;
      _value.datas[index].duration = res.duration;
      emit('update:modelValue', _value);
    });
  } catch (err) {
    console.error('语音合成失败:', err);
  }
  console.log('合成配音');
}

const handleChangeZimuInput = (index: number, value: string) => {
  _value.datas[index].text = value;
  emit('update:modelValue', _value);
}

if (_value?.datas.length === 0) {
  handleReset();
}
</script>

<style scoped lang="scss">
.config-content {
  .content-header {
    .content-header-title {
      height: 32px;
      align-items: center;
      .title-text {
        font-size: 16px;
        font-weight: 600;
        color: #000;
      }
      .title-description {
        font-size: 12px;
        color: #999;
        margin-left: 8px;
      }
    }
    .content-header-description {
      color: #1677ff;
      
    }
  } 
}

.zimu-input-box {
  background: #f5f5f5;
  padding: 6px;
  border-radius: 4px;
  .box-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px;
    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      .header-left-title {
        font-size: 16px;
        font-weight: 600;
        color: #000;
      }
      .header-left-duration {
        font-size: 12px;
        color: #6c6a6a;
        border: 1px solid #6c6a6a;
        padding: 4px 8px;
        border-radius: 4px;
      }
    }
  }
}
</style>
