import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      redirect: '/video/edit',
      children: [
        {
          path: '/video/edit',
          name: 'videoEdit',
          component: () => import('../views/video/VideoEdit/index.vue')
        }
      ]
    },
    {
      path: '/workspace',
      name: 'workspace',
      component: () => import('../views/WorkspaceView.vue')
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('../views/AccountView.vue')
    },
    {
      path: '/post',
      name: 'post',
      component: () => import('../views/PostView.vue')
    },
    {
      path: '/video',
      name: 'video',
      component: () => import('../views/video/VideoView.vue'),
      children: [
        {
          path: '/video/edit',
          name: 'videoEdit',
          component: () => import('../views/video/VideoEdit/index.vue')
        }
      ]
    },
    
    {
      path: '/data',
      name: 'data',
      component: () => import('../views/DataView.vue')
    },
    {
      path: '/team',
      name: 'team',
      component: () => import('../views/TeamView.vue')
    },
    {
      path: '/hot',
      name: 'hot',
      component: () => import('../views/HotView.vue')
    },
    {
      path: '/ai',
      name: 'ai',
      component: () => import('../views/AIView.vue')
    },
    {
      path: '/interaction',
      name: 'interaction',
      component: () => import('../views/InteractionView.vue')
    }
  ]
})

export default router 