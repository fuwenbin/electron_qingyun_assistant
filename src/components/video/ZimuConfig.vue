<template>
  <config-panel :title="props.title + ' - 字幕与配音'" 
    @close="emit('close')">
    <div class="config-content">
      <div class="content-header">
        <div class="content-header-title">
          <div class="title-text">添加字幕内容</div>
          <div class="title-description">shift + enter 折行，enter 添加字幕中台词</div>
        </div>
        <div class="content-header-description">
          <ExclamationCircleOutlined />
          <span>多条字幕，每条成片会随机选其一来使用</span>
        </div>
      </div>
      <div class="content-body">
        <div v-for="(data, index) in _value.datas" :key="index" class="zimu-input-box">
          <div class="box-header">
            <div class="header-left">
              <div class="header-left-title">{{ data.title }}</div>
              <div class="header-left-duration">
                <span>口播时长：</span>
                <span v-if="data.duration">{{ data.duration || '未知' }}秒</span>
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
    <TextConfig v-if="_value.textConfig" v-model="_value.textConfig" />
    <div class="audio-config-box" style="margin-top: 10px;">
      <div class="audio-config-box-title" style="margin-bottom: 10px;">配音设置</div>
      <AudioConfig v-if="_value.audioConfig" v-model="_value.audioConfig" />
    </div>
    <template #footer>
      <a-button @click="handlePreview" :disabled="!hasAudioFiles" :loading="previewLoading">
        <template #icon>
          <PlayCircleOutlined />
        </template>
        试听
      </a-button>
      <a-button @click="handleReset">重置</a-button>
      <a-button type="primary" @click="handleSynthesize">合成配音</a-button>
    </template>
  </config-panel>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onUnmounted } from 'vue';
import { ExclamationCircleOutlined, PlayCircleOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import ConfigPanel from './ConfigPanel.vue';
import TextConfig from '@/components/media/text/TextConfig.vue';
import AudioConfig from '@/components/media/audio/AudioConfig.vue';

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
const previewLoading = ref(false);
const currentAudio = ref<HTMLAudioElement | null>(null);

const getZimuInputTitle = () => {
  return '字幕' + (++zimuInputIndex);
}

// 检查是否有音频文件可以试听
const hasAudioFiles = computed(() => {
  return _value.datas.some((data: any) => data.path && data.path.trim() !== '');
});

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
  _value.textConfig = {
    fontFamily: '微软雅黑',
    fontSize: 36,
    fontColor: '#FF9C20',
    fontWeight: 'normal',
    underline: false,
    italic: false,
    textAlign: 'center',
    customStyle: 'none',
    posYPercent: 2/3
  }
  _value.audioConfig = {
    voice: 'zh-CN-YunxiNeural',
    speech_rate: 0,
    volume: 50,
    pitch_rate: 0
  }
  emit('update:modelValue', undefined);
}

const handleSynthesize = async() => {
  try {
    // 获取缓存目录
    const cacheDir = await window.electronAPI.getVideoCachePath();
    
    const resList = await Promise.all(_value.datas.map(async (data: any, index: number) => {
      // 使用纯英文文件名避免 FFmpeg 路径问题
      const outputFileName = `audio_${Date.now()}_${index}`
      const params = JSON.parse(JSON.stringify({
        text: data.text,
        voice: _value.audioConfig.voice,
        format: 'mp3',
        sampleRate: 16000,
        speech_rate: _value.audioConfig.speech_rate,
        volume: _value.audioConfig.volume,
        pitch_rate: _value.audioConfig.pitch_rate,
        outputFileName: outputFileName,
        outputDir: cacheDir  // 使用缓存目录
      }))
      return await window.electronAPI.text2voice(params);
    }));
    resList.forEach((res: any, index: number) => {
      _value.datas[index].path = res.outputFile;
      _value.datas[index].duration = res.duration;
      emit('update:modelValue', _value);
    });
    message.success('合成配音成功');
  } catch (err: any) {
    console.error('合成配音失败:', err);
    message.error('合成配音失败:' + err.message);
  }
}

// 试听功能
const handlePreview = async () => {
  try {
    previewLoading.value = true;
    
    // 停止当前播放的音频
    if (currentAudio.value) {
      currentAudio.value.pause();
      currentAudio.value = null;
    }
    
    // 获取当前选中的字幕数据
    const currentData = _value.datas[selectedZimuInputIndex.value];
    if (!currentData || !currentData.path) {
      message.warning('请先合成配音');
      return;
    }
    
    // 创建音频元素并播放
    const audio = new Audio();
    audio.src = `file://${currentData.path}`;
    
    audio.onloadeddata = () => {
      message.success('开始试听');
      audio.play();
    };
    
    audio.onerror = () => {
      message.error('音频文件加载失败');
    };
    
    audio.onended = () => {
      message.info('试听结束');
    };
    
    currentAudio.value = audio;
    
  } catch (error: any) {
    console.error('试听失败:', error);
    message.error('试听失败: ' + error.message);
  } finally {
    previewLoading.value = false;
  }
}

const handleChangeZimuInput = (index: number, value: string) => {
  _value.datas[index].text = value;
  emit('update:modelValue', _value);
}

watch(() => _value, (newVal) => {
  emit('update:modelValue', newVal);
}, { deep: true });

if (_value?.datas.length === 0) {
  handleReset();
}

// 组件卸载时清理音频
onUnmounted(() => {
  if (currentAudio.value) {
    currentAudio.value.pause();
    currentAudio.value = null;
  }
});
</script>

<style scoped lang="scss">
.config-content {
  .content-header {

    .content-header-title {
      align-items: center;
      .title-text {
        font-size: 16px;
        font-weight: 600;
        color: #000;
      }
      .title-description {
        font-size: 12px;
        color: #999;
      }
    }
    .content-header-description {
      color: #1677ff;
      font-size: 12px;
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
