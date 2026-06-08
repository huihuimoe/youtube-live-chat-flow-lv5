import { createPinia } from 'pinia'
import {
  loadSettingsCache,
  parseSettingsCache,
  saveSettingsCache,
} from '~/store/persistence'
import { createInitialSettings, useSettingsStore } from '~/store/settings'

export const pinia = createPinia()

export const settingsStore = useSettingsStore(pinia)

let broadcasting = false
let persisting = false

const loadSettingsStore = async () => {
  const rawSettings = await loadSettingsCache()
  const state = rawSettings
    ? parseSettingsCache(rawSettings)
    : createInitialSettings()

  settingsStore.$patch(state)

  return settingsStore
}

const startSettingsPersistence = () => {
  if (persisting) {
    return
  }

  persisting = true
  settingsStore.$subscribe(
    () => {
      saveSettingsCache(settingsStore.$state)
    },
    { detached: true },
  )
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
  startSettingsPersistence()
  startSettingsBroadcast()
  return store
}
