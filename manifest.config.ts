import { defineManifest } from '@crxjs/vite-plugin'
import packageJson from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: packageJson.productName,
  description: packageJson.description,
  version: packageJson.version,
  icons: {
    128: 'src/icon.png',
  },
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  content_scripts: [
    {
      run_at: 'document_start',
      matches: ['https://www.youtube.com/*'],
      all_frames: false,
      js: ['src/content-script.ts'],
      css: ['src/content-script.css'],
    },
    {
      run_at: 'document_start',
      matches: ['https://www.youtube.com/live_chat*'],
      all_frames: true,
      js: ['src/content-script-iframe.ts'],
      css: ['src/content-script-iframe.css'],
    },
  ],
  action: {
    default_icon: 'src/icon.png',
    default_popup: 'src/popup.html',
  },
  options_ui: {
    page: 'src/options.html',
    open_in_tab: true,
  },
  permissions: ['storage', 'clipboardRead', 'clipboardWrite'],
  host_permissions: ['https://www.youtube.com/*'],
})
