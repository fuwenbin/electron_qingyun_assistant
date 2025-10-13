import request, { ApiResponse } from './request'
import CryptoJS from 'crypto-js'

// 登录请求参数
export interface LoginParams {
  username: string
  password: string
  captcha?: string
  captchaKey?: string
}

// 验证码响应
export interface CaptchaResponse {
  key: string
  image_base: string
}

// 登录响应数据
export interface LoginResponse {
  access: string
  refresh: string
  username: string
  name: string
  userId: number
  avatar: string
  user_type: number
  pwd_change_count: number
  expire_date?: string | null
  edite_count?: number
  dept_info?: {
    dept_id: number
    dept_name: string
  }
  role_info?: Array<{
    id: number
    name: string
    key: string
  }>
}

// 用户信息响应
export interface UserInfoResponse {
  id: number
  username: string
  name: string
  mobile: string
  user_type: number
  gender: number
  email: string
  avatar: string
  dept: number
  is_superuser: boolean
  role: number[]
  pwd_change_count: number
  expire_date?: string | null
  edite_count?: number
  dept_info?: {
    dept_id: number
    dept_name: string
  }
  role_info?: Array<{
    id: number
    name: string
    key: string
  }>
}

/**
 * 获取验证码
 */
export function getCaptcha(): Promise<ApiResponse<CaptchaResponse>> {
  return request({
    url: '/api/captcha/',
    method: 'get'
  }) as Promise<ApiResponse<CaptchaResponse>>
}

/**
 * Django 登录
 * @param params 登录参数
 */
export function djangoLogin(params: LoginParams): Promise<ApiResponse<LoginResponse>> {
  // 前端 MD5 加密密码
  const md5Password = CryptoJS.MD5(params.password).toString()
  
  return request({
    url: '/api/login/',
    method: 'post',
    data: {
      ...params,
      password: md5Password
    }
  }) as Promise<ApiResponse<LoginResponse>>
}

/**
 * 获取当前用户信息
 */
export function getUserInfo(): Promise<ApiResponse<UserInfoResponse>> {
  return request({
    url: '/api/system/user/user_info/',
    method: 'get'
  }) as Promise<ApiResponse<UserInfoResponse>>
}

/**
 * 登出
 */
export function logout(): Promise<ApiResponse<null>> {
  return request({
    url: '/api/logout/',
    method: 'post'
  }) as Promise<ApiResponse<null>>
}

/**
 * 刷新 Token
 */
export function refreshToken(refresh: string): Promise<ApiResponse<{ access: string }>> {
  return request({
    url: '/token/refresh/',
    method: 'post',
    data: { refresh }
  }) as Promise<ApiResponse<{ access: string }>>
}

/**
 * 首次登录修改密码
 */
export function loginChangePassword(data: { password: string; password_regain: string }): Promise<ApiResponse<null>> {
  return request({
    url: '/api/system/user/login_change_password/',
    method: 'post',
    data
  }) as Promise<ApiResponse<null>>
}

// 扣除剪辑点数响应
export interface DeductEditeCountResponse {
  edite_count: number
  expire_date: string | null
  message: string
  is_expired?: boolean
  is_insufficient?: boolean
}

/**
 * 扣除剪辑点位数或检查用户状态
 * @param cutCount 扣除数量，默认1；传入0时只检查不扣除
 */
export function deductEditeCount(cutCount: number = 1): Promise<ApiResponse<DeductEditeCountResponse>> {
  return request({
    url: '/api/system/user/deduct_edite_count/',
    method: 'post',
    data: { cut_count: cutCount }
  }) as Promise<ApiResponse<DeductEditeCountResponse>>
}

/**
 * 检查用户状态（租期和点数）
 * 不扣除点数，只检查
 */
export function checkUserStatus(): Promise<ApiResponse<DeductEditeCountResponse>> {
  return deductEditeCount(0)
}

