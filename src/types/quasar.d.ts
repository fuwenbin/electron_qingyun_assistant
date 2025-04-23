declare module 'quasar/wrappers' {
  import { App } from 'vue'
  import { Router } from 'vue-router'
  import { Store } from 'pinia'

  export interface BootFileParams<TStore = any> {
    app: App
    router: Router
    store: Store<TStore>
    urlPath: string
    publicPath: string
  }

  export interface QuasarConfig {
    supportTS?: boolean
    extras?: string[]
    framework?: {
      config?: {
        brand?: {
          primary?: string
          secondary?: string
          accent?: string
          dark?: string
          positive?: string
          negative?: string
          info?: string
          warning?: string
        }
      }
    }
  }

  export function configure(callback: (ctx: BootFileParams) => QuasarConfig): QuasarConfig
} 