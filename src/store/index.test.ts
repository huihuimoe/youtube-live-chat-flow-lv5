import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createInitialSettings, serializeSettings } from '~/store/settings'

type StorageAreaMock = {
  get: ReturnType<typeof vi.fn>
  set: ReturnType<typeof vi.fn>
}

const createStorageArea = (value?: unknown): StorageAreaMock => ({
  get: vi.fn(async (key: string) => ({ [key]: value })),
  set: vi.fn(async () => undefined),
})

const importStore = async () => {
  vi.resetModules()
  return await import('~/store')
}

describe('settings store bootstrap', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  test('hydrates saved sync settings and persists later updates', async () => {
    const storedSettings = {
      ...createInitialSettings(),
      chatVisible: false,
      maxWidth: 240,
    }
    const sync = createStorageArea(serializeSettings(storedSettings))
    const local = createStorageArea()
    vi.stubGlobal('chrome', {
      runtime: { sendMessage: vi.fn(async () => undefined) },
      storage: { local, sync },
    })
    const { readyStore, settingsStore } = await importStore()

    await readyStore()
    settingsStore.setMaxWidth({ maxWidth: 180 })

    expect(settingsStore.chatVisible).toBe(false)
    expect(settingsStore.maxWidth).toBe(180)
    await vi.waitFor(() => {
      expect(sync.set).toHaveBeenLastCalledWith({
        settings: serializeSettings({
          ...storedSettings,
          maxWidth: 180,
        }),
      })
    })
  })
})
