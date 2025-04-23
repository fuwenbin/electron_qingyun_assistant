<template>
  <div class="video-chooser" style="display: flex; gap: 10px; flex-wrap: wrap;">
    <video v-for="(item, index) in selectedFileUrls" :key="index" :src="item" class="video-preview"/>
    <a-upload v-model:file-list="fileList"
      name="avatar"
      list-type="picture-card"
      class="avatar-uploader"
      :accept="videoMimeTypes"
      :before-upload="beforeUpload"
      :show-upload-list="false"
    >
      <div>
        <loading-outlined v-if="loading"></loading-outlined>
        <plus-outlined v-else></plus-outlined>
        <div class="ant-upload-text">添加素材</div>
      </div>
    </a-upload>

    
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const props = defineProps<{
  modelValue: File[]
}>()

const emit = defineEmits(['update:modelValue'])
const fileList = ref([]);
const loading = ref<boolean>(false);
const selectedFileUrls = computed(() => {
  return props.modelValue.map(file => URL.createObjectURL(file));
});
const videoMimeTypes = 'video/*';
const allowedExtensions = ['.mp4', '.mov', '.avi', '.mkv'];
const maxSizeMB = 100;

const beforeUpload = (file: any) => {
  const isValidType = allowedExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  const isValidSize = file.size / 1024 / 1024 <= maxSizeMB;

  if (!isValidType) {
    console.error('不支持的文件类型');
    return false;
  }

  if (!isValidSize) {
    console.error('文件大小超过限制');
    return false;
  }

  emit('update:modelValue', [...props.modelValue, file]);
  return false
};
</script>

<style lang="scss" scoped>
.video-preview {
  width: 100px;
  height: 100px;
}
.video-chooser {
  :deep(.ant-upload-wrapper) {
    &, & .ant-upload {
      width: 100px;
      height: 100px;
    }
  }
}
.ant-upload-select-picture-card i {
  font-size: 32px;
  color: #999;
}

.ant-upload-select-picture-card .ant-upload-text {
  margin-top: 8px;
  color: #666;
}
</style>
