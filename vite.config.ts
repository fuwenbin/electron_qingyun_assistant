import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    quasar({
      sassVariables: 'src/quasar-variables.scss'
    }),
    electron([
      {
        // Main process entry file
        entry: 'electron/main.ts',
        onstart(options: any) {
          options.reload = (path) => {
            if (path.endsWith('.worker.js')) {
              // 特殊处理worker文件
              options.mainWindow.webContents.session.webRequest.onBeforeRequest(
                { urls: [`${process.env.VITE_DEV_SERVER_URL}*.worker.js`] },
                (details, callback) => {
                  const filePath = path.join(__dirname, details.url.replace(process.env.VITE_DEV_SERVER_URL, ''))
                  callback({ redirectURL: `file://${filePath}` })
                }
              )
            }
          }
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            sourcemap: true,
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            sourcemap: true,
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 使用新的 Sass 模块 API
        sassOptions: {
          outputStyle: 'expanded',
        },
      },
    },
  },
}) 