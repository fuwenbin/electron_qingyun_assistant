/// <reference types="vite/client" />
/// <reference types="electron" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 环境变量类型声明
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // 添加其他环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 扩展全局类型声明，支持 Ant Design Vue 的全局函数
declare global {
  var getRootPrefixCls: (suffixCls?: string, customizePrefixCls?: string) => string
  var getIconPrefixCls: () => string
  
  interface Window {
    getRootPrefixCls?: (suffixCls?: string, customizePrefixCls?: string) => string
    getIconPrefixCls?: () => string
  }
}