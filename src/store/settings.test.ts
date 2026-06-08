import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  createInitialSettings,
  serializeSettings,
  useSettingsStore,
} from '~/store/settings'

describe('settings store actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test('exports current settings json to clipboard', async () => {
    const writeText = vi.fn(async () => undefined)
    vi.stubGlobal('navigator', {
      clipboard: { writeText },
    })
    const store = useSettingsStore()
    store.setChatVisible({ chatVisible: false })

    await store.exportToClipboard()

    expect(writeText).toHaveBeenCalledWith(serializeSettings(store.$state))
  })

  test('imports settings json from clipboard', async () => {
    const imported = {
      ...createInitialSettings(),
      chatVisible: false,
      maxWidth: 360,
    }
    vi.stubGlobal('navigator', {
      clipboard: {
        readText: vi.fn(async () => serializeSettings(imported)),
      },
    })
    const store = useSettingsStore()

    await store.importFromClipboard()

    expect(store.chatVisible).toBe(false)
    expect(store.maxWidth).toBe(360)
  })

  test('resets settings to defaults', () => {
    const store = useSettingsStore()
    store.setChatVisible({ chatVisible: false })
    store.setMaxWidth({ maxWidth: 360 })

    store.resetState()

    expect(store.$state).toEqual(createInitialSettings())
  })
})
