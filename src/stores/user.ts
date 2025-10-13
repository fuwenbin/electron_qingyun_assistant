import { defineStore } from 'pinia'

// 登录方式类型
export type LoginType = 'django' | 'stack'

interface UserState {
  isLoggedIn: boolean
  loginType: LoginType | null
  userInfo: {
    id?: string | number
    name: string
    avatar: string
    email?: string
    username?: string
    mobile?: string
    user_type?: number
    pwd_change_count?: number
    expire_date?: string | null  // 租期到期日期
    edite_count?: number  // 剪辑点位数
    unreadNotifications: number
  } | null
}

const USER_STORAGE_KEY = 'user_info'
const LOGIN_TYPE_KEY = 'login_type'

// ==================== 原 Stack Client 代码（已保留但注释） ====================
// import { StackClientApp } from '@stackframe/stack'
// 
// const stackClient = new StackClientApp({
//   projectId: import.meta.env.VITE_STACK_PROJECT_ID || 'your-project-id',
//   publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_KEY || 'your-publishable-key',
//   tokenStore: 'memory' // 使用memory存储，因为localStorage不被支持
// })
// ==================== 原 Stack Client 代码（已保留但注释） ====================

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    isLoggedIn: false,
    loginType: null,
    userInfo: null
  }),

  getters: {
    // 是否已登录
    isAuthenticated: (state) => state.isLoggedIn,
    
    // 获取用户名
    userName: (state) => state.userInfo?.name || state.userInfo?.username || '未登录',
    
    // 获取头像
    userAvatar: (state) => state.userInfo?.avatar || '',
    
    // 是否是 Django 登录
    isDjangoLogin: (state) => state.loginType === 'django',
    
    // 检查租期是否过期
    isExpired: (state) => {
      if (!state.userInfo?.expire_date) return false
      const expireDate = new Date(state.userInfo.expire_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return expireDate < today
    },
    
    // 检查剪辑点数是否不足
    isEditeCountInsufficient: (state) => {
      return (state.userInfo?.edite_count || 0) <= 0
    },
    
    // 检查是否可以继续使用（租期未过期且有剪辑点数）
    canUse: (state) => {
      const isExpired = state.userInfo?.expire_date ? 
        new Date(state.userInfo.expire_date) < new Date() : false
      const hasEditeCount = (state.userInfo?.edite_count || 0) > 0
      return !isExpired && hasEditeCount
    },
    
    // 获取剩余天数
    remainingDays: (state) => {
      if (!state.userInfo?.expire_date) return null
      const expireDate = new Date(state.userInfo.expire_date)
      const today = new Date()
      const diffTime = expireDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 ? diffDays : 0
    }
  },

  actions: {
    // 初始化用户状态（从 localStorage 加载）
    async initUserState() {
      try {
        // 检查登录方式和用户信息
        const loginType = localStorage.getItem(LOGIN_TYPE_KEY) as LoginType | null
        const storedUser = localStorage.getItem(USER_STORAGE_KEY)
        
        if (loginType === 'django') {
          // Django 登录方式
          const djangoToken = localStorage.getItem('django_token')
          
          if (storedUser && djangoToken) {
            const userData = JSON.parse(storedUser)
            this.isLoggedIn = true
            this.loginType = 'django'
            this.userInfo = userData
            
            console.log('Django 用户状态已恢复:', userData)
          }
        } else if (storedUser) {
          // 兼容旧数据或其他登录方式
          const userData = JSON.parse(storedUser)
          this.isLoggedIn = true
          this.loginType = loginType || 'django'
          this.userInfo = userData
        }
        
        // ==================== 原 Stack 登录恢复逻辑（已保留但注释） ====================
        // else {
        //   // Stack 登录方式（默认）
        //   const user = await stackClient.getUser()
        //   
        //   if (user) {
        //     const userInfo = {
        //       id: user.id,
        //       name: user.displayName || user.primaryEmail || '用户',
        //       email: user.primaryEmail || '',
        //       avatar: user.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=1890ff&color=fff`,
        //       unreadNotifications: 0
        //     }
        //     
        //     this.isLoggedIn = true
        //     this.loginType = 'stack'
        //     this.userInfo = userInfo
        //     
        //     localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userInfo))
        //     localStorage.setItem(LOGIN_TYPE_KEY, 'stack')
        //   }
        // }
        // ==================== 原 Stack 登录恢复逻辑（已保留但注释） ====================
      } catch (error) {
        console.error('Failed to initialize user state:', error)
        
        // 如果出错，尝试从 localStorage 加载基本信息
        try {
          const storedUser = localStorage.getItem(USER_STORAGE_KEY)
          const loginType = localStorage.getItem(LOGIN_TYPE_KEY) as LoginType | null
          
          if (storedUser) {
            const userData = JSON.parse(storedUser)
            this.isLoggedIn = true
            this.loginType = loginType || 'django'
            this.userInfo = userData
          }
        } catch (localError) {
          console.error('Failed to load user data from localStorage:', localError)
        }
      }
    },

    // 登录成功后保存用户信息
    login(userInfo: UserState['userInfo'], loginType: LoginType = 'django') {
      this.isLoggedIn = true
      this.loginType = loginType
      this.userInfo = userInfo
      
      // 保存到 localStorage
      if (userInfo) {
        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userInfo))
          localStorage.setItem(LOGIN_TYPE_KEY, loginType)
          console.log('用户信息已保存:', userInfo)
        } catch (error) {
          console.error('Failed to save user data to localStorage:', error)
        }
      }
    },

    // 登出并清除本地存储
    async logout() {
      this.isLoggedIn = false
      this.loginType = null
      this.userInfo = null
      
      // 清除 localStorage
      try {
        localStorage.removeItem(USER_STORAGE_KEY)
        localStorage.removeItem(LOGIN_TYPE_KEY)
        localStorage.removeItem('django_token')
        localStorage.removeItem('django_refresh_token')
        console.log('用户已登出，本地数据已清除')
      } catch (error) {
        console.error('Failed to remove user data from localStorage:', error)
      }
    },

    // 更新用户信息
    updateUserInfo(info: Partial<UserState['userInfo']>) {
      if (this.userInfo) {
        this.userInfo = { ...this.userInfo, ...info }
        
        // 同步更新 localStorage
        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(this.userInfo))
          console.log('用户信息已更新:', this.userInfo)
        } catch (error) {
          console.error('Failed to update user data in localStorage:', error)
        }
      }
    },

    // 从后端获取最新用户信息
    async fetchUserInfo() {
      try {
        const { getUserInfo } = await import('@/api/login')
        const response = await getUserInfo()
        
        if (response.code === 2000 && response.data) {
          // 更新用户信息中的租期和点数
          this.updateUserInfo({
            expire_date: response.data.expire_date,
            edite_count: response.data.edite_count
          })
          
          return response.data
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        throw error
      }
    },

    // 检查用户状态（租期和点数）
    async checkUserStatus(): Promise<{ canUse: boolean; message: string }> {
      try {
        // 从后端获取最新状态
        await this.fetchUserInfo()
        
        // 检查租期
        if (this.isExpired) {
          return {
            canUse: false,
            message: `租期已过期，到期日期：${this.userInfo?.expire_date}`
          }
        }
        
        // 检查剪辑点数
        if (this.isEditeCountInsufficient) {
          return {
            canUse: false,
            message: `剪辑点位数不足，当前剩余：${this.userInfo?.edite_count || 0}`
          }
        }
        
        return {
          canUse: true,
          message: `租期剩余 ${this.remainingDays} 天，剪辑点数：${this.userInfo?.edite_count || 0}`
        }
      } catch (error) {
        console.error('检查用户状态失败:', error)
        return {
          canUse: false,
          message: '无法获取用户状态，请检查网络连接'
        }
      }
    },

    // 扣除剪辑点数（本地缓存同步）
    deductEditeCount(count: number) {
      if (this.userInfo?.edite_count !== undefined) {
        const newCount = Math.max(0, this.userInfo.edite_count - count)
        this.updateUserInfo({ edite_count: newCount })
      }
    }
  }
})
