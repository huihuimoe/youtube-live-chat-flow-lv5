import vue from '@vitejs/plugin-vue'
import { crx } from '@crxjs/vite-plugin'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vuetify from 'vite-plugin-vuetify'
import manifest from './manifest.config'

export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true }), crx({ manifest })],
  build: {
    outDir: 'app',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
      '~~': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
})
