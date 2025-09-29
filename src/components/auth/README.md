# 登录弹窗组件使用说明

## 概述

本登录弹窗组件提供了完整的用户认证解决方案，支持多种登录方式，包括账号密码登录、短信验证码登录和第三方快捷登录。

## 组件特性

- 🔐 **多种登录方式**：支持密码登录、短信验证码登录、第三方登录
- 🎨 **现代化 UI**：基于 Ant Design Vue，界面美观易用
- 📱 **响应式设计**：完美适配桌面端和移动端
- 🛡️ **安全可靠**：内置表单验证和错误处理
- 🔄 **状态管理**：集成 Pinia 用户状态管理
- ⚡ **易于集成**：提供多种使用方式和工具函数

## 文件结构

```
src/components/auth/
├── LoginModal.vue      # 主登录弹窗组件
├── AuthExample.vue     # 使用示例组件
└── README.md          # 使用说明文档

src/utils/
└── auth.ts            # 认证工具函数
```

## 快速开始

### 1. 基础使用

```vue
<template>
  <div>
    <a-button @click="showLogin">登录</a-button>
    <LoginModal 
      v-model:open="loginVisible" 
      @success="handleLoginSuccess"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LoginModal from '@/components/auth/LoginModal.vue'

const loginVisible = ref(false)

const showLogin = () => {
  loginVisible.value = true
}

const handleLoginSuccess = (userInfo) => {
  console.log('登录成功:', userInfo)
}
</script>
```

### 2. 使用工具函数

```javascript
import { showLoginModal, requireAuth, useAuth } from '@/utils/auth'

// 显示登录弹窗
const success = await showLoginModal({
  title: '请登录',
  onSuccess: (userInfo) => {
    console.log('登录成功:', userInfo)
  }
})

// 检查登录状态，未登录则显示弹窗
const isAuthed = await requireAuth()

// 在组件中使用 Hook
const { isLoggedIn, userInfo, login, logout } = useAuth()
```

## API 参考

### LoginModal 组件 Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `open` | `boolean` | `false` | 是否显示弹窗 |
| `required` | `boolean` | `false` | 是否为必须登录（不可关闭） |
| `title` | `string` | `'登录授权'` | 弹窗标题 |
| `onSuccess` | `function` | - | 登录成功回调函数 |

### LoginModal 组件 Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `update:open` | `(value: boolean)` | 弹窗显示状态变化 |
| `success` | `(userInfo: any)` | 登录成功 |
| `cancel` | - | 取消登录 |

### 工具函数

#### `showLoginModal(options)`

显示登录弹窗的函数式调用。

```typescript
interface LoginOptions {
  required?: boolean      // 是否必须登录
  title?: string         // 弹窗标题
  onSuccess?: (userInfo: any) => void  // 成功回调
  onCancel?: () => void  // 取消回调
}
```

#### `requireAuth(options)`

检查用户登录状态，未登录则显示弹窗。

```javascript
const isAuthed = await requireAuth({
  title: '此功能需要登录',
  onSuccess: () => {
    console.log('权限验证成功')
  }
})
```

#### `withAuth(fn, options)`

函数包装器，为函数添加登录检查。

```javascript
const protectedFunction = withAuth(
  (param) => {
    // 需要登录的业务逻辑
    return handleData(param)
  },
  { title: '此功能需要登录' }
)

const result = await protectedFunction('数据')
```

#### `useAuth()`

Vue 组合式 API Hook。

```javascript
const {
  isLoggedIn,     // 响应式登录状态
  userInfo,       // 响应式用户信息
  login,          // 登录函数
  logout,         // 登出函数
  requireLogin    // 要求登录函数
} = useAuth()
```

## 登录方式

### 1. 账号密码登录

- 支持用户名、邮箱、手机号登录
- 内置表单验证
- 记住我功能
- 忘记密码链接

### 2. 短信验证码登录

- 手机号格式验证
- 验证码发送与倒计时
- 防重复发送机制

### 3. 第三方快捷登录

- 微信登录
- QQ登录
- 支付宝登录

## 集成示例

### 在路由守卫中使用

```javascript
import { authGuard } from '@/utils/auth'

// 单个路由
const routes = [
  {
    path: '/profile',
    component: Profile,
    meta: { requiresAuth: true },
    beforeEnter: authGuard
  }
]

// 全局守卫
router.beforeEach(async (to, from, next) => {
  await authGuard(to, from, next, {
    title: '访问此页面需要登录'
  })
})
```

### 在 API 调用中使用

```javascript
import { requireAuth } from '@/utils/auth'

const apiCall = async () => {
  // 确保用户已登录
  const isAuthed = await requireAuth({
    title: '此操作需要登录'
  })
  
  if (isAuthed) {
    // 执行 API 调用
    const result = await fetch('/api/data')
    return result.json()
  }
}
```

### 按钮级别的权限控制

```vue
<template>
  <div>
    <a-button 
      v-if="isLoggedIn" 
      @click="handleVipAction"
    >
      VIP 功能
    </a-button>
    
    <a-button 
      v-else 
      @click="requireLogin"
    >
      登录后使用
    </a-button>
  </div>
</template>

<script setup>
import { useAuth } from '@/utils/auth'

const { isLoggedIn, requireLogin } = useAuth()

const handleVipAction = () => {
  // VIP 功能逻辑
}
</script>
```

## 自定义配置

### 修改登录 API

在 `LoginModal.vue` 中找到 `mockLoginAPI` 函数，替换为实际的 API 调用：

```javascript
// 替换模拟 API
const loginAPI = async (params) => {
  const response = await window.electronAPI.apiRequest({
    url: '/auth/login',
    method: 'POST',
    data: params
  })
  
  return response
}
```

### 自定义用户状态

在 `src/stores/user.ts` 中自定义用户状态结构：

```javascript
interface UserState {
  isLoggedIn: boolean
  userInfo: {
    id: string
    name: string
    email: string
    avatar: string
    role: string
    // 添加更多字段
  } | null
}
```

### 样式自定义

组件使用 SCSS 编写样式，支持 CSS 变量自定义：

```scss
// 自定义主题色
:root {
  --ant-primary-color: #1890ff;  // 主色调
  --ant-primary-color-hover: #40a9ff;  // 悬停色
}
```

## 注意事项

1. **安全性**：示例中的登录逻辑是模拟的，生产环境请替换为真实的认证 API
2. **错误处理**：组件内置了基础错误处理，可根据需要扩展
3. **状态持久化**：用户状态目前存储在内存中，需要时可添加 localStorage 持久化
4. **第三方登录**：第三方登录需要配置对应的 SDK 和回调处理
5. **国际化**：组件文本支持国际化，可配置多语言

## 故障排除

### 常见问题

1. **弹窗不显示**
   - 检查 `open` 属性是否正确绑定
   - 确认组件已正确导入

2. **登录失败**
   - 检查 API 接口是否正常
   - 查看浏览器控制台错误信息

3. **样式问题**
   - 确认 Ant Design Vue 样式已正确引入
   - 检查 CSS 变量是否被覆盖

4. **状态不更新**
   - 确认 Pinia store 已正确配置
   - 检查状态更新逻辑

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个组件！

## 许可证

MIT License
