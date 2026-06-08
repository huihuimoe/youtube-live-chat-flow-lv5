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
  const createChatMessageElement = (text: string) => {
    const element = document.createElement('yt-live-chat-text-message-renderer')
    element.innerHTML = `
      <span id="author-name">Author</span>
      <span id="message">${text}</span>
    `
    return element
  }

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

  test('reuses finished flow message elements', async () => {
    const handlers: { finish: Animation['onfinish'] } = { finish: null }
    const animation = {
      pause: vi.fn(),
      play: vi.fn(),
      get onfinish() {
        return handlers.finish
      },
      set onfinish(handler) {
        handlers.finish = handler
      },
    } as unknown as Animation
    const settings = createSettings()
    const video = document.createElement('video')
    const container = document.createElement('div')
    const element = document.createElement('div')
    element.textContent = 'first'
    document.body.append(container)
    const controller = new FlowController() as unknown as {
      activeMessages: Set<HTMLElement>
      createAnimation: (
        element: HTMLElement,
        keyframes: Keyframe[],
        settings: Settings,
      ) => Animation
      createMessageElement: (
        message: {
          author?: string
          html?: string
          messageType?: string
        },
        height: number,
        settings: Settings,
      ) => Promise<HTMLElement | null>
      enabled: boolean
      getLayoutTargets: () => {
        video: HTMLVideoElement
        container: HTMLElement
      }
      getYourName: () => string
      layoutAndAnimateMessage: (element: HTMLElement) => void
      metrics: { containerWidth: number; videoHeight: number }
      settings: Settings
      timelines: []
    }
    Object.defineProperty(video, 'paused', { value: false })
    element.getBoundingClientRect = vi.fn(
      () =>
        ({
          height: 32,
          width: 120,
        }) as DOMRect,
    )
    controller.activeMessages = new Set()
    controller.createAnimation = vi.fn(() => animation)
    controller.enabled = true
    controller.getLayoutTargets = () => ({ video, container })
    controller.getYourName = () => ''
    controller.metrics = { containerWidth: 640, videoHeight: 384 }
    controller.settings = settings
    controller.timelines = []

    controller.layoutAndAnimateMessage(element)
    const finish = handlers.finish
    if (!finish) {
      throw new Error('Expected flow message animation finish handler')
    }
    finish.call(animation, new Event('finish') as AnimationPlaybackEvent)
    const next = await controller.createMessageElement(
      {
        author: 'Author',
        html: 'second',
        messageType: 'text-message',
      },
      64,
      settings,
    )

    expect(element.isConnected).toBe(true)
    expect(element.style.visibility).toBe('hidden')
    expect(controller.activeMessages.size).toBe(0)
    expect(next).toBe(element)
    expect(next?.textContent).toContain('second')
    expect(next?.textContent).not.toContain('first')
  })

  test('counts rendering messages against flow capacity', async () => {
    const settings = createSettings({ lines: 2 })
    const video = document.createElement('video')
    const container = document.createElement('div')
    const controller = new FlowController() as unknown as {
      activeMessages: Set<HTMLElement>
      createMessageElement: (
        message: {
          author?: string
          html?: string
          messageType?: string
        },
        height: number,
        settings: Settings,
      ) => Promise<HTMLElement | null>
      enabled: boolean
      getLayoutTargets: () => {
        video: HTMLVideoElement
        container: HTMLElement
      }
      metrics: { containerWidth: number; videoHeight: number }
      proceed: (element: HTMLElement) => Promise<void>
      settings: Settings
      validateDeletedMessage: (element: HTMLElement) => Promise<boolean>
    }
    Object.defineProperty(video, 'paused', { value: false })
    controller.activeMessages = new Set([
      document.createElement('div'),
      document.createElement('div'),
    ])
    controller.enabled = true
    controller.getLayoutTargets = () => ({ video, container })
    controller.metrics = { containerWidth: 640, videoHeight: 384 }
    controller.settings = settings
    controller.validateDeletedMessage = vi.fn(async () => false)
    let createMessageElementCalls = 0
    const createMessageElement = vi.fn(async () => {
      createMessageElementCalls += 1
      if (createMessageElementCalls === 1) {
        return await new Promise<HTMLElement | null>(() => {
          // Keep the first render in flight so the next message must respect it.
        })
      }
      return null
    })
    controller.createMessageElement = createMessageElement

    void controller.proceed(createChatMessageElement('first'))
    await vi.waitFor(() => {
      expect(createMessageElement).toHaveBeenCalledTimes(1)
    })
    await controller.proceed(createChatMessageElement('second'))

    expect(createMessageElement).toHaveBeenCalledTimes(1)
  })
})
