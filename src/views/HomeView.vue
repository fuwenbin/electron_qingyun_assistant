<template>
  <MainLayout>
    <div class="home-view">
      <!-- 欢迎区域 -->
      <section class="welcome-section">
        <div class="welcome-content">
          <h1 class="welcome-title">欢迎使用易剪助手</h1>
          <p class="welcome-subtitle">AI驱动的智能视频创作平台</p>
          <div class="welcome-actions">
            <button class="btn-primary" @click="startNewProject">
              <i class="fas fa-plus"></i>
              新建项目
            </button>
            <button class="btn-secondary" @click="importProject">
              <i class="fas fa-file-import"></i>
              导入项目
            </button>
          </div>
        </div>
      </section>

      <!-- 最近项目 -->
      <section class="recent-projects">
        <div class="section-header">
          <h2 class="section-title">最近项目</h2>
          <a href="#" class="view-all">查看全部</a>
        </div>
        <div class="projects-grid">
          <div v-for="project in recentProjects" :key="project.id" class="project-card">
            <div class="project-preview">
              <img :src="project.thumbnail" :alt="project.title">
              <div class="project-overlay">
                <button class="btn-play" @click="openProject(project)">
                  <i class="fas fa-play"></i>
                </button>
              </div>
            </div>
            <div class="project-info">
              <h3 class="project-title">{{ project.title }}</h3>
              <p class="project-date">{{ project.lastModified }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 快速工具 -->
      <section class="quick-tools">
        <div class="section-header">
          <h2 class="section-title">快速工具</h2>
        </div>
        <div class="tools-grid">
          <a v-for="tool in quickTools" :key="tool.id" :href="tool.path" class="tool-card">
            <i :class="tool.icon"></i>
            <span class="tool-name">{{ tool.name }}</span>
          </a>
        </div>
      </section>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'

const router = useRouter()

// 最近项目数据
const recentProjects = ref([
  {
    id: 1,
    title: '产品宣传视频',
    thumbnail: '/src/assets/project-thumb-1.jpg',
    lastModified: '2024-03-15 14:30'
  },
  {
    id: 2,
    title: '活动回顾',
    thumbnail: '/src/assets/project-thumb-2.jpg',
    lastModified: '2024-03-14 16:45'
  },
  {
    id: 3,
    title: '教程视频',
    thumbnail: '/src/assets/project-thumb-3.jpg',
    lastModified: '2024-03-13 09:20'
  },
  {
    id: 4,
    title: '品牌故事',
    thumbnail: '/src/assets/project-thumb-4.jpg',
    lastModified: '2024-03-12 11:15'
  }
])

// 快速工具数据
const quickTools = ref([
  {
    id: 1,
    name: 'AI混剪',
    icon: 'fas fa-magic',
    path: '/video/edit'
  },
  {
    id: 2,
    name: '一键成片',
    icon: 'fas fa-bolt',
    path: '/quick-video'
  },
  {
    id: 3,
    name: '素材库',
    icon: 'fas fa-photo-video',
    path: '/materials'
  },
  {
    id: 4,
    name: 'AI写作',
    icon: 'fas fa-pen',
    path: '/ai-writing'
  }
])

// 方法
const startNewProject = () => {
  router.push('/video/edit')
}

const importProject = () => {
  // TODO: 实现项目导入功能
  console.log('导入项目')
}

const openProject = (project: any) => {
  // TODO: 实现项目打开功能
  console.log('打开项目', project)
}
</script>

<style lang="scss" scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.welcome-section {
  background: linear-gradient(135deg, var(--q-primary) 0%, var(--q-primary-3) 100%);
  border-radius: var(--q-border-radius-lg);
  padding: var(--q-space-xl);
  color: white;

  .welcome-content {
    max-width: 600px;
  }

  .welcome-title {
    font-size: 2.5rem;
    font-weight: 600;
    margin-bottom: var(--q-space-sm);
  }

  .welcome-subtitle {
    font-size: var(--q-font-size-lg);
    opacity: 0.9;
    margin-bottom: var(--q-space-lg);
  }

  .welcome-actions {
    display: flex;
    gap: var(--q-space-md);

    button {
      display: flex;
      align-items: center;
      gap: var(--q-space-sm);
      padding: var(--q-space-sm) var(--q-space-lg);
      border-radius: var(--q-border-radius-sm);
      font-size: var(--q-font-size-md);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      i {
        font-size: var(--q-font-size-lg);
      }
    }

    .btn-primary {
      background-color: white;
      color: var(--q-primary);
      border: none;

      &:hover {
        background-color: var(--q-grey-1);
      }
    }

    .btn-secondary {
      background-color: transparent;
      color: white;
      border: 2px solid white;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--q-space-lg);

  .section-title {
    font-size: var(--q-font-size-xl);
    font-weight: 600;
    color: var(--q-grey-8);
  }

  .view-all {
    color: var(--q-primary);
    text-decoration: none;
    font-size: var(--q-font-size-md);
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--q-space-lg);

  .project-card {
    background-color: white;
    border-radius: var(--q-border-radius-md);
    overflow: hidden;
    box-shadow: var(--q-shadow-sm);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--q-shadow-md);
    }

    .project-preview {
      position: relative;
      aspect-ratio: 16/9;
      background-color: var(--q-grey-2);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .project-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s ease;

        .btn-play {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s ease;

          i {
            color: var(--q-primary);
            font-size: var(--q-font-size-lg);
          }

          &:hover {
            transform: scale(1.1);
          }
        }
      }

      &:hover .project-overlay {
        opacity: 1;
      }
    }

    .project-info {
      padding: var(--q-space-md);

      .project-title {
        font-size: var(--q-font-size-md);
        font-weight: 500;
        color: var(--q-grey-8);
        margin-bottom: var(--q-space-xs);
      }

      .project-date {
        font-size: var(--q-font-size-sm);
        color: var(--q-grey-6);
      }
    }
  }
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--q-space-md);

  .tool-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--q-space-sm);
    padding: var(--q-space-lg);
    background-color: white;
    border-radius: var(--q-border-radius-md);
    text-decoration: none;
    color: var(--q-grey-8);
    box-shadow: var(--q-shadow-sm);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    i {
      font-size: 2rem;
      color: var(--q-primary);
    }

    .tool-name {
      font-size: var(--q-font-size-md);
      font-weight: 500;
    }

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--q-shadow-md);
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .welcome-section {
    padding: var(--q-space-lg);

    .welcome-title {
      font-size: 2rem;
    }

    .welcome-subtitle {
      font-size: var(--q-font-size-md);
    }

    .welcome-actions {
      flex-direction: column;
    }
  }

  .projects-grid {
    grid-template-columns: 1fr;
  }

  .tools-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style> 