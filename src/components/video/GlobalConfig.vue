<template>
  <div class="panel-section">
          <h3 class="section-title">全局设置</h3>
          <div class="settings-list">
            <div class="setting-item">
              <label>视频比例</label>
              <div class="ratio-options">
                <q-btn
                  v-for="ratio in ratioOptions"
                  :key="ratio.value"
                  :label="ratio.label"
                  :color="aspectRatio === ratio.value ? 'primary' : 'grey-7'"
                  :flat="aspectRatio !== ratio.value"
                  @click="aspectRatio = ratio.value"
                />
              </div>
            </div>
            <div class="setting-item">
              <label>分辨率</label>
              <q-select
                v-model="resolution"
                :options="resolutionOptions"
                dense
              />
            </div>
            <div class="setting-item">
              <label>背景音乐</label>
              <q-select
                v-model="backgroundMusic"
                :options="musicOptions"
                dense
              />
            </div>
          </div>
        </div>
</template>

<script setup lang="ts">

</script>

<style scoped lang="scss">

</style>
