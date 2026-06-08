import { beforeEach, describe, expect, test, vi } from 'vitest'

type StorageAreaMock = {
  get: ReturnType<typeof vi.fn>
  set: ReturnType<typeof vi.fn>
}

const createStorageArea = (value?: unknown): StorageAreaMock => ({
  get: vi.fn(async (key: string) => ({ [key]: value })),
  set: vi.fn(async () => undefined),
})

const importPersistence = async () => {
  vi.resetModules()
  return await import('~/store/persistence')
}

describe('settings persistence', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  test('loads settings from chrome sync storage', async () => {
    const sync = createStorageArea('{"chatVisible":false}')
    const local = createStorageArea('{"chatVisible":true}')
    vi.stubGlobal('chrome', {
      storage: { local, sync },
    })
    const { loadSettingsCache, settingsStorageKey } = await importPersistence()

    await expect(loadSettingsCache()).resolves.toBe('{"chatVisible":false}')

    expect(sync.get).toHaveBeenCalledWith(settingsStorageKey)
    expect(local.get).not.toHaveBeenCalled()
  })

  test('promotes local settings to sync storage when sync is empty', async () => {
    const sync = createStorageArea()
    const local = createStorageArea('{"chatVisible":false}')
    vi.stubGlobal('chrome', {
      storage: { local, sync },
    })
    const { loadSettingsCache, settingsStorageKey } = await importPersistence()

    await expect(loadSettingsCache()).resolves.toBe('{"chatVisible":false}')

    expect(local.get).toHaveBeenCalledWith(settingsStorageKey)
    expect(sync.set).toHaveBeenCalledWith({
      [settingsStorageKey]: '{"chatVisible":false}',
    })
  })

  test('persists settings writes to chrome sync storage', async () => {
    const sync = createStorageArea()
    const local = createStorageArea()
    vi.stubGlobal('chrome', {
      storage: { local, sync },
    })
    const { settingsStorage, settingsStorageKey } = await importPersistence()

    settingsStorage.setItem(settingsStorageKey, '{"chatVisible":false}')

    expect(sync.set).toHaveBeenCalledWith({
      [settingsStorageKey]: '{"chatVisible":false}',
    })
    expect(local.set).not.toHaveBeenCalled()
  })
})
