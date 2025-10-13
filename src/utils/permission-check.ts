/**
 * 权限检查工具（简化版）
 * 使用 deductEditeCount(0) API 统一检查租期和点数
 */

import { checkUserStatus, deductEditeCount } from '@/api/login'
import { useUserStore } from '@/stores/user'
import { Modal } from 'ant-design-vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { h } from 'vue'

/**
 * 检查用户权限（租期和点数）
 * @param showDialog 是否显示提示对话框
 * @returns Promise<boolean> 是否可以继续操作
 */
export async function checkPermission(showDialog: boolean = true): Promise<boolean> {
  const userStore = useUserStore()
  
  // 检查是否登录
  if (!userStore.isLoggedIn) {
    if (showDialog) {
      Modal.warning({
        title: '未登录',
        content: '请先登录后再进行操作',
        icon: h(ExclamationCircleOutlined)
      })
    }
    return false
  }
  
  try {
    // 调用后端 API 检查（cut_count=0 只检查不扣除）
    const response = await checkUserStatus()
    
    if (response.code === 2000) {
      // 更新本地缓存
      userStore.updateUserInfo({
        edite_count: response.data.edite_count,
        expire_date: response.data.expire_date
      })
      
      console.log('[权限检查] 通过:', response.data.message)
      return true
    }
    
    return false
  } catch (error: any) {
    // 错误已在 request.ts 拦截器中处理（4003租期过期, 4004点数不足）
    console.error('[权限检查] 失败:', error)
    return false
  }
}

/**
 * 检查剪辑点数是否足够（会检查租期+点数，但不扣除）
 * @param requiredCount 需要的点数
 * @param showDialog 是否显示提示
 * @returns Promise<boolean> 是否足够
 */
export async function checkEditeCount(
  requiredCount: number,
  showDialog: boolean = true
): Promise<boolean> {
  const userStore = useUserStore()
  
  try {
    // 先检查租期和基本状态（cut_count=0）
    const statusCheck = await checkUserStatus()
    
    if (statusCheck.code !== 2000) {
      return false
    }
    
    // 更新本地缓存
    const currentCount = statusCheck.data.edite_count
    userStore.updateUserInfo({
      edite_count: currentCount,
      expire_date: statusCheck.data.expire_date
    })
    
    // 检查点数是否足够
    if (currentCount < requiredCount) {
      if (showDialog) {
        Modal.error({
          title: '剪辑点位数不足',
          content: `当前剩余：${currentCount}，需要：${requiredCount}`,
          icon: h(ExclamationCircleOutlined),
          okText: '知道了'
        })
      }
      return false
    }
    
    return true
  } catch (error) {
    console.error('[点数检查] 失败:', error)
    return false
  }
}

/**
 * 执行操作并扣除点数（会检查租期+点数+扣除）
 * @param cutCount 要扣除的点数
 * @param showDialog 是否显示提示
 * @returns Promise<{ success: boolean; newCount: number }>
 */
export async function executeWithDeduct(
  cutCount: number,
  showDialog: boolean = true
): Promise<{ success: boolean; newCount: number; message: string }> {
  const userStore = useUserStore()
  
  try {
    // 调用 API 扣除点数（会自动检查租期和点数）
    const response = await deductEditeCount(cutCount)
    
    if (response.code === 2000) {
      // 更新本地缓存
      userStore.updateUserInfo({
        edite_count: response.data.edite_count,
        expire_date: response.data.expire_date
      })
      
      if (showDialog) {
        // 可选：显示成功提示
        // message.success(response.data.message)
      }
      
      return {
        success: true,
        newCount: response.data.edite_count,
        message: response.data.message
      }
    }
    
    return {
      success: false,
      newCount: 0,
      message: response.msg
    }
  } catch (error: any) {
    // 错误已在 request.ts 中处理
    return {
      success: false,
      newCount: 0,
      message: error.message || '操作失败'
    }
  }
}
