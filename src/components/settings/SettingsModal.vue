<template>
  <a-modal 
    v-model:open="visible" 
    title="系统设置" 
    :width="700"
    :footer="null"
    @cancel="handleClose"
  >
    <div class="settings-content custom-scroll">
      <a-tabs v-model:activeKey="activeTab" type="card">
        <!-- 发布设置Tab -->
        <a-tab-pane key="publish" tab="发布设置">
          <div class="tab-content">
            <div class="section-description">配置视频发布相关的设置选项</div>
            
            <div class="setting-item">
              <div class="setting-label">
                <label>浏览器显示模式</label>
                <p class="setting-description">控制发布视频时是否显示浏览器窗口</p>
              </div>
              <div class="setting-control">
                <a-switch 
                  v-model:checked="settings.showBrowser" 
                  :loading="saving"
                  @change="handleSettingChange"
                />
                <span class="switch-label">
                  {{ settings.showBrowser ? '显示浏览器' : '隐藏浏览器' }}
                </span>
              </div>
            </div>
            
            <div class="setting-item">
              <div class="setting-label">
                <label>自动重试次数</label>
                <p class="setting-description">发布失败时的自动重试次数</p>
              </div>
              <div class="setting-control">
                <a-input-number 
                  v-model:value="settings.retryCount" 
                  :min="0" 
                  :max="5"
                  :loading="saving"
                  @change="handleSettingChange"
                  style="width: 120px;"
                />
                <span class="input-label">次</span>
              </div>
            </div>
            
            <div class="setting-item">
              <div class="setting-label">
                <label>发布间隔</label>
                <p class="setting-description">连续发布视频之间的间隔时间</p>
              </div>
              <div class="setting-control">
                <a-input-number 
                  v-model:value="settings.publishInterval" 
                  :min="5" 
                  :max="300"
                  :loading="saving"
                  @change="handleSettingChange"
                  style="width: 120px;"
                />
                <span class="input-label">秒</span>
              </div>
            </div>
          </div>
        </a-tab-pane>

        <!-- 系统设置Tab -->
        <a-tab-pane key="system" tab="系统设置">
          <div class="tab-content">
            <div class="section-description">配置应用程序的基本设置</div>
            
            <div class="setting-item">
              <div class="setting-label">
                <label>启动时最小化</label>
                <p class="setting-description">应用程序启动时是否最小化到系统托盘</p>
              </div>
              <div class="setting-control">
                <a-switch 
                  v-model:checked="settings.startMinimized" 
                  :loading="saving"
                  @change="handleSettingChange"
                />
                <span class="switch-label">
                  {{ settings.startMinimized ? '启用' : '禁用' }}
                </span>
              </div>
            </div>
            
            <div class="setting-item">
              <div class="setting-label">
                <label>自动检查更新</label>
                <p class="setting-description">应用程序启动时自动检查是否有新版本</p>
              </div>
              <div class="setting-control">
                <a-switch 
                  v-model:checked="settings.autoUpdate" 
                  :loading="saving"
                  @change="handleSettingChange"
                />
                <span class="switch-label">
                  {{ settings.autoUpdate ? '启用' : '禁用' }}
                </span>
              </div>
            </div>
          </div>
        </a-tab-pane>

        <!-- 关于Tab -->
        <a-tab-pane key="about" tab="关于">
          <div class="tab-content">
            <div class="about-content">
              <div class="app-info">
                <h3>剪辑助手</h3>
                <p class="version">版本 1.0.0</p>
                <p class="description">一款专业的视频批量混剪和发布工具</p>
              </div>
              
              <div class="feature-list">
                <h4>主要功能</h4>
                <ul>
                  <li>批量视频混剪</li>
                  <li>自动字幕生成</li>
                  <li>多平台发布</li>
                  <li>定时发布任务</li>
                </ul>
              </div>
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>

    <div class="settings-footer">
      <a-space>
        <a-button @click="handleReset" :loading="saving">恢复默认</a-button>
        <a-button type="primary" @click="handleSave" :loading="saving">保存设置</a-button>
      </a-space>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, onMounted, toRaw } from 'vue'
import { message } from 'ant-design-vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const visible = ref(false)
const saving = ref(false)
const activeTab = ref('publish')

// 默认设置
const defaultSettings = {
  showBrowser: false,        // 是否显示浏览器
  retryCount: 3,            // 重试次数
  publishInterval: 30,      // 发布间隔（秒）
  startMinimized: false,    // 启动时最小化
  autoUpdate: true          // 自动检查更新
}

// 当前设置
const settings = reactive({ ...defaultSettings })

// 监听 props.open 变化
watch(() => props.open, (newValue) => {
  visible.value = newValue
  if (newValue) {
    loadSettings()
  }
})

// 监听 visible 变化，同步到父组件
watch(visible, (newValue) => {
  emit('update:open', newValue)
})

// 加载设置
const loadSettings = async () => {
  try {
    const savedSettings = await window.electronAPI.getAppSettings()
    if (savedSettings) {
      Object.assign(settings, { ...defaultSettings, ...savedSettings })
    }
  } catch (error: any) {
    console.error('加载设置失败:', error)
    message.error('加载设置失败: ' + error.message)
  }
}

// 设置变更处理
const handleSettingChange = () => {
  // 实时保存设置
  handleSave()
}

// 保存设置
const handleSave = async () => {
  try {
    saving.value = true
    // 使用 toRaw 获取原始对象，避免序列化 reactive 代理
    const plainSettings = toRaw(settings)
    await window.electronAPI.saveAppSettings(plainSettings)
    message.success('设置已保存')
  } catch (error: any) {
    console.error('保存设置失败:', error)
    message.error('保存设置失败: ' + error.message)
  } finally {
    saving.value = false
  }
}

// 恢复默认设置
const handleReset = async () => {
  try {
    saving.value = true
    Object.assign(settings, defaultSettings)
    // 使用 toRaw 获取原始对象，避免序列化 reactive 代理
    const plainSettings = toRaw(settings)
    await window.electronAPI.saveAppSettings(plainSettings)
    message.success('已恢复默认设置')
  } catch (error: any) {
    console.error('恢复默认设置失败:', error)
    message.error('恢复默认设置失败: ' + error.message)
  } finally {
    saving.value = false
  }
}

// 关闭弹窗
const handleClose = () => {
  visible.value = false
}

onMounted(() => {
  if (props.open) {
    loadSettings()
  }
})
</script>

<style lang="scss" scoped>
// 自定义滚动条样式
.custom-scroll {
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d9d9d9;
    border-radius: 3px;
    transition: background 0.3s ease;

    &:hover {
      background: #bfbfbf;
    }
  }

  &::-webkit-scrollbar-corner {
    background: #f5f5f5;
  }
}

.settings-content {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 4px; // 为滚动条留出空间
}

:deep(.ant-tabs) {
  .ant-tabs-nav {
    margin-bottom: 16px;
  }
  
  .ant-tabs-tab {
    padding: 8px 16px;
    font-weight: 500;
  }
  
  .ant-tabs-content-holder {
    padding: 0;
  }
}

.tab-content {
  padding: 8px 0;
}

.section-description {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #1677ff;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 0;
  border-bottom: 1px solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
}

.setting-label {
  flex: 1;
  margin-right: 20px;
  
  label {
    display: block;
    font-size: 15px;
    font-weight: 500;
    color: #262626;
    margin-bottom: 6px;
  }
  
  .setting-description {
    margin: 0;
    font-size: 13px;
    color: #8c8c8c;
    line-height: 1.4;
  }
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .switch-label,
  .input-label {
    font-size: 14px;
    color: #595959;
    white-space: nowrap;
    min-width: 80px;
  }
}

// 关于页面样式
.about-content {
  text-align: center;
  padding: 20px 0;
  
  .app-info {
    margin-bottom: 32px;
    
    h3 {
      font-size: 24px;
      font-weight: 600;
      color: #262626;
      margin-bottom: 8px;
    }
    
    .version {
      font-size: 14px;
      color: #8c8c8c;
      margin-bottom: 12px;
    }
    
    .description {
      font-size: 16px;
      color: #595959;
      margin: 0;
    }
  }
  
  .feature-list {
    text-align: left;
    max-width: 300px;
    margin: 0 auto;
    
    h4 {
      font-size: 16px;
      font-weight: 500;
      color: #262626;
      margin-bottom: 12px;
      text-align: center;
    }
    
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      
      li {
        padding: 8px 0;
        padding-left: 20px;
        position: relative;
        font-size: 14px;
        color: #595959;
        
        &::before {
          content: '•';
          color: #1677ff;
          font-weight: bold;
          position: absolute;
          left: 0;
        }
      }
    }
  }
}

.settings-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
}
</style>
