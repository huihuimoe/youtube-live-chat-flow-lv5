import vue from '@vitejs/plugin-vue2'
import { crx } from '@crxjs/vite-plugin'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import manifest from './manifest.config'

export default defineConfig({
  plugins: [vue(), crx({ manifest })],
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
