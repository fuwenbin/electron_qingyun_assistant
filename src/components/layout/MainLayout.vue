<template>
  <div class="main-layout">
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <img src="@/assets/logo.png" alt="Logo" />
          <span>青云助手</span>
        </div>
        <nav class="nav-links">
          <router-link to="/account" class="nav-link">账号</router-link>
        </nav>
        <nav class="nav-links">
          <router-link to="/video/edit" class="nav-link">AI创作</router-link>
        </nav>
      </div>
      <div class="header-right">
        <button class="upgrade-btn">
          <i class="fas fa-crown"></i>
          <span>会员升级</span>
        </button>
        <div class="user-actions">
          <button class="action-btn">
            <i class="fas fa-bell"></i>
          </button>
          <button class="action-btn">
            <i class="fas fa-cog"></i>
          </button>
          <button class="action-btn">
            <i class="fas fa-user"></i>
          </button>
        </div>
      </div>
    </header>
    
    <main class="main-content" :class="{ 'content-expanded': isSidebarCollapsed }">
      <slot></slot>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import eventBus, { sidebarState, SIDEBAR_EVENTS } from '@/utils/eventBus'

const isSidebarCollapsed = ref(sidebarState.isCollapsed.value)

onMounted(() => {
  const unsubscribe = eventBus.on(SIDEBAR_EVENTS.TOGGLE, (value: boolean) => {
    isSidebarCollapsed.value = value
  })
  
  onUnmounted(() => {
    unsubscribe()
  })
})
</script>

<style lang="scss" scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  
  img {
    height: 32px;
    width: auto;
  }
  
  span {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
}

.nav-links {
  display: flex;
  gap: 24px;
}

.nav-link {
  color: #666;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
  
  &:hover {
    color: var(--q-primary);
  }
  
  &.router-link-active {
    color: var(--q-primary);
    font-weight: 500;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.upgrade-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: var(--q-primary);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: var(--q-primary-dark);
  }
  
  i {
    font-size: 16px;
  }
}

.user-actions {
  display: flex;
  gap: 16px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: #666;
  cursor: pointer;
  transition: color 0.3s ease;
  
  &:hover {
    color: var(--q-primary);
  }
  
  i {
    font-size: 18px;
  }
}

.main-content {
  min-height: calc(100vh - 60px);
  transition: margin-left 0.3s ease;
  
  &.content-expanded {
    margin-left: 60px;
  }
}

@media (max-width: 768px) {
  .header {
    padding: 0 16px;
  }
  
  .nav-links {
    display: none;
  }
  
  .main-content {
    margin-left: 0;
    padding: 16px;
    
    &.content-expanded {
      margin-left: 60px;
    }
  }
}
</style> 