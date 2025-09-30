<template>
  <a-modal 
    :open="props.open" 
    title="登录授权" 
    :width="480" 
    :footer="null"
    :closable="!props.required"
    :maskClosable="!props.required"
    @update:open="handleModalClose"
    class="login-modal"
  >
    <div class="login-container">
      <!-- 账号密码登录 -->
      <div class="login-form">
        <a-form :model="loginForm" layout="vertical" @finish="handlePasswordLogin">
          <a-form-item 
            label="邮箱" 
            name="username"
            :rules="[{ required: true, message: '请输入用户名' }]"
          >
            <a-input 
              v-model:value="loginForm.username" 
              size="large"
              placeholder="请输入用户名、邮箱或手机号"
              :prefix="h(UserOutlined)"
            />
          </a-form-item>
          
          <a-form-item 
            label="密码" 
            name="password"
            :rules="[{ required: true, message: '请输入密码' }]"
          >
            <a-input-password 
              v-model:value="loginForm.password" 
              size="large"
              placeholder="请输入密码"
              :prefix="h(LockOutlined)"
            />
          </a-form-item>
          
          <a-form-item>
            <div class="login-options">
              <a-checkbox v-model:checked="loginForm.rememberMe">记住我</a-checkbox>
              <a class="forgot-password" @click="showForgotPassword">忘记密码？</a>
            </div>
          </a-form-item>
          
          <a-form-item>
            <a-button 
              type="primary" 
              html-type="submit" 
              size="large" 
              block 
              :loading="loading"
            >
              登录
            </a-button>
          </a-form-item>
        </a-form>
      </div>

      <!-- 底部提示 -->
      <div class="login-footer">
        <div v-if="!props.required" class="register-tip">
          还没有账号？<a @click="showRegister">立即注册</a>
        </div>
        <div class="terms-tip">
          登录即表示您同意<a @click="showTerms">《用户协议》</a>和<a @click="showPrivacy">《隐私政策》</a>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
// Import process polyfill first
import '@/utils/process-polyfill'
import { ref, reactive, h } from 'vue'
import { message } from 'ant-design-vue'
import { StackClientApp } from '@stackframe/stack';

import { 
  UserOutlined, 
  LockOutlined
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
console.info('Stack环境变量:', import.meta.env.VITE_STACK_PROJECT_ID, import.meta.env.VITE_STACK_PUBLISHABLE_KEY)

// Validate environment variables
if (!import.meta.env.VITE_STACK_PROJECT_ID || !import.meta.env.VITE_STACK_PUBLISHABLE_KEY) {
  console.warn('Stack environment variables not configured. Please set VITE_STACK_PROJECT_ID and VITE_STACK_PUBLISHABLE_KEY in your .env file.')
}

const stackClient = new StackClientApp({
  projectId: import.meta.env.VITE_STACK_PROJECT_ID || 'your-project-id',
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_KEY || 'your-publishable-key',
  tokenStore: 'memory' // 使用memory存储
})

interface Props {
  open: boolean
  required?: boolean // 是否为必须登录（不可关闭）
  title?: string
  onSuccess?: () => void // 登录成功回调
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  title: '登录授权'
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'success': [userInfo: any]
  'cancel': []
}>()

const userStore = useUserStore()

// 只使用密码登录
const loading = ref(false)

// 账号密码登录表单
const loginForm = reactive({
  username: '',
  password: '',
  rememberMe: false
})


// 处理模态框关闭
const handleModalClose = (value: boolean) => {
  if (!props.required || value) {
    emit('update:open', value)
    if (!value) {
      emit('cancel')
    }
  }
}

// 账号密码登录
const handlePasswordLogin = async () => {
  try {
    loading.value = true
    
    // 使用StackClient进行登录
    const result = await stackClient.signInWithCredential({
      email: loginForm.username,
      password: loginForm.password,
      noRedirect: true // 不自动重定向，手动处理登录后逻辑
    })
    
    if (result.status === 'ok') {
      // 登录成功，获取用户信息
      const user = await stackClient.getUser()
      
      if (user) {
        // 构造用户信息对象
        const userInfo = {
          id: user.id,
          name: user.displayName || user.primaryEmail || '用户',
          email: user.primaryEmail || '',
          avatar: user.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=1890ff&color=fff`,
          unreadNotifications: 0
        }
        
        // 更新用户状态（会自动保存到localStorage）
        userStore.login(userInfo)
        
        message.success('登录成功')
        emit('success', userInfo)
        emit('update:open', false)
        
        if (props.onSuccess) {
          props.onSuccess()
        }
      } else {
        message.error('获取用户信息失败')
      }
    } else {
      // 登录失败，处理错误
      message.error('登录失败，请检查用户名和密码')
    }
  } catch (error: any) {
    console.error('登录失败:', error)
    let errorMessage = '登录失败'
    
    // 处理常见的错误类型
    if (error?.message) {
      if (error.message.includes('Invalid credentials') || error.message.includes('EMAIL_PASSWORD_MISMATCH')) {
        errorMessage = '用户名或密码错误'
      } else if (error.message.includes('User not found')) {
        errorMessage = '用户不存在'
      } else {
        errorMessage = error.message
      }
    }
    
    message.error(errorMessage)
  } finally {
    loading.value = false
  }
}


// 其他操作
const showForgotPassword = () => {
  message.info('忘记密码功能开发中...')
}

const showRegister = () => {
  message.info('注册功能开发中...')
}

const showTerms = () => {
  message.info('用户协议功能开发中...')
}

const showPrivacy = () => {
  message.info('隐私政策功能开发中...')
}

</script>

<style lang="scss" scoped>
.login-modal {
  .ant-modal-header {
    text-align: center;
    border-bottom: 1px solid #f0f0f0;
  }
}

.login-container {
  padding: 20px 0;
}

.login-methods {
  margin-bottom: 30px;
  
  .method-tabs {
    display: flex;
    border-radius: 8px;
    background-color: #f5f5f5;
    padding: 4px;
    
    .method-tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 14px;
      color: #666;
      
      &:hover {
        color: var(--ant-primary-color, #1890ff);
      }
      
      &.active {
        background-color: #fff;
        color: var(--ant-primary-color, #1890ff);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      i {
        font-size: 16px;
      }
    }
  }
}

.login-form {
  .login-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    .forgot-password {
      color: var(--ant-primary-color, #1890ff);
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
  
  .code-input-group {
    display: flex;
    gap: 12px;
    
    .ant-input {
      flex: 1;
    }
    
    .ant-btn {
      white-space: nowrap;
    }
  }
}

.quick-login {
  .quick-login-options {
    display: flex;
    justify-content: space-around;
    gap: 20px;
    
    .quick-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      padding: 20px;
      border-radius: 8px;
      transition: all 0.3s ease;
      
      &:hover {
        background-color: #f5f5f5;
        transform: translateY(-2px);
      }
      
      .option-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 24px;
        
        &.wechat {
          background-color: #07c160;
        }
        
        &.qq {
          background-color: #12b7f5;
        }
        
        &.alipay {
          background-color: #1677ff;
        }
      }
      
      .option-label {
        font-size: 14px;
        color: #666;
        text-align: center;
      }
    }
  }
}

.login-footer {
  margin-top: 30px;
  text-align: center;
  
  .register-tip {
    margin-bottom: 12px;
    font-size: 14px;
    color: #666;
    
    a {
      color: var(--ant-primary-color, #1890ff);
      text-decoration: none;
      cursor: pointer;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
  
  .terms-tip {
    font-size: 12px;
    color: #999;
    line-height: 1.5;
    
    a {
      color: var(--ant-primary-color, #1890ff);
      text-decoration: none;
      cursor: pointer;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .login-container {
    padding: 16px 0;
  }
  
  .method-tabs {
    flex-direction: column;
    gap: 8px;
    
    .method-tab {
      justify-content: flex-start;
      padding: 16px;
    }
  }
  
  .quick-login-options {
    flex-direction: column;
    gap: 16px;
    
    .quick-option {
      flex-direction: row;
      justify-content: flex-start;
      text-align: left;
      padding: 16px;
      
      .option-icon {
        width: 40px;
        height: 40px;
        font-size: 20px;
      }
    }
  }
}
</style>
