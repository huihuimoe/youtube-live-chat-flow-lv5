import type { StorageLike } from 'pinia-plugin-persistedstate'
import type { Settings } from '~/models'

export const settingsStorageKey = 'settings'

let settingsCache: string | null = null

const getStoredSettings = async (storage: chrome.storage.StorageArea) => {
  const result = await storage.get(settingsStorageKey)
  const value = result[settingsStorageKey]
  return typeof value === 'string' ? value : null
}

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
    void chrome.storage.sync.set({ [key]: value })
  },
}

export const loadSettingsCache = async () => {
  settingsCache = await getStoredSettings(chrome.storage.sync)
  if (settingsCache) {
    return settingsCache
  }

  settingsCache = await getStoredSettings(chrome.storage.local)
  if (settingsCache) {
    void chrome.storage.sync.set({ [settingsStorageKey]: settingsCache })
  }

  return settingsCache
}
