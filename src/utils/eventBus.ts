import { ref } from 'vue'

// 事件类型定义
export const SIDEBAR_EVENTS = {
  TOGGLE: 'sidebar:toggle',
  ACTIVE_ITEM: 'sidebar:active-item',
  SUBMENU_TOGGLE: 'sidebar:submenu-toggle'
} as const

// 侧边栏状态
export const sidebarState = {
  isCollapsed: ref(false),
  activeItem: ref(''),
  openSubmenus: ref<string[]>([])
}

// 事件总线类型
type EventCallback = (...args: any[]) => void

class EventBus {
  private events: Map<string, Set<EventCallback>>

  constructor() {
    this.events = new Map()
  }

  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(callback)

    // 返回取消订阅函数
    return () => {
      this.off(event, callback)
    }
  }

  off(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) return
    this.events.get(event)!.delete(callback)
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events.has(event)) return
    this.events.get(event)!.forEach(callback => {
      callback(...args)
    })
  }

  // 清除所有事件监听
  clear(): void {
    this.events.clear()
  }
}

// 创建单例实例
const eventBus = new EventBus()

export default eventBus 