import { defineStore } from 'pinia'

interface UserState {
  isLoggedIn: boolean
  userInfo: {
    name: string
    avatar: string
    unreadNotifications: number
  } | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    isLoggedIn: false,
    userInfo: null
  }),

  actions: {
    login() {
      // 模拟登录
      this.isLoggedIn = true
      this.userInfo = {
        name: '测试用户',
        avatar: 'https://placekitten.com/32/32',
        unreadNotifications: 3
      }
    },

    logout() {
      this.isLoggedIn = false
      this.userInfo = null
    },

    updateUserInfo(info: Partial<UserState['userInfo']>) {
      if (this.userInfo) {
        this.userInfo = { ...this.userInfo, ...info }
      }
    }
  }
}) 