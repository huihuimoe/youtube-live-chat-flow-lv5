import type { StorageLike } from 'pinia-plugin-persistedstate'
import type { Settings } from '~/models'

export const settingsStorageKey = 'settings'

let settingsCache: string | null = null

export const parseSettingsCache = (value: string): Partial<Settings> => {
  return JSON.parse(value) as Partial<Settings>
}

export const settingsStorage: StorageLike = {
  getItem: (key) => {
    return key === settingsStorageKey ? settingsCache : null
  },
  setItem: (key, value) => {
    if (key !== settingsStorageKey) {
      return
    }

    settingsCache = value
    void chrome.storage.local.set({ [key]: value })
  },
}

export const loadSettingsCache = async () => {
  const result = await chrome.storage.local.get(settingsStorageKey)
  const value = result[settingsStorageKey]
  settingsCache = typeof value === 'string' ? value : null
  return settingsCache
}
