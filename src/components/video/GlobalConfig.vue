<template>
  <config-panel title="全局内容配置" @close="emit('close')">
    <div class="config-header">
      <div class="config-header-subtitle">配置整体视频的口播、字幕、文字等信息</div>
      <div class="config-header-tip">
        <ExclamationCircleOutlined />
        <span>若全局口播时长大于最终生成的视频时长,将对超出视频时长的口播从尾部进行截取</span>
      </div>
    </div>
    <div class="config-body">
      <div class="config-body-item">
        <div class="item-title">存放路径</div>
        <div class="item-content">
          <div>{{ props.modelValue.outputDir }}</div>
          <a-button style="margin-left: 8px;" @click="changeSaveFolder">修改</a-button>
        </div>
      </div>
      <div class="config-body-item">
        <div class="item-title">全局字幕与配音</div>
        <div class="item-content">
          <template v-if="props.modelValue.zimuConfig">
            <a-button @click="emit('changeConfigIndex', 'globalZimuConfig')">
              <template #icon>
                <EditOutlined />
              </template>
              <span>编辑字幕</span>
            </a-button>
            <CloseOutlined v-if="props.modelValue.zimuConfig" style="margin-left: 8px;"
              @click="deleteGlobalZimuConfig" />
          </template>
          <template v-else>
            <a-button @click="emit('changeConfigIndex', 'globalZimuConfig')">
              <template #icon>
                <PlusOutlined />
              </template>
              <span>添加字幕</span>
            </a-button>
          </template>
        </div>
      </div>
      <div class="config-body-item">
        <div class="item-title">全局标题</div>
        <div class="item-content">
          <template v-if="props.modelValue.titleConfig">
            <a-button @click="emit('changeConfigIndex', 'globalTitleConfig')">
              <template #icon>
                <EditOutlined />
              </template>
              <span>编辑标题</span>
            </a-button>
            <CloseOutlined v-if="props.modelValue.titleConfig" style="margin-left: 8px;"
              @click="deleteGlobalTitleConfig" />
          </template>
          <template v-else>
            <a-button @click="emit('changeConfigIndex', 'globalTitleConfig')">
              <template #icon>
                <PlusOutlined />
              </template>
              <span>添加标题</span>
            </a-button>
          </template>
        </div>
      </div>
      <div class="config-body-item">
        <div class="item-title">背景音乐</div>
        <div class="item-content">
          <template v-if="props.modelValue.backgroundAudioConfig">
            <a-button @click="emit('changeConfigIndex', 'globalBackgroundAudioConfig')">
              <template #icon>
                <EditOutlined />
              </template>
              <span>{{ props.modelValue.backgroundAudioConfig.name }}</span>
            </a-button>
            <CloseOutlined v-if="props.modelValue.backgroundAudioConfig" style="margin-left: 8px;"
              @click="deleteGlobalBackgroundAudioConfig" />
          </template>
          <template v-else>
            <a-button @click="emit('changeConfigIndex', 'globalBackgroundAudioConfig')">
              <template #icon>
                <PlusOutlined />
              </template>
              <span>添加音频</span>
            </a-button>
          </template>
        </div>
      </div>
      <div class="config-body-item">
        <div class="item-title">视频比例</div>
        <div class="item-content">
          <a-radio-group :value="props.modelValue.videoRatio" button-style="solid"
            @update:value="handleChangeVideoRatio">
            <a-radio-button value="9:16">9:16</a-radio-button>
            <a-radio-button value="16:9">16:9</a-radio-button>
          </a-radio-group>
        </div>
      </div>
      <div class="config-body-item">
        <div class="item-title">视频分辨率</div>
        <div class="item-content">
          <a-radio-group :value="props.modelValue.videoResolution" button-style="solid"
            @update:value="handleChangeVideoResolution">
            <a-radio-button value="1080x1920">
              {{ props.modelValue.videoRatio === '9:16' ? '1080x1920' : '1920x1080' }}
            </a-radio-button>
            <a-radio-button value="720x1280">
              {{ props.modelValue.videoRatio === '9:16' ? '720x1280' : '1280x720' }}
            </a-radio-button>
          </a-radio-group>
        </div>
      </div>
    </div>
  </config-panel>
</template>

<script setup lang="ts">
import ConfigPanel from './ConfigPanel.vue';
import { ExclamationCircleOutlined, PlusOutlined, EditOutlined, CloseOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  modelValue: any
}>()

const emit = defineEmits(['changeConfigIndex',  'close', 'update:modelValue'])
const handleChangeVideoRatio = (value: string) => {
  emit('update:modelValue', {
    ...props.modelValue,
    videoRatio: value
  })
}
const handleChangeVideoResolution = (value: string) => {
  emit('update:modelValue', {
    ...props.modelValue,
    videoResolution: value
  })
}

const deleteGlobalZimuConfig = () => {
  emit('update:modelValue', {
    ...props.modelValue,
    zimuConfig: undefined
  })
}

const deleteGlobalTitleConfig = () => {
  emit('update:modelValue', {
    ...props.modelValue,
    titleConfig: undefined
  })
}

const changeSaveFolder = async () => {
  const res = await window.electronAPI.selectDirectory({
    defaultPath: props.modelValue.outputDir
  });
  if (res) {
    emit('update:modelValue', {
      ...props.modelValue,
      outputDir: res
    })
  }
}

const deleteGlobalBackgroundAudioConfig = () => {
  emit('update:modelValue', {
    ...props.modelValue,
    backgroundAudioConfig: undefined
  })
}
</script>

<style scoped lang="scss">
.config-header-subtitle {
  font-size: 14px;
  color: var(--q-grey-6);
}
.config-header-tip {
  font-size: 12px;
  color: #1677ff;
  margin-top: 4px;
}
.config-body {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.config-body-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  .item-title {
    width: 100px;
  }
  .item-content {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
}


</style>
