<template>
  <div class="media-merger">
    <a-card title="多轨媒体合成器">
      <!-- 视频轨道 -->
      <a-card-grid class="track-section">
        <h3>视频轨道 ({{ videoFiles.length }})</h3>
        <a-upload
          multiple
          accept="video/*"
          :file-list="videoFiles"
          :before-upload="beforeVideoUpload"
        >
          <a-button>
            <upload-outlined /> 添加视频
          </a-button>
        </a-upload>
      </a-card-grid>

      <!-- 音频轨道 -->
      <a-card-grid class="track-section">
        <h3>音频轨道 ({{ audioFiles.length }})</h3>
        <a-upload
          multiple
          accept="audio/*"
          :file-list="audioFiles"
          :before-upload="beforeAudioUpload"
        >
          <a-button>
            <upload-outlined /> 添加音频
          </a-button>
        </a-upload>
        
      </a-card-grid>

      <!-- 控制区 -->
      <a-card-grid class="control-section">
        <a-space>
          <a-button
            type="primary"
            @click="handleMerge"
            :disabled="!canMerge"
            :loading="merging"
            size="large"
          >
            <template #icon><merge-cells-outlined /></template>
            开始合成
          </a-button>
          <a-button 
            @click="previewResult" 
            :disabled="!outputPath"
            size="large"
          >
            <template #icon><play-circle-outlined /></template>
            预览结果
          </a-button>
        </a-space>
        <a-progress
          v-if="progress > 0"
          :percent="progress"
          :status="progress === 100 ? 'success' : 'active'"
          class="progress-bar"
        />
        <div v-if="outputPath" class="output-info">
          <span>输出文件: {{ outputPath }}</span>
        </div>
      </a-card-grid>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import {
  UploadOutlined,
  MergeCellsOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons-vue';
import type { UploadProps } from 'ant-design-vue';
import { message } from 'ant-design-vue';

// 响应式数据
const videoFiles = ref<string[]>([]);
const audioFiles = ref<string[]>([]);
const audioVolumes = ref<number[]>([]);
const outputPath = ref<string>('');
const merging = ref<boolean>(false);
const progress = ref<number>(0);

// 计算属性
const canMerge = computed(() => {
  return true;
});

// 获取文件URL
const getFileUrl = (file: any): string => {
  return file.url || URL.createObjectURL(file.originFileObj);
};

const beforeVideoUpload: UploadProps['beforeUpload'] = (file) => {
  console.log(file);
  videoFiles.value?.push(file.path);
  message.info('视频文件: ' + file.name);
  return false;
};

const beforeAudioUpload: UploadProps['beforeUpload'] = (file) => {
  audioFiles.value?.push(file.path);
  message.info('音频文件: ' + file.name);
  return false;
};


// 合成处理
const handleMerge = async () => {
  if (!canMerge.value) return;

  merging.value = true;
  progress.value = 0;

  try {
    // 获取保存路径
    const saveResult = await window.electronAPI.showSaveDialog({
      title: '保存合成视频',
      defaultPath: `merged_${Date.now()}.mp4`,
      filters: [{ name: 'MP4 Videos', extensions: ['mp4'] }],
    });

    if (saveResult.canceled || !saveResult.filePath) {
      throw new Error('保存操作已取消');
    }
    message.info('保存路径: ' + saveResult.filePath);

    // 准备文件路径
    const videoPaths = videoFiles.value.map(v => v.toString()) || [];
    const audioPaths = audioFiles.value.map(v => v.toString()) || [];
    message.info('视频路径: ' + videoPaths);
    message.info('音频路径: ' + audioPaths);

    // 设置进度监听
    const unsubscribe = window.electronAPI.onProgress((percent) => {
      progress.value = percent;
    });

    const mergeMidaParams = {
      videoPaths,
      audioPaths,
      outputPath: saveResult.filePath,
      audioVolumes: audioVolumes.value.map(_ => 1),
    }
    console.log(mergeMidaParams);

    // 执行合成
    outputPath.value = await window.electronAPI.mergeMedia(mergeMidaParams);

    message.success('媒体合成成功！');
  } catch (error: any) {
    message.error(`合成失败: ${error.message}`);
    console.error('合成错误详情:', error);
  } finally {
    merging.value = false;
  }
};

// 预览结果
const previewResult = () => {
  if (outputPath.value) {
    window.electronAPI.openFile(outputPath.value);
  }
};

// 组件卸载时清理
onUnmounted(() => {
  // 清理对象URL
  videoFiles.value?.forEach(file => {
    if (file.url) URL.revokeObjectURL(file.url);
  });
  audioFiles.value?.forEach(file => {
    if (file.url) URL.revokeObjectURL(file.url);
  });
});
</script>

<style scoped>
.media-merger {
  padding: 20px;
}

.track-section {
  width: 100%;
  padding: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.control-section {
  width: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.track-list {
  margin-top: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.track-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #fafafa;
}

.track-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.track-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
}

.progress-bar {
  margin-top: 16px;
}

.output-info {
  margin-top: 8px;
  padding: 8px;
  background-color: #f6f6f6;
  border-radius: 4px;
  word-break: break-all;
}
</style>