<template>
  <div class="sidebar">
    <div class="menu-list">
      <template v-for="item in props.menuItems" :key="item.path">
        <!-- 普通菜单项 -->
        <router-link 
          v-if="!item.children" 
          :to="item.path" 
          class="menu-item" 
          active-class="active"
        >
          <i :class="item.icon"></i>
          <span>{{ item.title }}</span>
        </router-link>
        
        <!-- 带子菜单的菜单项 -->
        <div v-else class="menu-item-group">
          <div 
            class="menu-item" 
            :class="{ active: isSubmenuActive(item) }"
            @click="toggleSubmenu(item.path)"
          >
            <i :class="item.icon"></i>
            <span>{{ item.title }}</span>
            <i 
              class="fas fa-chevron-down submenu-arrow"
              :class="{ 'arrow-rotated': isSubmenuOpen(item.path) }"
            ></i>
          </div>
          
          <!-- 子菜单 -->
          <div 
            v-show="isSubmenuOpen(item.path)" 
            class="submenu"
          >
            <router-link 
              v-for="child in item.children" 
              :key="child.path"
              :to="child.path" 
              class="submenu-item" 
              active-class="active"
            >
              <i :class="child.icon"></i>
              <span>{{ child.title }}</span>
            </router-link>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import eventBus, { SIDEBAR_EVENTS } from '@/utils/eventBus'

interface MenuItem {
  path: string
  title: string
  icon: string
  children?: MenuItem[]
}

interface Props {
  menuItems: MenuItem[]
}

const props = defineProps<Props>()
const route = useRoute()
const openSubmenus = ref<Record<string, boolean>>({})

// 检查子菜单是否激活
const isSubmenuActive = (item: MenuItem) => {
  if (!item.children) return false
  return item.children.some(child => route.path.startsWith(child.path))
}

// 切换子菜单
const toggleSubmenu = (menu: string) => {
  openSubmenus.value[menu] = !openSubmenus.value[menu]
  eventBus.emit(SIDEBAR_EVENTS.SUBMENU_TOGGLE, { menu, isOpen: openSubmenus.value[menu] })
}

// 检查子菜单是否打开
const isSubmenuOpen = (menu: string) => {
  return openSubmenus.value[menu] || false
}

// 监听事件总线中的状态变化
onMounted(() => {
  const unsubscribeSubmenu = eventBus.on(SIDEBAR_EVENTS.SUBMENU_TOGGLE, ({ menu, isOpen }: { menu: string, isOpen: boolean }) => {
    openSubmenus.value[menu] = isOpen
  })
  
  onUnmounted(() => {
    unsubscribeSubmenu()
  })
})
</script>

<style lang="scss" scoped>
.sidebar {
  width: 240px;
  height: 100%;
  background-color: #fff;
  border-right: 1px solid #e0e0e0;
  position: relative;
  z-index: 1000;
}

.menu-list {
  padding: 16px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: #333;
  text-decoration: none;
  transition: all 0.3s;
  cursor: pointer;
  width: 240px;

  i {
    width: 20px;
    margin-right: 12px;
    font-size: 16px;
  }

  &:hover {
    background-color: #f5f5f5;
  }

  &.active {
    color: #1976d2;
    background-color: #e3f2fd;
  }
}

.menu-item-group {
  position: relative;
}

.submenu-arrow {
  margin-left: auto;
  transition: transform 0.3s ease;
  font-size: 12px;
  
  &.arrow-rotated {
    transform: rotate(180deg);
  }
}

.submenu {
  margin-left: 32px;
  margin-top: 4px;
  border-left: 1px solid #e0e0e0;
}

.submenu-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  color: #333;
  text-decoration: none;
  transition: all 0.3s;
  font-size: 14px;

  i {
    width: 16px;
    margin-right: 12px;
    font-size: 14px;
  }

  &:hover {
    background-color: #f5f5f5;
  }

  &.active {
    color: #1976d2;
    background-color: #e3f2fd;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }

  .menu-list {
    padding: 8px 0;
  }

  .submenu {
    margin-left: 16px;
  }
}
</style> 