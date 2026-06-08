import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { loadSettingsCache, parseSettingsCache } from '~/store/persistence'
import { createInitialSettings, useSettingsStore } from '~/store/settings'

export const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export const settingsStore = useSettingsStore(pinia)

let broadcasting = false

const loadSettingsStore = async () => {
  const rawSettings = await loadSettingsCache()
  const state = rawSettings
    ? parseSettingsCache(rawSettings)
    : createInitialSettings()

  settingsStore.$patch(state)

  return settingsStore
}

const startSettingsBroadcast = () => {
  if (broadcasting || typeof document === 'undefined') {
    return
  }

  broadcasting = true
  settingsStore.$subscribe(
    () => {
      void chrome.runtime.sendMessage({ type: 'settings-changed' })
    },
    { detached: true },
  )
}

export const readyStore = async () => {
  const store = await loadSettingsStore()
  startSettingsBroadcast()
  return store
}
