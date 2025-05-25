<template>
  <div class="page-single-publish">
    <div class="page-body">
      <div class="publish-base-content">
        <div class="base-content-title">单条视频发布</div>
        <div class="base-content-video">
          <a-button type="primary">添加本地视频</a-button>
        </div>
        <div class="base-content-form">
          <div class="form-item">
            <div class="item-label">添加视频</div>
            <div class="item-input">
              <VideoChooser v-model="selectedVideos" :limit="1"/>
            </div>
          </div>
          <div class="form-item">
            <div class="item-label">
              <div class="label-name">标题</div>
              <div class="label-tip">填写建议</div>
            </div>
            <div class="item-input">
              <div class="input-content">
                <a-input placeholder="标题（5-30字）" v-model:value="baseContentData.title" />
              </div>
            </div>
          </div>
        </div>
        <div class="base-content-description">
          <div class="form-item">
            <div class="item-label">
              <div class="label-name">视频简介</div>
            </div>
            <div class="item-input">
              <div class="input-content">
                <a-textarea placeholder="" v-model:value="baseContentData.description" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="publish-platform-list">
        <div class="platform-list-title">平台</div>
        <div class="platform-list">
          <div v-for="item in platformList" :key="item.id" :class="{active: item.id === selectedPlatformId}">

          </div>
        </div>
      </div>
      <div class="publish-platform-content">

      </div>
    </div>
    <div class="page-footer">
      <a-button>发布</a-button>
      <a-button>定时发布</a-button>
      <a-button>关闭</a-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import VideoChooser from '@/components/VideoChooser.vue'
import { reactive, ref } from 'vue'

const selectedVideos  = ref([])

const baseContentData = reactive({
  filePath: '',
  title: '',
  description: ''
})
const platformList = ref<any[]>([])
const selectedPlatformId = ref()
</script>

<style lang="scss" scoped>
.base-content-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
}
.base-content-video {
  margin-bottom: 30px;
}
.base-content-form {
  .form-item {
    margin-bottom: 20px;
    .item-label {
      display: flex;
      align-items: center;
      margin-bottom: 5px;
      .label-tip {
        color: #1677ff;
        margin-left: 10px;
      }
    }
  }
}
.page-footer {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>