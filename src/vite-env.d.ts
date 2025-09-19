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