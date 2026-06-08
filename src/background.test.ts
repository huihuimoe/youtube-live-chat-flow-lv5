import { beforeEach, describe, expect, test, vi } from 'vitest'

const { listeners, store } = vi.hoisted(() => {
  return {
    listeners: {
      onMessage: [] as Array<
        (
          message: { type: string },
          sender: { tab?: { id?: number } },
          sendResponse: (data?: unknown) => void,
        ) => boolean | undefined
      >,
      onRemoved: [] as Array<(tabId: number) => void>,
      onUpdated: [] as Array<
        (tabId: number, changeInfo: { url?: string }) => void
      >,
    },
    store: {
      settings: { chatVisible: true },
    },
  }
})

vi.mock('~/assets/icon-off.png', () => ({ default: 'icon-off.png' }))
vi.mock('~/assets/icon-on.png', () => ({ default: 'icon-on.png' }))
vi.mock('~/store', () => {
  return {
    readyStore: vi.fn(async () => ({ $state: store.settings })),
  }
})

const sendRuntimeMessage = async (type: string, tabId: number) => {
  const listener = listeners.onMessage[0]
  return await new Promise<unknown>((resolve) => {
    listener({ type }, { tab: { id: tabId } }, resolve)
  })
}

describe('background tab state lifecycle', () => {
  beforeEach(() => {
    vi.resetModules()
    listeners.onMessage.length = 0
    listeners.onRemoved.length = 0
    listeners.onUpdated.length = 0
    vi.stubGlobal('chrome', {
      action: {
        setIcon: vi.fn(),
      },
      runtime: {
        onMessage: {
          addListener: vi.fn((listener) => {
            listeners.onMessage.push(listener)
          }),
        },
      },
      tabs: {
        onRemoved: {
          addListener: vi.fn((listener) => {
            listeners.onRemoved.push(listener)
          }),
        },
        onUpdated: {
          addListener: vi.fn((listener) => {
            listeners.onUpdated.push(listener)
          }),
        },
        query: vi.fn(async () => []),
        sendMessage: vi.fn(),
      },
    })
  })

  test('clears tab state when a tab is removed', async () => {
    await import('~/background')
    await sendRuntimeMessage('iframe-loaded', 1)

    expect(listeners.onRemoved).toHaveLength(1)
    listeners.onRemoved[0](1)
    await sendRuntimeMessage('control-button-clicked', 1)

    expect(chrome.action.setIcon).toHaveBeenLastCalledWith({
      tabId: 1,
      path: 'icon-on.png',
    })
  })
})
