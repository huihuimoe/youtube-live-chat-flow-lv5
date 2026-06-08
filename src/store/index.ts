import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersistence from 'vuex-persist'
import { getModule } from 'vuex-module-decorators'
import settings from '~/store/settings'

Vue.use(Vuex)

const vuexPersist = new VuexPersistence({
  storage: chrome.storage.local as any,
  asyncStorage: true,
  restoreState: async (key, storage) => {
    const result = await storage?.get(key)
    const json = result[key]

    let state = {}
    try {
      state = JSON.parse(json)
    } catch {
      state = {}
    }

    return {
      ...state,
      __storageReady: true,
    }
  },
  saveState: async (key, state, storage) => {
    const json = JSON.stringify(state)
    await storage?.set({ [key]: json })
  },
})

const createStore = () =>
  new Vuex.Store<any>({
    state: {},
    modules: {
      settings,
    },
    plugins: [
      vuexPersist.plugin,
      (store) => {
        store.subscribe(
          async () =>
            await chrome.runtime.sendMessage({ type: 'settings-changed' }),
        )
      },
    ],
  })

export const readyStore = async () => {
  const store = createStore()
  // @see https://github.com/championswimmer/vuex-persist#how-to-know-when-async-store-has-been-replaced
  await (store as any).restored
  return store
}

export const settingsStore = getModule(settings, createStore())
