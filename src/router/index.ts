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
    }, {
      path: '/account',
      name: 'account',
      component: () => import('../views/account/Account.vue'),
      redirect: '/account/',
      children: [
        {
          path: '/account/',
          name: 'account-home',
          component: () => import('../views/account/AccountHome.vue')
        },
        {
          path: '/account/add',
          name: 'account-add',
          component: () => import('../views/account/AccountAdd.vue')
        }
      ]
    }, {
      path: '/publish-video',
      name: 'publish-video',
      component: () => import('../views/publish-video/index.vue'),
      redirect: '/publish-video/single-publish',
      children: [
        {
          path: '/publish-video/single-publish',
          name: 'publish-video-single-publish',
          component: () => import('../views/publish-video/SinglePublish.vue')
        },
      ]
    },
    {
      path: '/workspace',
      name: 'workspace',
      component: () => import('../views/WorkspaceView.vue')
    },
    {
      path: '/video/edit',
      name: 'videoEdit',
      component: () => import('../views/video/VideoEdit/index.vue')
    },
    {
      path: '/test',
      name: 'test',
      component: () => import('../views/TestView.vue')
    }
  ]
})

export default router 