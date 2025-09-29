import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    global: 'globalThis',
    'process.env': 'import.meta.env',
    __dirname: JSON.stringify(path.resolve()),
  },
  plugins: [
    vue({
      template: { 
        transformAssetUrls,
        compilerOptions: {
          isCustomElement: (tag) => tag === 'webview'
        }
      }
    }),
    quasar({
      sassVariables: 'src/quasar-variables.scss'
    }),
    electron([
      {
        // Main process entry file
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            sourcemap: true,
            rollupOptions: {
              external: ['ws'], // 确保 ws 只在主进程使用
              output: {
                inlineDynamicImports: true,
              },
            },
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
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      util: 'util',
      path: 'path-browserify',
      ws: resolve(__dirname, 'src/utils/ws-polyfill.js'),
      process: 'process/browser'
    },
  },
  build: {
    rollupOptions: {
      external: ['ws', 'electron']
    }
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
  worker: {
    // 明确指定 worker 格式
    format: 'es',
    plugins: [
      {
        name: 'worker-relative-path',
        resolveId(source) {
          if (source.startsWith('node_modules')) {
            return path.resolve(__dirname, source)
          }
          return null
        }
      }
    ]
  },
  base: './', // 确保相对路径
  optimizeDeps: {
    include: ['process'],
    exclude: [
      'electron',
      'sql.js'
    ]
  }
}) 