import { ref, createApp, h, computed } from 'vue'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/user'
import LoginModal from '@/components/auth/LoginModal.vue'

/**
 * 登录弹窗的配置选项
 */
interface LoginOptions {
  /** 是否为必须登录（不可关闭） */
  required?: boolean
  /** 弹窗标题 */
  title?: string
  /** 登录成功回调 */
  onSuccess?: (userInfo: any) => void
  /** 取消登录回调 */
  onCancel?: () => void
}

/**
 * 显示登录弹窗
 * @param options 登录选项
 * @returns Promise<boolean> 登录是否成功
 */
export function showLoginModal(options: LoginOptions = {}): Promise<boolean> {
  return new Promise((resolve) => {
    const { required = false, title, onSuccess, onCancel } = options
    
    // 创建响应式状态
    const isOpen = ref(true)
    
    // 创建临时的 Vue 应用实例来挂载模态框
    const container = document.createElement('div')
    document.body.appendChild(container)
    
    const app = createApp({
      setup() {
        const handleSuccess = (userInfo: any) => {
          isOpen.value = false
          resolve(true)
          if (onSuccess) {
            onSuccess(userInfo)
          }
          cleanup()
        }
        
        const handleCancel = () => {
          isOpen.value = false
          resolve(false)
          if (onCancel) {
            onCancel()
          }
          cleanup()
        }
        
        const handleUpdateOpen = (value: boolean) => {
          isOpen.value = value
          if (!value) {
            resolve(false)
            if (onCancel) {
              onCancel()
            }
            cleanup()
          }
        }
        
        const cleanup = () => {
          setTimeout(() => {
            app.unmount()
            document.body.removeChild(container)
          }, 300) // 给模态框关闭动画一些时间
        }
        
        return {
          isOpen,
          required,
          title,
          handleSuccess,
          handleCancel,
          handleUpdateOpen
        }
      },
      
      render() {
        return h(LoginModal, {
          open: this.isOpen,
          required: this.required,
          title: this.title,
          onSuccess: this.handleSuccess,
          onCancel: this.handleCancel,
          'onUpdate:open': this.handleUpdateOpen
        })
      }
    })
    
    app.mount(container)
  })
}

/**
 * 检查用户是否已登录，如果未登录则显示登录弹窗
 * @param options 登录选项
 * @returns Promise<boolean> 用户是否已登录（包括登录成功的情况）
 */
export async function requireAuth(options: LoginOptions = {}): Promise<boolean> {
  const userStore = useUserStore()
  
  // 如果已经登录，直接返回 true
  if (userStore.isLoggedIn) {
    return true
  }
  
  // 未登录则显示登录弹窗
  const loginSuccess = await showLoginModal({
    required: true,
    title: '请先登录',
    ...options
  })
  
  return loginSuccess
}

/**
 * 检查用户权限的装饰器/高阶函数
 * 用于包装需要登录的函数
 */
export function withAuth<T extends (...args: any[]) => any>(
  fn: T,
  options: LoginOptions = {}
): (...args: Parameters<T>) => Promise<ReturnType<T> | null> {
  return async (...args: Parameters<T>) => {
    const isAuthed = await requireAuth(options)
    
    if (isAuthed) {
      return fn(...args)
    }
    
    return null
  }
}

/**
 * Vue 组合式 API：检查登录状态的 hook
 */
export function useAuth() {
  const userStore = useUserStore()
  
  const login = async (options: LoginOptions = {}) => {
    return await showLoginModal(options)
  }
  
  const logout = () => {
    userStore.logout()
    message.success('已退出登录')
  }
  
  const requireLogin = async (options: LoginOptions = {}) => {
    return await requireAuth(options)
  }
  
  return {
    isLoggedIn: computed(() => userStore.isLoggedIn),
    userInfo: computed(() => userStore.userInfo),
    login,
    logout,
    requireLogin
  }
}

/**
 * 路由守卫：检查路由是否需要登录
 */
export async function authGuard(
  to: any, 
  from: any, 
  next: any,
  options: LoginOptions = {}
) {
  const userStore = useUserStore()
  
  // 检查路由是否需要认证
  if (to.meta?.requiresAuth) {
    if (!userStore.isLoggedIn) {
      // 显示登录弹窗
      const loginSuccess = await showLoginModal({
        required: true,
        title: '访问此页面需要登录',
        ...options
      })
      
      if (loginSuccess) {
        next() // 登录成功，继续导航
      } else {
        next(from.path || '/') // 登录失败，返回上一页或首页
      }
    } else {
      next() // 已登录，继续导航
    }
  } else {
    next() // 不需要认证，继续导航
  }
}

export default {
  showLoginModal,
  requireAuth,
  withAuth,
  useAuth,
  authGuard
}
