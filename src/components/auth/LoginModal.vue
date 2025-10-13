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
      <!-- Django 登录表单 -->
      <div class="login-form">
        <a-form :model="loginForm" layout="vertical" @finish="handleDjangoLogin">
          <a-form-item 
            label="账号" 
            name="username"
            :rules="[{ required: true, message: '请输入账号、邮箱或手机号' }]"
          >
            <a-input 
              v-model:value="loginForm.username" 
              size="large"
              placeholder="请输入账号、邮箱或手机号"
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

          <!-- 验证码 -->
          <a-form-item 
            label="验证码" 
            name="captcha"
            :rules="[{ required: true, message: '请输入验证码' }]"
          >
            <div class="captcha-input-group">
              <a-input 
                v-model:value="loginForm.captcha" 
                size="large"
                placeholder="请输入验证码"
                maxlength="4"
              />
              <img 
                :src="captchaImage" 
                class="captcha-image"
                @click="refreshCaptcha"
                alt="验证码"
                title="点击刷新验证码"
              />
            </div>
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
import { ref, reactive, h, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { 
  UserOutlined, 
  LockOutlined
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import * as djangoApi from '@/api/login'

// ==================== 原 Stack 登录代码（已保留但注释） ====================
// import '@/utils/process-polyfill'
// import { StackClientApp } from '@stackframe/stack'
// 
// console.info('Stack环境变量:', import.meta.env.VITE_STACK_PROJECT_ID, import.meta.env.VITE_STACK_PUBLISHABLE_KEY)
// 
// // Validate environment variables
// if (!import.meta.env.VITE_STACK_PROJECT_ID || !import.meta.env.VITE_STACK_PUBLISHABLE_KEY) {
//   console.warn('Stack environment variables not configured. Please set VITE_STACK_PROJECT_ID and VITE_STACK_PUBLISHABLE_KEY in your .env file.')
// }
// 
// const stackClient = new StackClientApp({
//   projectId: import.meta.env.VITE_STACK_PROJECT_ID || 'your-project-id',
//   publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_KEY || 'your-publishable-key',
//   tokenStore: 'memory' // 使用memory存储
// })
// ==================== 原 Stack 登录代码（已保留但注释） ====================

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
const loading = ref(false)
const captchaImage = ref('')
const captchaKey = ref('')

// Django 登录表单
const loginForm = reactive({
  username: '',
  password: '',
  captcha: '',
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

// 获取验证码
const getCaptcha = async () => {
  try {
    const res = await djangoApi.getCaptcha()
    const data = res.data
    if (data) {
      captchaImage.value = data.image_base
      captchaKey.value = data.key
    }
  } catch (error: any) {
    console.error('获取验证码失败:', error)
    message.error('获取验证码失败:', error)
  }
}

// 刷新验证码
const refreshCaptcha = async () => {
  loginForm.captcha = ''
  await getCaptcha()
}

// Django 登录处理
const handleDjangoLogin = async () => {
  try {
    loading.value = true
    
    const loginParams: any = {
      username: loginForm.username,
      password: loginForm.password
    }
    
    // 如果需要验证码，添加验证码参数
    
    loginParams.captcha = loginForm.captcha
    loginParams.captchaKey = captchaKey.value
    
    
    const response = await djangoApi.djangoLogin(loginParams)
    
    if (response.code === 2000) {
      const data = response.data
      
      if (!data) {
        message.error('登录响应数据为空')
        return
      }
      
      // 保存 token
      localStorage.setItem('django_token', data.access)
      if (data.refresh) {
        localStorage.setItem('django_refresh_token', data.refresh)
      }
      
      // 检查是否需要修改密码（首次登录）
      // if (data.pwd_change_count === 0) {
      //   message.warning('首次登录，请修改密码')
      //   // TODO: 打开修改密码对话框
      //   return
      // }
      
      // 构造用户信息
      const userInfo = {
        id: data.userId,
        name: data.name || data.username,
        username: data.username,
        email: data.username.includes('@') ? data.username : '',
        avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || data.username)}&background=1890ff&color=fff`,
        user_type: data.user_type,
        pwd_change_count: data.pwd_change_count,
        expire_date: data.expire_date,  // 租期
        edite_count: data.edite_count,  // 剪辑点位数
        unreadNotifications: 0
      }
      
      // 保存用户信息到 store
      userStore.login(userInfo, 'django')
      
      message.success('登录成功')
      emit('success', userInfo)
      emit('update:open', false)
      
      if (props.onSuccess) {
        props.onSuccess()
      }
      
      // 清空表单
      loginForm.username = ''
      loginForm.password = ''
      loginForm.captcha = ''
    }
  } catch (error: any) {
    console.error('登录失败:', error)
    
    // 登录失败后刷新验证码
    
    await refreshCaptcha()
    
    
    // 错误信息已在 request 拦截器中处理
  } finally {
    loading.value = false
  }
}

// ==================== 原 Stack 登录代码（已保留但注释） ====================
// // 账号密码登录
// const handlePasswordLogin = async () => {
//   try {
//     loading.value = true
//     
//     // 使用StackClient进行登录
//     const result = await stackClient.signInWithCredential({
//       email: loginForm.username,
//       password: loginForm.password,
//       noRedirect: true // 不自动重定向，手动处理登录后逻辑
//     })
//     
//     if (result.status === 'ok') {
//       // 登录成功，获取用户信息
//       const user = await stackClient.getUser()
//       
//       if (user) {
//         // 构造用户信息对象
//         const userInfo = {
//           id: user.id,
//           name: user.displayName || user.primaryEmail || '用户',
//           email: user.primaryEmail || '',
//           avatar: user.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=1890ff&color=fff`,
//           unreadNotifications: 0
//         }
//         
//         // 更新用户状态（会自动保存到localStorage）
//         userStore.login(userInfo)
//         
//         message.success('登录成功')
//         emit('success', userInfo)
//         emit('update:open', false)
//         
//         if (props.onSuccess) {
//           props.onSuccess()
//         }
//       } else {
//         message.error('获取用户信息失败')
//       }
//     } else {
//       // 登录失败，处理错误
//       message.error('登录失败，请检查用户名和密码')
//     }
//   } catch (error: any) {
//     console.error('登录失败:', error)
//     let errorMessage = '登录失败'
//     
//     // 处理常见的错误类型
//     if (error?.message) {
//       if (error.message.includes('Invalid credentials') || error.message.includes('EMAIL_PASSWORD_MISMATCH')) {
//         errorMessage = '用户名或密码错误'
//       } else if (error.message.includes('User not found')) {
//         errorMessage = '用户不存在'
//       } else {
//         errorMessage = error.message
//       }
//     }
//     
//     message.error(errorMessage)
//   } finally {
//     loading.value = false
//   }
// }
// ==================== 原 Stack 登录代码（已保留但注释） ====================

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

// 组件挂载时获取验证码
onMounted(() => {
  getCaptcha()
})
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
  
  .captcha-input-group {
    display: flex;
    gap: 12px;
    align-items: center;
    
    .ant-input {
      flex: 1;
    }
    
    .captcha-image {
      width: 120px;
      height: 40px;
      cursor: pointer;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      
      &:hover {
        border-color: var(--ant-primary-color, #1890ff);
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
  
  .captcha-input-group {
    .captcha-image {
      width: 100px;
      height: 36px;
    }
  }
}
</style>
