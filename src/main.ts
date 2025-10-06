// Import process polyfill first to ensure it's available globally
import './utils/process-polyfill'
// Import Ant Design Vue polyfill to fix global functions
import './utils/antd-polyfill'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Dialog, Notify } from 'quasar'
import Antd from 'ant-design-vue';

// Import Quasar css
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/fontawesome-v6/fontawesome-v6.css'
import '@quasar/extras/roboto-font/roboto-font.css'
import 'quasar/dist/quasar.css'

import App from './App.vue'
import router from './router'

import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Quasar, {
  plugins: {
    Dialog,
    Notify
  },
  config: {
    brand: {
      primary: '#4e6ef2',
      secondary: '#1a1a1a',
      accent: '#ff4d4f',
      dark: '#1d1d1d',
      positive: '#52c41a',
      negative: '#ff4d4f',
      info: '#1890ff',
      warning: '#faad14'
    },
    notify: {
      position: 'top-right',
      timeout: 2500,
      textColor: 'white'
    }
  }
})
app.use(Antd)

app.mount('#app') 