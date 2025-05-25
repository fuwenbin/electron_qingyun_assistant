<template>
  <Page>
    <div class="page-body">
      <div class="publish-base-content">
        <div class="base-content-title">单条视频发布</div>
        <div class="base-content-video">
          <a-button type="primary">添加本地视频</a-button>
        </div>
        <div class="base-content-title">
          <div class="form-item">
            <div class="item-label">
              <div class="label-name">标题</div>
              <div class="label-tip">填写建议</div>
            </div>
            <div class="item-input">
              <div class="input-content">
                <a-input placeholder="标题（5-30字）" />
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
                <a-textarea placeholder="" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="publish-platform-list">

      </div>
      <div class="publish-platform-content">

      </div>
    </div>
    <div class="page-footer">

    </div>
  </Page>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import Page from '@/components/Page.vue'

const baseContentData = reactive({
  filePath: '',
  title: '',
  description: ''
})
const platformList = ref([])
const selectedPlatformId = ref()
const platformContentData = reactive({})
</script>

<style lang="scss" scoped>
.page-body {

}
.page-footer {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>