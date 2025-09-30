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
    'process.env': '(typeof process !== "undefined" ? process.env : {})',
    __dirname: JSON.stringify(path.resolve()),
    // 修复 @stackframe/stack 的 Next.js 兼容性问题 - 直接替换整个表达式
    'import.meta.env.__NEXT_CACHE_COMPONENTS': 'undefined',
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
    // 修复 @stackframe/stack 包的路径问题
    {
      name: 'fix-stackframe-imports',
      resolveId(id, importer) {
        if (id.includes('globalThis-css.js') && importer?.includes('@stackframe/stack')) {
          return resolve(__dirname, 'node_modules/@stackframe/stack/dist/esm/generated/global-css.js')
        }
        return null
      }
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      util: 'util',
      path: 'path-browserify',
      ws: resolve(__dirname, 'src/utils/ws-polyfill.js'),
      process: 'process/browser',
      // 修复 @stackframe/stack 包的路径问题
      '../generated/globalThis-css.js': 
        resolve(__dirname, 'node_modules/@stackframe/stack/dist/esm/generated/global-css.js'),
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