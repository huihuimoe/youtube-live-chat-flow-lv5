import { describe, expect, test, vi } from 'vitest'
import type { Settings } from '~/models'
import FlowController from '~/utils/flow-controller'

const createSettings = (overrides: Partial<Settings> = {}): Settings => ({
  background: false,
  backgroundOpacity: 0.8,
  chatVisible: true,
  delayTime: 0,
  displayTime: 5,
  emojiStyle: 'image',
  extendedStyle: '',
  heightType: 'flexible',
  lineHeight: 64,
  lines: 6,
  maxDisplays: 0,
  maxLines: 0,
  maxWidth: 200,
  opacity: 0.8,
  outlineRatio: 0.015,
  overflow: 'overlay',
  stackDirection: 'top_to_bottom',
  styles: {
    guest: { avatar: true, color: '#ffffff', template: 'one-line-with-author' },
    member: {
      avatar: true,
      color: '#ffffff',
      template: 'one-line-with-author',
    },
    moderator: {
      avatar: true,
      color: '#ffffff',
      template: 'one-line-with-author',
    },
    owner: { avatar: true, color: '#ffffff', template: 'one-line-with-author' },
    you: { avatar: true, color: '#ffffff', template: 'one-line-with-author' },
  },
  visibilities: {
    guest: true,
    member: true,
    moderator: true,
    owner: true,
    you: true,
    'super-chat': true,
    'super-sticker': true,
    membership: true,
  },
  ...overrides,
})

describe('FlowController', () => {
  test('waits for filter decisions without interval polling', async () => {
    document.documentElement.classList.add('ylcfr-active')
    const element = document.createElement('div')
    const controller = new FlowController()
    const setIntervalSpy = vi.spyOn(window, 'setInterval')

    const deleted = (
      controller as unknown as {
        validateDeletedMessage: (element: HTMLElement) => Promise<boolean>
      }
    ).validateDeletedMessage(element)
    element.classList.add('ylcfr-filtered-message', 'ylcfr-deleted-message')

    await expect(deleted).resolves.toBe(true)
    expect(setIntervalSpy).not.toHaveBeenCalled()

    setIntervalSpy.mockRestore()
    document.documentElement.classList.remove('ylcfr-active')
  })

  test('caps pending messages from the visible timeline capacity', () => {
    const controller = new FlowController() as unknown as {
      metrics: { videoHeight: number; containerWidth: number }
      settings: Settings
      getPendingLimit: () => number
    }
    controller.settings = createSettings()
    controller.metrics = { containerWidth: 1280, videoHeight: 600 }

    expect(controller.getPendingLimit()).toBe(22)
  })

  test('resets observed layout targets on disconnect', () => {
    const controller = new FlowController() as unknown as {
      container: HTMLElement | undefined
      disconnect: () => void
      observedContainer: HTMLElement | undefined
      observedVideo: HTMLVideoElement | undefined
      resizeObserver: { disconnect: () => void } | undefined
      video: HTMLVideoElement | undefined
    }
    controller.video = document.createElement('video')
    controller.container = document.createElement('div')
    controller.observedVideo = controller.video
    controller.observedContainer = controller.container
    controller.resizeObserver = { disconnect: vi.fn() }

    controller.disconnect()

    expect(controller.video).toBeUndefined()
    expect(controller.container).toBeUndefined()
    expect(controller.observedVideo).toBeUndefined()
    expect(controller.observedContainer).toBeUndefined()
    expect(controller.resizeObserver).toBeUndefined()
  })

  test('keeps only the latest observer when observe calls overlap', async () => {
    vi.useFakeTimers()
    document.body.innerHTML =
      '<div id="items" class="yt-live-chat-item-list-renderer"></div>'
    const observe = vi.fn()
    const disconnect = vi.fn()
    const OriginalMutationObserver = globalThis.MutationObserver
    vi.stubGlobal(
      'MutationObserver',
      class {
        observe = observe
        disconnect = disconnect
      },
    )
    const controller = new FlowController()

    const first = controller.observe()
    const second = controller.observe()
    await vi.advanceTimersByTimeAsync(100)
    await Promise.all([first, second])

    expect(observe).toHaveBeenCalledTimes(1)

    controller.disconnect()
    vi.stubGlobal('MutationObserver', OriginalMutationObserver)
    vi.useRealTimers()
  })

  test('removes active flow messages on disconnect', () => {
    const element = document.createElement('div')
    element.classList.add('ylcf-flow-message')
    document.body.append(element)
    const controller = new FlowController() as unknown as {
      activeMessages: Set<HTMLElement>
      disconnect: () => void
    }
    controller.activeMessages = new Set([element])

    controller.disconnect()

    expect(element.isConnected).toBe(false)
    expect(controller.activeMessages.size).toBe(0)
  })
})
