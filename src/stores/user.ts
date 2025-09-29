import { defineStore } from 'pinia'
// import { StackClientApp } from '@stackframe/stack'

interface UserState {
  isLoggedIn: boolean
  userInfo: {
    id?: string
    name: string
    avatar: string
    email?: string
    unreadNotifications: number
  } | null
}

const USER_STORAGE_KEY = 'user_info'

// 创建StackClient实例用于用户状态检查 - 暂时注释掉
// const stackClient = new StackClientApp({
//   projectId: import.meta.env.VITE_STACK_PROJECT_ID || 'your-project-id',
//   publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_KEY || 'your-publishable-key',
//   tokenStore: 'memory' // 使用memory存储，因为localStorage不被支持
// })

// 临时的mock StackClient
const stackClient = {
  getUser: async () => {
    // 检查localStorage中是否有用户信息
    const storedUser = localStorage.getItem('user_info')
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      return {
        id: userData.id,
        displayName: userData.name,
        primaryEmail: userData.email,
        profileImageUrl: userData.avatar
      }
    }
    return null
  }
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    isLoggedIn: false,
    userInfo: null
  }),

  actions: {
    // 初始化用户状态（从StackClient和localStorage加载）
    async initUserState() {
      try {
        // 首先检查StackClient中是否有有效的用户会话
        const user = await stackClient.getUser()
        
        if (user) {
          // 如果StackClient中有用户信息，使用它
          const userInfo = {
            id: user.id,
            name: user.displayName || user.primaryEmail || '用户',
            email: user.primaryEmail || '',
            avatar: user.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=1890ff&color=fff`,
            unreadNotifications: 0
          }
          
          this.isLoggedIn = true
          this.userInfo = userInfo
          
          // 同步到localStorage
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userInfo))
        } else {
          // 如果StackClient中没有用户，尝试从localStorage加载
          const storedUser = localStorage.getItem(USER_STORAGE_KEY)
          if (storedUser) {
            const userData = JSON.parse(storedUser)
            this.isLoggedIn = true
            this.userInfo = userData
          }
        }
      } catch (error) {
        console.error('Failed to initialize user state:', error)
        // 如果出错，尝试从localStorage加载
        try {
          const storedUser = localStorage.getItem(USER_STORAGE_KEY)
          if (storedUser) {
            const userData = JSON.parse(storedUser)
            this.isLoggedIn = true
            this.userInfo = userData
          }
        } catch (localError) {
          console.error('Failed to load user data from localStorage:', localError)
        }
      }
    },

    // 登录成功后保存用户信息
    login(userInfo: UserState['userInfo']) {
      this.isLoggedIn = true
      this.userInfo = userInfo
      
      // 保存到localStorage
      if (userInfo) {
        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userInfo))
        } catch (error) {
          console.error('Failed to save user data to localStorage:', error)
        }
      }
    },

    // 登出并清除本地存储
    async logout() {
      // 注意：StackClient可能没有signOut方法，我们主要清除本地状态
      this.isLoggedIn = false
      this.userInfo = null
      
      // 清除localStorage
      try {
        localStorage.removeItem(USER_STORAGE_KEY)
      } catch (error) {
        console.error('Failed to remove user data from localStorage:', error)
      }
    },

    // 更新用户信息
    updateUserInfo(info: Partial<UserState['userInfo']>) {
      if (this.userInfo) {
        this.userInfo = { ...this.userInfo, ...info }
        
        // 同步更新localStorage
        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(this.userInfo))
        } catch (error) {
          console.error('Failed to update user data in localStorage:', error)
        }
      }
    }
  }
}) 