import vue from '@vitejs/plugin-vue'
import { crx } from '@crxjs/vite-plugin'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vuetify from 'vite-plugin-vuetify'
import manifest from './manifest.config'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
      styles: { configFile: 'src/styles/vuetify-settings.scss' },
    }),
    crx({ manifest }),
  ],
  build: {
    outDir: 'app',
    emptyOutDir: true,
  },
  css: {
    transformer: 'lightningcss',
  },
  server: {
    cors: {
      origin: [
        /^https?:\/\/(?:(?:[^:]+\.)?localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/,
        /^chrome-extension:\/\//,
      ],
    },
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
      '~~': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
})
