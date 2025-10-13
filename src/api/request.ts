import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { message } from 'ant-design-vue'

// 响应数据类型
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// 是否正在刷新token的标志
let isRefreshing = false
// 存储待重试的请求队列
let requestsQueue: Array<(token: string) => void> = []

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_DEV_SERVER_URL || 'http://localhost:8000',
  timeout: 50000,
  headers: { 
    'Content-Type': 'application/json' 
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config: any) => {
    // 在发送请求之前做些什么 - 添加 token
    const token = localStorage.getItem('django_token')
    if (token) {
      // Django JWT 配置使用 JWT 前缀，不是 Bearer
      config.headers['Authorization'] = `JWT ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 刷新 Access Token 的函数
async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('django_refresh_token')
  
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }
  
  try {
    const response = await axios.post(
      `${service.defaults.baseURL}/token/refresh/`,
      { refresh: refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    )
    
    // 处理响应格式
    let newAccessToken: string
    let newRefreshToken: string | undefined
    
    if (response.data.code === 2000) {
      // 自定义格式：{ code: 2000, data: { access: "...", refresh: "..." } }
      newAccessToken = response.data.data.access
      newRefreshToken = response.data.data.refresh
    } else if (response.data.access) {
      // 原始格式：{ access: "...", refresh: "..." } (没有 code 字段)
      newAccessToken = response.data.access
      newRefreshToken = response.data.refresh
    } else {
      // 错误情况：有 code 但不是 2000，或者没有 access 字段
      throw new Error(response.data.msg || 'Token刷新失败')
    }
    
    // 验证 token 是否有效
    if (!newAccessToken) {
      throw new Error('获取到的 Access Token 为空')
    }
    
    localStorage.setItem('django_token', newAccessToken)
    
    // 如果返回了新的 refresh token，也更新它
    if (newRefreshToken) {
      localStorage.setItem('django_refresh_token', newRefreshToken)
    }
    
    return newAccessToken
  } catch (error) {
    // Refresh token 也过期了
    localStorage.removeItem('django_token')
    localStorage.removeItem('django_refresh_token')
    throw error
  }
}

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    
    // 如果响应的code不是2000，说明出错了
    if (res.code && res.code !== 2000) {
      // 租期过期
      if (res.code === 4003) {
        message.error(res.msg || '租期已过期')
        // 清除登录状态
        localStorage.removeItem('django_token')
        localStorage.removeItem('django_refresh_token')
        localStorage.removeItem('user_info')
        localStorage.removeItem('login_type')
        
        // 触发 user store 的 logout 方法，这会自动显示登录弹窗
        import('@/stores/user').then(({ useUserStore }) => {
          const userStore = useUserStore()
          userStore.logout()
        })
        
        return Promise.reject(new Error(res.msg || 'Expired'))
      }
      
      // 剪辑点数不足
      if (res.code === 4004) {
        message.error(res.msg || '剪辑点位数不足')
        return Promise.reject(new Error(res.msg || 'Insufficient'))
      }
      
      // token 过期或者账号已在别处登录
      if (res.code === 401 || res.code === 4001) {
        const config = response.config
        
        // 如果正在刷新token，将请求加入队列
        if (isRefreshing) {
          return new Promise((resolve) => {
            requestsQueue.push((token: string) => {
              if (config.headers) {
                config.headers['Authorization'] = `JWT ${token}`
              }
              resolve(service.request(config))
            })
          })
        }
        
        // 开始刷新token
        isRefreshing = true
        
        return refreshAccessToken()
          .then((newToken) => {
            // 刷新成功，重新发起原始请求
            if (config.headers) {
              config.headers['Authorization'] = `JWT ${newToken}`
            }
            
            // 执行队列中的请求
            requestsQueue.forEach(cb => cb(newToken))
            requestsQueue = []
            
            return service.request(config)
          })
          .catch((error) => {
            // Refresh token 也过期了，清除登录状态并触发登录弹窗
            message.error('登录已过期，请重新登录')
            requestsQueue = []
            
            // 清除本地存储
            localStorage.removeItem('django_token')
            localStorage.removeItem('django_refresh_token')
            localStorage.removeItem('user_info')
            localStorage.removeItem('login_type')
            
            // 触发 user store 的 logout 方法，这会自动显示登录弹窗
            import('@/stores/user').then(({ useUserStore }) => {
              const userStore = useUserStore()
              userStore.logout()
            })
            
            return Promise.reject(error)
          })
          .finally(() => {
            isRefreshing = false
          })
      } else {
        message.error(res.msg || '请求失败')
      }
      return Promise.reject(new Error(res.msg || 'Error'))
    }
    
    // 直接返回 response.data (ApiResponse格式)
    return res as any
  },
  (error) => {
    console.error('Response error:', error)
    
    if (error.message.indexOf('timeout') !== -1) {
      message.error('网络超时')
    } else if (error.message === 'Network Error') {
      message.error('网络连接错误')
    } else {
      const errorMsg = error.response?.data?.msg || error.response?.statusText || '接口路径找不到'
      message.error(errorMsg)
    }
    
    return Promise.reject(error)
  }
)

export default service

