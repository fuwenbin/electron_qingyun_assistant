<template>
  <div class="tts-config">
    <div class="config-item">
      <div class="item-label">TTS 服务</div>
      <div class="item-content">
        <a-tag color="green" style="font-size: 14px; padding: 4px 8px;">
          Edge TTS (免费)
        </a-tag>
        <span style="margin-left: 8px; color: #666; font-size: 12px;">
          已锁定为 Edge TTS 服务
        </span>
      </div>
    </div>
    
    
    <div class="config-item">
      <div class="item-label">服务状态</div>
      <div class="item-content">
        <a-tag :color="serviceStatus.color">
          {{ serviceStatus.text }}
        </a-tag>
      </div>
    </div>
    
    <div class="config-item">
      <div class="item-label">操作</div>
      <div class="item-content">
        <a-button @click="testTTS" :loading="testing">
          测试语音合成
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';

const currentConfig = ref({
  service: 'edge' as 'edge'
});

const testing = ref(false);

// 服务状态
const serviceStatus = computed(() => {
  return {
    color: 'green',
    text: 'Edge TTS (免费，无需配置)'
  };
});

// 加载当前配置
const loadConfig = async () => {
  try {
    const config = await window.electronAPI.getTTSConfig();
    currentConfig.value = config;
  } catch (error) {
    console.error('获取 TTS 配置失败:', error);
  }
};

// 配置已锁定为 Edge TTS，无需保存

// 服务已锁定为 Edge TTS，无需切换


// 测试 TTS
const testTTS = async () => {
  try {
    testing.value = true;
    const result = await window.electronAPI.text2voice({
      text: '这是一个语音合成测试',
      voice: 'zh-CN-YunxiNeural',
      format: 'mp3'
    });
    
    if (result.success) {
      message.success('语音合成测试成功！');
    } else {
      message.error('语音合成测试失败');
    }
  } catch (error: any) {
    console.error('TTS 测试失败:', error);
    message.error(`TTS 测试失败: ${error.message}`);
  } finally {
    testing.value = false;
  }
};

// 语音列表已固定，无需刷新

onMounted(() => {
  loadConfig();
});
</script>

<style scoped lang="scss">
.tts-config {
  .config-item {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    
    .item-label {
      width: 100px;
      font-weight: 500;
      color: #333;
    }
    
    .item-content {
      flex: 1;
    }
  }
}
</style>
