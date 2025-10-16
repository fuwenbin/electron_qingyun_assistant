import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/video/edit'
    }, {
      path: '/account',
      name: 'account',
      component: () => import('../views/account/Account.vue')
    }, {
      path: '/publish-video',
      name: 'publish-video',
      component: () => import('../views/publish-video/index.vue'),
      redirect: '/publish-video/batch-publish',
      children: [
        {
          path: '/publish-video/batch-publish',
          name: 'publish-video-batch-publish',
          component: () => import('../views/publish-video/batch-publish/index.vue')
        },
        {
          path: '/publish-video/my-videos',
          name: 'publish-video-my-videos',
          component: () => import('../views/publish-video/MyVideos.vue')
        },
        {
          path: '/publish-video/my-settings',
          name: 'publish-video-my-settings',
          component: () => import('../views/publish-video/MySettings.vue')
        },
        {
          path: '/publish-video/my-tasks',
          name: 'publish-video-my-tasks',
          component: () => import('../views/publish-video/MyTasks.vue')
        },
      ]
    },
    // {
    //   path: '/workspace',
    //   name: 'workspace',
    //   component: () => import('../views/WorkspaceView.vue')
    // },
    {
      path: '/video',
      name: 'video',
      component: () => import('../views/video/VideoView.vue'),
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
      path: '/test',
      name: 'test',
      component: () => import('../views/TestView.vue')
    }
  ]
})

export default router 